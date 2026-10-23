import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import zlib from 'node:zlib';
import { createSafeFetch } from '../src/safeFetch.js';
import { ScanError } from '../src/target.js';

function serve(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }) }));
  });
}
// Test double that points any hostname at the local server and disables the private-address check.
const permissive = createSafeFetch({ resolve: async () => [{ address: '127.0.0.1', family: 4 }], isBlocked: () => false });

test('fetches a response and pins the connection to the resolved address', async () => {
  const s = await serve((req, res) => { res.setHeader('x-seen-host', req.headers.host); res.end('hello'); });
  try {
    const r = await permissive(`http://site.example:${s.port}/`);
    assert.equal(r.status, 200);
    assert.equal(r.body, 'hello');
    assert.equal(r.truncated, false);
  } finally { await s.close(); }
});

test('caps the body size and reports truncation', async () => {
  const s = await serve((req, res) => res.end('a'.repeat(50_000)));
  try {
    const r = await permissive(`http://site.example:${s.port}/`, { maxBytes: 1000 });
    assert.equal(r.body.length, 1000);
    assert.equal(r.truncated, true);
  } finally { await s.close(); }
});

test('caps DECOMPRESSED size so a gzip bomb stays bounded', async () => {
  const bomb = zlib.gzipSync(Buffer.alloc(20_000_000, 'a'));
  const s = await serve((req, res) => { res.setHeader('content-encoding', 'gzip'); res.end(bomb); });
  try {
    const r = await permissive(`http://site.example:${s.port}/`, { maxBytes: 10_000 });
    assert.equal(r.body.length, 10_000);
    assert.equal(r.truncated, true);
  } finally { await s.close(); }
});

test('does not follow redirects, it returns them', async () => {
  const s = await serve((req, res) => { res.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data' }); res.end(); });
  try {
    const r = await permissive(`http://site.example:${s.port}/`);
    assert.equal(r.status, 302);
    assert.equal(r.headers.location, 'http://169.254.169.254/latest/meta-data');
  } finally { await s.close(); }
});

test('times out a server that never answers', async () => {
  const s = await serve(() => {});
  try {
    await assert.rejects(permissive(`http://site.example:${s.port}/`, { timeoutMs: 200 }), (e) => e.code === 'TIMEOUT');
  } finally { await s.close(); }
});

test('an aborted signal stops the request', async () => {
  const s = await serve(() => {});
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 100);
    await assert.rejects(permissive(`http://site.example:${s.port}/`, { signal: ctrl.signal, timeoutMs: 5000 }), (e) => e.code === 'SCAN_DEADLINE');
  } finally { await s.close(); }
});

test('refuses when DNS answers a private address (default guard)', async () => {
  for (const address of ['127.0.0.1', '10.0.0.5', '169.254.169.254', '::1', 'fd00::1']) {
    const f = createSafeFetch({ resolve: async () => [{ address, family: address.includes(':') ? 6 : 4 }] });
    await assert.rejects(f('http://public-looking.example/'), (e) => e instanceof ScanError && e.code === 'BLOCKED_ADDRESS', address);
  }
});

test('refuses when ANY answer is private (rebinding trick with mixed records)', async () => {
  const f = createSafeFetch({ resolve: async () => [{ address: '93.184.216.34', family: 4 }, { address: '10.0.0.5', family: 4 }] });
  await assert.rejects(f('http://mixed.example/'), (e) => e.code === 'BLOCKED_ADDRESS');
});

test('maps unknown domains to a friendly error', async () => {
  const f = createSafeFetch({ resolve: async () => { const e = new Error('nf'); e.code = 'ENOTFOUND'; throw e; } });
  await assert.rejects(f('http://nowhere.example/'), (e) => e.code === 'DNS_FAILED');
});
