import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { loadConfig } from '../src/config.js';
import { createScanner, extractScriptUrls } from '../src/scan.js';
import { createApp } from '../src/server.js';
import { createSlidingWindowLimiter, createCache, createSemaphore, createHostPacer } from '../src/limits.js';
import { ScanError } from '../src/target.js';

const config = loadConfig({ SCANNER_CONTACT: 'abuse@example.invalid' });
const noPace = { wait: async () => {} };
const html = (extra = '') => `<!doctype html><html><head>${extra}</head><body>app</body></html>`;

// A fake network: routes map url -> response (or a function). Records every call in order.
function fakeNet(routes) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    const r = typeof routes[url] === 'function' ? routes[url]() : routes[url];
    if (r instanceof Error) throw r;
    return { status: 404, headers: {}, body: '', truncated: false, ...(r ?? {}) };
  };
  return { fn, calls };
}
const page = (body, headers = {}) => ({ status: 200, headers: { 'content-type': 'text/html', ...headers }, body });

test('extractScriptUrls keeps same-origin scripts and modulepreload, drops third-party and maps', () => {
  const body = html(`<script src="/a.js"></script><script src="https://cdn.other.com/x.js"></script><script src="b.js.map"></script><link rel="modulepreload" href="/c.js">`);
  assert.deepEqual(extractScriptUrls(body, 'https://app.example.com/'), ['https://app.example.com/a.js', 'https://app.example.com/c.js']);
});

test('a scan is sequential, polite and stays within the request budget', async () => {
  const scripts = Array.from({ length: 9 }, (_, i) => `<script src="/s${i}.js"></script>`).join('');
  const routes = { 'https://app.example.com/robots.txt': { status: 200, body: 'User-agent: *\nDisallow: /admin' }, 'https://app.example.com/': page(html(scripts)) };
  for (let i = 0; i < 9; i++) routes[`https://app.example.com/s${i}.js`] = { status: 200, body: 'ok' };
  const net = fakeNet(routes);
  const report = await createScanner({ config, safeFetch: net.fn, pacer: noPace })('app.example.com/deep/path?q=1');
  assert.equal(net.calls[0], 'https://app.example.com/robots.txt');
  assert.equal(net.calls[1], 'https://app.example.com/'); // deep path and query are never requested
  assert.ok(net.calls.length <= config.maxRequestsPerScan);
  assert.equal(report.coverage.scriptsChecked, config.maxScripts);
  assert.equal(report.coverage.scriptsFound, 9);
  assert.equal(report.coverage.stoppedEarly, true);
  assert.equal(net.calls.filter((u) => u.includes('/admin')).length, 0);
});

test('never probes hidden paths such as .env, admin or source maps', async () => {
  const net = fakeNet({ 'https://app.example.com/': page(html('<script src="/a.js"></script>')), 'https://app.example.com/a.js': { status: 200, body: 'x\n//# sourceMappingURL=a.js.map' } });
  await createScanner({ config, safeFetch: net.fn, pacer: noPace })('https://app.example.com');
  assert.ok(net.calls.every((u) => /robots\.txt$|\/$|\/a\.js$/.test(u)), net.calls.join(','));
});

test('robots.txt that disallows the scanner stops the scan before the page is fetched', async () => {
  const net = fakeNet({ 'https://app.example.com/robots.txt': { status: 200, body: 'User-agent: SentinelScanner\nDisallow: /' } });
  await assert.rejects(createScanner({ config, safeFetch: net.fn, pacer: noPace })('https://app.example.com'), (e) => e.code === 'ROBOTS_DISALLOW');
  assert.deepEqual(net.calls, ['https://app.example.com/robots.txt']);
});

test('a struggling site (5xx or 429) stops the scan to avoid adding load', async () => {
  for (const status of [500, 503, 429]) {
    const net = fakeNet({ 'https://app.example.com/robots.txt': { status } });
    await assert.rejects(createScanner({ config, safeFetch: net.fn, pacer: noPace })('https://app.example.com'), (e) => e.code === 'TARGET_UNHEALTHY');
    assert.equal(net.calls.length, 1);
  }
  const net = fakeNet({ 'https://app.example.com/': { status: 503 } });
  await assert.rejects(createScanner({ config, safeFetch: net.fn, pacer: noPace })('https://app.example.com'), (e) => e.code === 'TARGET_UNHEALTHY');
});

test('a script that returns 5xx stops fetching further scripts but still reports', async () => {
  const net = fakeNet({
    'https://app.example.com/': page(html('<script src="/a.js"></script><script src="/b.js"></script>')),
    'https://app.example.com/a.js': { status: 503 },
    'https://app.example.com/b.js': { status: 200, body: 'ok' },
  });
  const r = await createScanner({ config, safeFetch: net.fn, pacer: noPace })('https://app.example.com');
  assert.equal(r.coverage.stoppedEarly, true);
  assert.ok(!net.calls.includes('https://app.example.com/b.js'));
});

