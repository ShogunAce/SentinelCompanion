import { parseTarget, ScanError } from './target.js';
import { isAllowed } from './robots.js';
import { runChecks } from './checks.js';
import { buildReport } from './report.js';

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export function extractScriptUrls(html, base) {
  const origin = new URL(base).origin;
  const out = new Set();
  const add = (raw) => {
    try {
      const u = new URL(raw, base);
      if (u.origin === origin && !u.pathname.endsWith('.map')) {
        u.hash = '';
        out.add(u.href);
      }
    } catch {
      /* ignore malformed URLs */
    }
  };
  for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) add(m[1]);
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    if (/\brel\s*=\s*["']?modulepreload/i.test(m[0])) {
      const href = m[0].match(/\bhref\s*=\s*["']([^"']+)["']/i);
      if (href) add(href[1]);
    }
  }
  return [...out];
}

const UNHEALTHY = 'The site is returning errors or asking for less traffic, so Sentinel stopped to avoid adding load. Try again later.';

// One scan = a small, sequential, polite visit: robots.txt, the home page, and a few of its own scripts.
export function createScanner({ config, safeFetch, pacer }) {
  return async function scan(input, { signal } = {}) {
    const deadline = signal ?? AbortSignal.timeout(config.scanDeadlineMs);
    const target = parseTarget(input);
    const budget = { used: 0 };
    const robots = new Map();
    const guard = () => {
      if (deadline.aborted) throw new ScanError('SCAN_DEADLINE', 'The scan took too long and was stopped.');
    };

    async function request(url, { maxBytes, accept }) {
      guard();
      if (budget.used >= config.maxRequestsPerScan) throw new ScanError('BUDGET_EXCEEDED', 'Request budget reached.');
      budget.used += 1;
      await pacer.wait(new URL(url).host);
      guard();
      return safeFetch(url, { maxBytes, timeoutMs: config.requestTimeoutMs, signal: deadline, userAgent: config.userAgent, headers: { accept } });
    }

    async function robotsText(origin) {
      if (robots.has(origin)) return robots.get(origin);
      const res = await request(`${origin}/robots.txt`, { maxBytes: config.maxRobotsBytes, accept: 'text/plain,*/*;q=0.5' });
      if (res.status >= 500 || res.status === 429) throw new ScanError('TARGET_UNHEALTHY', UNHEALTHY);
      const text = res.status === 200 ? res.body : '';
      robots.set(origin, text);
      return text;
    }

    async function ensureAllowed(url) {
      const u = new URL(url);
      const text = await robotsText(u.origin);
      if (!isAllowed(text, config.userAgentToken, u.pathname + u.search)) {
        throw new ScanError(
          'ROBOTS_DISALLOW',
          `This site's robots.txt asks automated tools not to fetch ${u.pathname}. If you own it, you can allow ${config.userAgentToken} in robots.txt and try again.`,
        );
      }
    }

    // Page fetch with manual, re-validated redirects.
    let current = target.url.href;
    let hops = 0;
    let page;
    for (;;) {
      await ensureAllowed(current);
      const res = await request(current, { maxBytes: config.maxHtmlBytes, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5' });
      if (REDIRECTS.has(res.status) && res.headers.location) {
        hops += 1;
        if (hops > config.maxRedirects) throw new ScanError('TOO_MANY_REDIRECTS', 'That address redirects too many times.');
        let next;
        try {
          next = new URL(res.headers.location, current);
        } catch {
          throw new ScanError('INVALID_REDIRECT', 'That site redirected to an invalid address.');
        }
        current = parseTarget(next.href, { keepPath: true }).url.href; // re-validates scheme, port and host
        continue;
      }
      page = res;
      break;
    }
    if (page.status >= 500 || page.status === 429) throw new ScanError('TARGET_UNHEALTHY', UNHEALTHY);

    const contentType = String(page.headers['content-type'] ?? '');
    const isHtml = /html/i.test(contentType) || (!contentType && /<html|<!doctype html/i.test(page.body.slice(0, 1000)));
    const scripts = [];
    let found = 0;
    let stoppedEarly = false;
    let truncatedResources = page.truncated ? 1 : 0;

    if (isHtml) {
      const urls = extractScriptUrls(page.body, current);
      found = urls.length;
      for (const src of urls.slice(0, config.maxScripts)) {
        try {
          await ensureAllowed(src);
          const res = await request(src, { maxBytes: config.maxScriptBytes, accept: '*/*' });
          if (res.status >= 500 || res.status === 429) {
            stoppedEarly = true; // the site is struggling: stop adding load
            break;
          }
          if (res.status === 200) {
            scripts.push({ url: src, body: res.body, truncated: res.truncated });
            if (res.truncated) truncatedResources += 1;
          }
        } catch (err) {
          if (err.code === 'BUDGET_EXCEEDED') {
            stoppedEarly = true;
            break;
          }
          if (err.code === 'SCAN_DEADLINE') throw err;
          // any other script error: skip that script and keep going
        }
      }
    }

    const checks = runChecks({ page: { ...page, url: current }, scripts });
    return buildReport({
      requestedOrigin: target.origin,
      finalOrigin: new URL(current).origin,
      checks,
      coverage: {
        requests: budget.used,
        pageIsHtml: isHtml,
        scriptsFound: found,
        scriptsChecked: scripts.length,
        stoppedEarly: stoppedEarly || found > config.maxScripts,
        truncatedResources,
      },
    });
  };
}
