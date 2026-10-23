import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import zlib from 'node:zlib';
import { isBlockedIp } from './ipGuard.js';
import { ScanError } from './target.js';

const defaultResolve = (hostname) => dns.promises.lookup(hostname, { all: true, verbatim: true });

const TLS_CODES = new Set([
  'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_NOT_YET_VALID', 'CERT_REVOKED',
]);

function mapError(err) {
  if (err instanceof ScanError) return err;
  const code = err?.code ?? '';
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return new ScanError('DNS_FAILED', "Sentinel couldn't find that domain.");
  if (TLS_CODES.has(code)) {
    return new ScanError('TLS_ERROR', "This site's HTTPS certificate isn't trusted by browsers, so Sentinel could not continue.");
  }
  if (['ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH', 'ETIMEDOUT', 'EPIPE'].includes(code)) {
    return new ScanError('UNREACHABLE', "Sentinel couldn't connect to that site.");
  }
  return new ScanError('FETCH_FAILED', 'Sentinel could not load that page.');
}

// createSafeFetch wires SSRF protection into the socket itself. The custom lookup resolves the
// hostname, refuses if ANY answer is private or reserved, and hands the validated address to the
// socket, so a DNS answer cannot change between the check and the connection (DNS rebinding).
export function createSafeFetch({ resolve = defaultResolve, isBlocked = isBlockedIp } = {}) {
  function lookup(hostname, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    Promise.resolve()
      .then(() => resolve(hostname))
      .then((addrs) => {
        if (!addrs?.length) throw new ScanError('DNS_FAILED', "Sentinel couldn't find that domain.");
        if (addrs.some((a) => isBlocked(a.address))) {
          throw new ScanError('BLOCKED_ADDRESS', 'That address points to a private or reserved network, so Sentinel will not scan it.');
        }
        if (options?.all) callback(null, addrs.map(({ address, family }) => ({ address, family })));
        else callback(null, addrs[0].address, addrs[0].family);
      })
      .catch((err) => callback(mapError(err)));
  }

  // Never follows redirects. The caller re-validates every hop.
  return function safeFetch(urlString, { maxBytes = 1_000_000, timeoutMs = 8_000, headers = {}, signal, userAgent = 'SentinelScanner/1.0' } = {}) {
    return new Promise((resolveP, rejectP) => {
      let url;
      try {
        url = new URL(urlString);
      } catch {
        return rejectP(new ScanError('INVALID_URL', 'Enter a valid web address.', 400));
      }
      if (signal?.aborted) return rejectP(new ScanError('SCAN_DEADLINE', 'The scan took too long and was stopped.'));

      const lib = url.protocol === 'https:' ? https : http;
      let settled = false;
      let req;
      let timer;
      const onAbort = () => {
        finish(rejectP, new ScanError('SCAN_DEADLINE', 'The scan took too long and was stopped.'));
        req?.destroy();
      };
      function finish(fn, value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        fn(value);
      }

      timer = setTimeout(() => {
        finish(rejectP, new ScanError('TIMEOUT', 'The site took too long to respond.'));
        req?.destroy();
      }, timeoutMs);
      signal?.addEventListener('abort', onAbort, { once: true });

      req = lib.request(
        url,
        {
          method: 'GET',
          lookup,
          agent: false, // fresh socket per request so every connection goes through the guarded lookup
          headers: { 'user-agent': userAgent, accept: '*/*', 'accept-encoding': 'gzip, deflate, br', ...headers },
        },
        (res) => {
          const encoding = String(res.headers['content-encoding'] ?? '').toLowerCase();
          let stream = res;
          if (encoding === 'gzip' || encoding === 'x-gzip') stream = res.pipe(zlib.createGunzip());
          else if (encoding === 'deflate') stream = res.pipe(zlib.createInflate());
          else if (encoding === 'br') stream = res.pipe(zlib.createBrotliDecompress());
          else if (encoding && encoding !== 'identity') {
            res.destroy();
            return finish(rejectP, new ScanError('UNSUPPORTED_ENCODING', 'Sentinel could not read that response.'));
          }

          const chunks = [];
          let bytes = 0;
          let truncated = false;
          const done = () =>
            finish(resolveP, {
              status: res.statusCode,
              headers: res.headers,
              body: Buffer.concat(chunks).toString('utf8'),
              truncated,
              bytes,
              url: url.href,
            });

          stream.on('data', (chunk) => {
            if (settled) return;
            const room = maxBytes - bytes;
            if (chunk.length > room) {
              chunks.push(chunk.subarray(0, room));
              bytes += room;
              truncated = true;
              done();
              req.destroy(); // stop downloading: decompressed output is capped, so bombs are bounded
              return;
            }
            chunks.push(chunk);
            bytes += chunk.length;
          });
          stream.on('end', done);
          stream.on('error', (err) => finish(rejectP, mapError(err)));
          res.on('error', (err) => finish(rejectP, mapError(err)));
        },
      );
      req.on('error', (err) => finish(rejectP, mapError(err)));
      req.end();
    });
  };
}

export const safeFetch = createSafeFetch();