test('redirects are capped, re-validated and trigger robots for the new origin', async () => {
  const net = fakeNet({
    'https://example.com/': { status: 301, headers: { location: 'https://www.example.com/en' } },
    'https://www.example.com/en': page(html()),
    'https://www.example.com/robots.txt': { status: 200, body: '' },
  });
  const r = await createScanner({ config, safeFetch: net.fn, pacer: noPace })('https://example.com');
  assert.equal(r.origin, 'https://www.example.com');
  assert.ok(net.calls.indexOf('https://www.example.com/robots.txt') < net.calls.indexOf('https://www.example.com/en'));

  const loop = fakeNet({ 'https://a.example.com/': { status: 302, headers: { location: '/' } } });
  await assert.rejects(createScanner({ config, safeFetch: loop.fn, pacer: noPace })('https://a.example.com'), (e) => e.code === 'TOO_MANY_REDIRECTS');
});

test('a redirect to a private or internal target is refused without a request', async () => {
  for (const location of ['http://169.254.169.254/latest/meta-data', 'http://127.0.0.1:8080/', 'http://localhost/', 'file:///etc/passwd']) {
    const net = fakeNet({ 'https://app.example.com/': { status: 302, headers: { location } } });
    await assert.rejects(createScanner({ config, safeFetch: net.fn, pacer: noPace })('https://app.example.com'), (e) => e instanceof ScanError && e.status === 400, location);
    assert.ok(!net.calls.some((u) => /169\.254|127\.0\.0\.1|localhost|file:/.test(u)), `must not request ${location}`);
  }
});

test('the HTML is never executed or followed beyond same-origin scripts', async () => {
  const net = fakeNet({ 'https://app.example.com/': page(html('<script src="https://evil.example.net/x.js"></script><iframe src="https://evil.example.net/"></iframe>')) });
  await createScanner({ config, safeFetch: net.fn, pacer: noPace })('https://app.example.com');
  assert.ok(!net.calls.some((u) => u.includes('evil.example.net')));
});

test('end to end: a leaky app produces the expected report', async () => {
  const key = ['sk', 'live', 'a1B2c3D4e5F6g7H8i9J0k1L2'].join('_');
  const net = fakeNet({ 'https://app.example.com/': page(html('<script src="/main.js"></script>')), 'https://app.example.com/main.js': { status: 200, body: `fetch("/api",{headers:{k:"${key}"}})` } });
  const r = await createScanner({ config, safeFetch: net.fn, pacer: noPace })('https://app.example.com');
  const expected = r.findings.reduce((sum, f) => sum + f.deduction, 0);
  assert.equal(r.score, Math.max(0, 100 - expected));
  assert.equal(r.grade, r.score >= 90 ? 'A' : r.score >= 80 ? 'B' : r.score >= 65 ? 'C' : r.score >= 50 ? 'D' : 'F');
  assert.equal(r.findings[0].severity, 'Critical');
  assert.ok(!JSON.stringify(r).includes(key));
  assert.ok(r.checked.some((c) => c.id === 'secrets' && c.status === 'finding'));
});

test('limiters: sliding window, cache ttl and eviction, semaphore, host pacing', async () => {
  let t = 0;
  const now = () => t;
  const lim = createSlidingWindowLimiter({ windowMs: 1000, max: 2, now });
  assert.ok(lim.take('a').ok && lim.take('a').ok);
  assert.equal(lim.take('a').ok, false);
  assert.ok(lim.take('b').ok);
  t = 1500;
  assert.ok(lim.take('a').ok);

  const cache = createCache({ ttlMs: 100, maxEntries: 2, now });
  cache.set('x', 1); cache.set('y', 2); cache.set('z', 3);
  assert.equal(cache.get('x'), null);
  assert.equal(cache.get('z').value, 3);
  t += 200;
  assert.equal(cache.get('z'), null);

  const sem = createSemaphore(2);
  assert.ok(sem.tryAcquire() && sem.tryAcquire());
  assert.equal(sem.tryAcquire(), false);
  sem.release();
  assert.ok(sem.tryAcquire());

  const slept = [];
  const pacer = createHostPacer({ spacingMs: 400, now: () => 1000, sleep: async (ms) => slept.push(ms) });
  await Promise.all([pacer.wait('h'), pacer.wait('h'), pacer.wait('h'), pacer.wait('other')]);
  assert.deepEqual(slept, [400, 800]); // concurrent scans of one host are spread out, other hosts are unaffected
});

