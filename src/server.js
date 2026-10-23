import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { loadConfig } from './config.js';
import { createScanner } from './scan.js';
import { safeFetch } from './safeFetch.js';
import { createSlidingWindowLimiter, createCache, createSemaphore, createHostPacer } from './limits.js';
import { parseTarget, ScanError } from './target.js';

const HOUR = 3_600_000;

export function clientIp(req, hops) {
  if (hops > 0) {
    const parts = String(req.headers['x-forwarded-for'] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    // Trust only the address appended by our own proxy chain, never the client-supplied start of the header.
    const ip = parts[parts.length - hops];
    if (ip) return ip;
  }
  return req.socket.remoteAddress ?? 'unknown';
}

function readJson(req, limit = 4096) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) tooLarge = true;
      else chunks.push(c);
    });
    req.on('end', () => {
      if (tooLarge) return reject(new ScanError('BODY_TOO_LARGE', 'Request too large.', 413));
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new ScanError('BAD_JSON', 'Send JSON like {"url":"https://example.com"}.', 400));
      }
    });
    req.on('error', reject);
  });
}

export function createApp({ config, scanner, now = Date.now, log = (o) => console.log(JSON.stringify(o)) }) {
  const requestLimiter = createSlidingWindowLimiter({ windowMs: HOUR, max: config.requestsPerHourPerClient, now });
  const scanLimiter = createSlidingWindowLimiter({ windowMs: HOUR, max: config.scansPerHourPerClient, now });
  const globalLimiter = createSlidingWindowLimiter({ windowMs: HOUR, max: config.scansPerHourGlobal, now });
  const cache = createCache({ ttlMs: config.hostCooldownMs, maxEntries: config.cacheMaxEntries, now });
  const slots = createSemaphore(config.maxConcurrentScans);
  const inflight = new Map();
  // A host that errored, refused us, or looked unhealthy gets a short cooldown too, so retries cannot hammer it.
  const errorCache = createCache({ ttlMs: config.errorCooldownMs ?? 120_000, maxEntries: config.cacheMaxEntries, now });
  const COOLDOWN_CODES = new Set(['TARGET_UNHEALTHY', 'ROBOTS_DISALLOW', 'TIMEOUT', 'UNREACHABLE', 'TLS_ERROR']);

  const send = (res, status, body, extra = {}) => {
    const payload = JSON.stringify(body);
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(payload), ...extra });
    res.end(payload);
  };
  const fail = (res, status, code, message, extra) => send(res, status, { error: { code, message } }, extra);

  async function handle(req, res) {
    const origin = req.headers.origin;
    const allowAll = config.allowedOrigins.includes('*');
    const baseHeaders = {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      vary: 'Origin',
    };
    if (origin && (allowAll || config.allowedOrigins.includes(origin))) {
      baseHeaders['access-control-allow-origin'] = allowAll ? '*' : origin;
      baseHeaders['access-control-allow-methods'] = 'POST, OPTIONS';
      baseHeaders['access-control-allow-headers'] = 'content-type';
      baseHeaders['access-control-max-age'] = '600';
    }
    for (const [k, v] of Object.entries(baseHeaders)) res.setHeader(k, v);

    const { pathname } = new URL(req.url ?? '/', 'http://local');
    if (req.method === 'OPTIONS') return void res.writeHead(204).end();
    if (req.method === 'GET' && pathname === '/healthz') return send(res, 200, { ok: true });
    // Returns only the caller's own address as the server sees it. Use it once after deploy to confirm
    // TRUST_PROXY_HOPS is right (two different networks must show two different addresses).
    if (req.method === 'GET' && pathname === '/api/whoami') return send(res, 200, { ip: clientIp(req, config.trustProxyHops) });
    if (!(req.method === 'POST' && pathname === '/api/scan')) return fail(res, 404, 'NOT_FOUND', 'Not found.');
    if (!/application\/json/i.test(String(req.headers['content-type'] ?? ''))) return fail(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Send JSON.');

    const ip = clientIp(req, config.trustProxyHops);
    const gate = requestLimiter.take(ip);
    if (!gate.ok) return fail(res, 429, 'RATE_LIMITED', 'Too many requests from your connection. Try again later.', { 'retry-after': String(Math.ceil(gate.retryAfterMs / 1000)) });

    const started = now();
    const body = await readJson(req);
    const target = parseTarget(body?.url); // throws ScanError (400) for anything unsafe or invalid

    const cached = cache.get(target.origin);
    if (cached) {
      log({ evt: 'scan', origin: target.origin, cached: true, ms: now() - started });
      return send(res, 200, { ...cached.value, cached: true, cachedAt: new Date(cached.at).toISOString() });
    }

    const failedBefore = errorCache.get(target.origin);
    if (failedBefore) {
      const { code, message, status } = failedBefore.value;
      return fail(res, status, code, `${message} (Sentinel will not retry this site for a couple of minutes.)`);
    }

    let promise = inflight.get(target.origin);
    if (!promise) {
      const mine = scanLimiter.take(ip);
      if (!mine.ok) {
        return fail(res, 429, 'RATE_LIMITED', `You have used your scans for this hour. Try again in about ${Math.ceil(mine.retryAfterMs / 60_000)} minutes.`, { 'retry-after': String(Math.ceil(mine.retryAfterMs / 1000)) });
      }
      const all = globalLimiter.take('global');
      if (!all.ok || !slots.tryAcquire()) {
        return fail(res, 503, 'BUSY', 'Sentinel is busy right now. Try again in a minute.', { 'retry-after': '60' });
      }
      promise = scanner(target.origin)
        .then((report) => {
          cache.set(target.origin, report);
          return report;
        })
        .catch((err) => {
          if (err instanceof ScanError && COOLDOWN_CODES.has(err.code)) {
            errorCache.set(target.origin, { code: err.code, message: err.message, status: err.status });
          }
          throw err;
        })
        .finally(() => {
          slots.release();
          inflight.delete(target.origin);
        });
      inflight.set(target.origin, promise);
    }

    const report = await promise;
    log({ evt: 'scan', origin: target.origin, cached: false, ms: now() - started, grade: report.grade, findings: report.findings.length, requests: report.coverage.requests });
    return send(res, 200, report);
  }

  const listener = (req, res) => {
    handle(req, res).catch((err) => {
      if (err instanceof ScanError) {
        log({ evt: 'scan_error', code: err.code });
        return fail(res, err.status, err.code, err.message);
      }
      log({ evt: 'error', message: String(err?.message ?? err).slice(0, 200) });
      return fail(res, 500, 'INTERNAL', 'Something went wrong on our side.');
    });
  };
  const server = http.createServer(listener);
  // A host app (for example Express) can route the scanner paths to this instead of running a second server.
  server.listener = listener;
  return server;
}

export function startServer(config = loadConfig()) {
  const pacer = createHostPacer({ spacingMs: config.requestSpacingMs });
  const scanner = createScanner({ config, safeFetch, pacer });
  const server = createApp({ config, scanner });
  server.headersTimeout = 10_000;
  server.requestTimeout = 15_000;
  server.keepAliveTimeout = 5_000;
  server.listen(config.port, () => {
    console.log(JSON.stringify({ evt: 'listening', port: config.port, contact: config.contact }));
    if (config.contact === 'unset') console.warn('Set SCANNER_CONTACT so site owners can reach you about the scanner.');
  });
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) startServer();