async function withApp(scanner, fn, overrides = {}) {
  const app = createApp({ config: { ...config, allowedOrigins: ['https://sentinel.example'], trustProxyHops: 0, ...overrides }, scanner, log: () => {} });
  await new Promise((r) => app.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${app.address().port}`;
  const post = (body, headers = {}) => fetch(`${base}/api/scan`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
  try { await fn({ base, post }); } finally { app.closeAllConnections?.(); await new Promise((r) => app.close(r)); }
}

test('API: validation, errors, CORS, caching, per-client limit and in-flight dedupe', async () => {
  let runs = 0;
  const report = { grade: 'B', findings: [], coverage: { requests: 2 } };
  const scanner = async () => { runs += 1; await new Promise((r) => setTimeout(r, 50)); return report; };
  await withApp(scanner, async ({ base, post }) => {
    assert.equal((await fetch(`${base}/healthz`)).status, 200);
    assert.equal((await fetch(`${base}/nope`)).status, 404);
    assert.ok((await (await fetch(`${base}/api/whoami`)).json()).ip);
    assert.equal((await post('{bad json')).status, 400);
    assert.equal((await post({ url: 'http://169.254.169.254/' })).status, 400);
    assert.equal((await post({ url: 'localhost' })).status, 400);
    assert.equal((await post({ url: 'x'.repeat(10_000) })).status, 413);
    assert.equal((await fetch(`${base}/api/scan`, { method: 'POST', body: '{}' })).status, 415);

    const pre = await fetch(`${base}/api/scan`, { method: 'OPTIONS', headers: { origin: 'https://sentinel.example' } });
    assert.equal(pre.headers.get('access-control-allow-origin'), 'https://sentinel.example');
    const other = await fetch(`${base}/api/scan`, { method: 'OPTIONS', headers: { origin: 'https://evil.example' } });
    assert.equal(other.headers.get('access-control-allow-origin'), null);

    const [a, b] = await Promise.all([post({ url: 'site-one.example.com' }), post({ url: 'https://site-one.example.com/other' })]);
    assert.equal(a.status, 200); assert.equal(b.status, 200);
    assert.equal(runs, 1, 'simultaneous scans of one origin share a single scan');
    const again = await (await post({ url: 'site-one.example.com' })).json();
    assert.equal(again.cached, true);
    assert.equal(runs, 1);
  });
});

test('API: fresh scans are limited per client and globally, and capacity is bounded', async () => {
  const scanner = async () => ({ grade: 'A', findings: [], coverage: { requests: 1 } });
  await withApp(scanner, async ({ post }) => {
    assert.equal((await post({ url: 'a1.example.com' })).status, 200);
    assert.equal((await post({ url: 'a2.example.com' })).status, 200);
    const limited = await post({ url: 'a3.example.com' });
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
    assert.equal((await post({ url: 'a1.example.com' })).status, 200, 'cached result does not consume a scan');
  }, { scansPerHourPerClient: 2 });

  await withApp(scanner, async ({ post }) => {
    assert.equal((await post({ url: 'b1.example.com' })).status, 200);
    assert.equal((await post({ url: 'b2.example.com' })).status, 503);
  }, { scansPerHourGlobal: 1 });

  const slow = async () => { await new Promise((r) => setTimeout(r, 150)); return { grade: 'A', findings: [], coverage: { requests: 1 } }; };
  await withApp(slow, async ({ post }) => {
    const [x, y] = await Promise.all([post({ url: 'c1.example.com' }), post({ url: 'c2.example.com' })]);
    assert.deepEqual([x.status, y.status].sort(), [200, 503]);
  }, { maxConcurrentScans: 1 });
});

test('API: the listener can be mounted inside another server', async () => {
  const app = createApp({ config: { ...config, trustProxyHops: 0 }, scanner: async () => ({ grade: 'A', findings: [], coverage: { requests: 1 } }), log: () => {} });
  assert.equal(typeof app.listener, 'function');
  const host = http.createServer((req, res) => {
    if (req.url.startsWith('/api/') || req.url === '/healthz') return app.listener(req, res);
    res.end('host app');
  });
  await new Promise((r) => host.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${host.address().port}`;
  try {
    assert.equal(await (await fetch(`${base}/`)).text(), 'host app');
    assert.equal((await fetch(`${base}/healthz`)).status, 200);
    const r = await fetch(`${base}/api/scan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'mounted.example.com' }) });
    assert.equal(r.status, 200);
  } finally { host.closeAllConnections?.(); await new Promise((r) => host.close(r)); }
});

test('API: a host that errored is not retried for a cooldown period', async () => {
  let runs = 0;
  const unhealthy = async () => { runs += 1; throw new ScanError('TARGET_UNHEALTHY', 'site is struggling'); };
  await withApp(unhealthy, async ({ post }) => {
    const first = await post({ url: 'e1.example.com' });
    assert.equal(first.status, 422);
    const second = await post({ url: 'e1.example.com' });
    assert.equal(second.status, 422);
    assert.match((await second.json()).error.message, /will not retry/);
    assert.equal(runs, 1, 'second request must not touch the site again');
  });
});

test('API: scanner errors become friendly JSON and internals never leak', async () => {
  const throwing = async () => { throw new ScanError('ROBOTS_DISALLOW', 'robots says no'); };
  await withApp(throwing, async ({ post }) => {
    const r = await post({ url: 'd1.example.com' });
    assert.equal(r.status, 422);
    assert.equal((await r.json()).error.code, 'ROBOTS_DISALLOW');
  });
  const crashing = async () => { throw new Error('secret internal path /srv/app/key.pem'); };
  await withApp(crashing, async ({ post }) => {
    const r = await post({ url: 'd2.example.com' });
    assert.equal(r.status, 500);
    assert.ok(!JSON.stringify(await r.json()).includes('key.pem'));
  });
});
