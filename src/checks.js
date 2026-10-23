import { Buffer } from 'node:buffer';

// Deterministic, passive checks only. Nothing here sends a request: it reads the page and the
// scripts the page already loads. Secrets are never echoed in full; only the first 4 characters.

const redact = (v) => `${v.slice(0, 4)}…[${v.length} chars]`;
const looksPlaceholder = (v) =>
  /(.)\1{9,}/.test(v) || /example|placeholder|your[_-]?(?:key|token|secret)|not_a_real|xxxx|0000000/i.test(v);
const header = (headers, name) => {
  const v = headers[name];
  return Array.isArray(v) ? v.join(', ') : (v ?? '');
};
const pathOf = (url) => {
  try {
    return new URL(url).pathname.slice(0, 80);
  } catch {
    return String(url).slice(0, 80);
  }
};
const stripQuery = (url) => url.split(/[?#]/)[0].slice(0, 120);

const SECRET_PATTERNS = [
  { kind: 'stripe', label: 'Stripe secret key', type: 'secret', severity: 'Critical', re: /\b(?:sk|rk)_live_[0-9A-Za-z]{20,}\b/g },
  { kind: 'anthropic', label: 'Anthropic API key', type: 'secret', severity: 'Critical', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { kind: 'openai', label: 'OpenAI API key', type: 'secret', severity: 'Critical', re: /\bsk-(?!ant-)(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b/g },
  { kind: 'github', label: 'GitHub token', type: 'secret', severity: 'Critical', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
  { kind: 'slack', label: 'Slack token', type: 'secret', severity: 'Critical', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { kind: 'sendgrid', label: 'SendGrid API key', type: 'secret', severity: 'Critical', re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g },
  { kind: 'private-key', label: 'private key', type: 'secret', severity: 'Critical', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g, headerOnly: true },
  { kind: 'aws', label: 'AWS access key ID', type: 'review-key', severity: 'Warning', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { kind: 'google', label: 'Google API key', type: 'review-key', severity: 'Warning', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
];
const JWT_RE = /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;

function decodeJwtPayload(jwt) {
  try {
    return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export function scanSecrets(sources) {
  const findings = [];
  const observations = [];
  const seen = new Set();
  for (const src of sources) {
    const where = pathOf(src.url);
    for (const p of SECRET_PATTERNS) {
      for (const m of src.text.matchAll(p.re)) {
        const value = m[0];
        if (!p.headerOnly && looksPlaceholder(value)) continue;
        const key = `${p.kind}:${value}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          type: p.type,
          severity: p.severity,
          detail: { kind: p.kind, label: p.label, where },
          evidence: p.headerOnly ? `${where}\nPrivate key header found (value not shown)` : `${where}\n${p.label}: ${redact(value)}`,
        });
      }
    }
    for (const m of src.text.matchAll(JWT_RE)) {
      const payload = decodeJwtPayload(m[0]);
      if (!payload) continue;
      const key = `jwt:${m[0]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (payload.role === 'service_role') {
        findings.push({
          type: 'service-role',
          severity: 'Critical',
          detail: { where },
          evidence: `${where}\nToken with role "service_role": ${redact(m[0])}`,
        });
      }
    }
  }
  const all = sources.map((s) => s.text).join('\n');
  if (/[a-z0-9]{20}\.supabase\.co/i.test(all)) {
    observations.push({
      id: 'supabase',
      text: 'This app appears to use Supabase. Public anon keys are normal. Whether your database rules (Row Level Security) protect your data cannot be checked from outside, so make sure they are on.',
    });
  }
  if (/firebaseio\.com|firebaseapp\.com|firestore\.googleapis\.com/i.test(all)) {
    observations.push({
      id: 'firebase',
      text: 'This app appears to use Firebase. Its web config is meant to be public. Whether your Firebase security rules protect your data cannot be checked from outside.',
    });
  }
  return { findings: findings.slice(0, 10), observations };
}

function parseCookies(raw) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.map((line) => {
    const [pair, ...attrs] = line.split(';');
    const a = attrs.map((s) => s.trim().toLowerCase());
    return {
      name: pair.split('=')[0].trim().slice(0, 60),
      secure: a.includes('secure'),
      httpOnly: a.includes('httponly'),
      sameSite: a.some((x) => x.startsWith('samesite=')),
    };
  });
}

const MIXED = [
  { re: /<script\b[^>]*\bsrc\s*=\s*["'](http:\/\/[^"']+)["']/gi, severity: 'Warning' },
  { re: /<link\b[^>]*\bhref\s*=\s*["'](http:\/\/[^"']+\.css[^"']*)["']/gi, severity: 'Minor' },
  { re: /<(?:img|iframe|source|video|audio)\b[^>]*\bsrc\s*=\s*["'](http:\/\/[^"']+)["']/gi, severity: 'Minor' },
];

export function runChecks({ page, scripts }) {
  const final = new URL(page.url);
  const isHttps = final.protocol === 'https:';
  const h = page.headers;
  const checks = [];
  const add = (id, label, findings = [], skipped = null) => checks.push({ id, label, findings, skipped });

  // 1. Transport
  {
    const findings = [];
    if (!isHttps) {
      if (/<input\b[^>]*type\s*=\s*["']?password/i.test(page.body)) {
        findings.push({ type: 'password-over-http', severity: 'Critical', detail: {}, evidence: `Final address: ${final.origin}/\nA password field is served over plain HTTP` });
      } else {
        findings.push({ type: 'no-https', severity: 'Warning', detail: {}, evidence: `Final address: ${final.origin}/\nNo redirect to HTTPS was found` });
      }
    }
    add('https', 'Page is served over HTTPS', findings);
  }

  // 2. Content-Security-Policy
  {
    const csp = header(h, 'content-security-policy');
    const reportOnly = header(h, 'content-security-policy-report-only');
    const findings = [];
    if (!csp) {
      findings.push({
        type: 'csp-missing',
        severity: 'Warning',
        detail: {},
        evidence: `Response header\nContent-Security-Policy: [not present]${reportOnly ? '\n(Report-Only policy found, which does not enforce)' : ''}`,
      });
    } else if (/'unsafe-eval'/.test(csp) || /script-src[^;]*\s\*(\s|;|$)/.test(csp)) {
      findings.push({ type: 'csp-weak', severity: 'Minor', detail: {}, evidence: `Response header\nContent-Security-Policy: ${csp.slice(0, 200)}` });
    }
    add('csp', 'Content-Security-Policy is set', findings);

    const noFraming = !header(h, 'x-frame-options') && !/frame-ancestors/i.test(csp);
    add('framing', 'Clickjacking protection is set', noFraming
      ? [{ type: 'framing', severity: 'Minor', detail: {}, evidence: 'Response headers\nX-Frame-Options and CSP frame-ancestors: [not present]' }]
      : []);
  }

  // 3. Referrer policy (header or meta tag). A missing policy is fine: browsers default to a safe one.
  {
    const meta =
      page.body.match(/<meta[^>]+name=["']referrer["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
      page.body.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']referrer["']/i)?.[1] ?? '';
    const value = (header(h, 'referrer-policy') || meta).trim().toLowerCase();
    const findings = /(^|,\s*)(unsafe-url|no-referrer-when-downgrade)\s*$/.test(value)
      ? [{ type: 'referrer', severity: 'Minor', detail: {}, evidence: `Referrer-Policy: ${value}` }]
      : [];
    add('referrer', 'Referrer policy does not share full URLs', findings);
  }

  // 4. HSTS and content-type sniffing
  {
    if (isHttps) {
      const hsts = header(h, 'strict-transport-security');
      const age = Number(hsts.match(/max-age=(\d+)/i)?.[1] ?? 0);
      add('hsts', 'HSTS is set', !hsts || age < 15_552_000
        ? [{ type: 'hsts', severity: 'Minor', detail: {}, evidence: `Strict-Transport-Security: ${hsts || '[not present]'}` }]
        : []);
    } else add('hsts', 'HSTS is set', [], 'Page is not served over HTTPS');
    add('nosniff', 'X-Content-Type-Options is nosniff', header(h, 'x-content-type-options').toLowerCase() === 'nosniff'
      ? []
      : [{ type: 'nosniff', severity: 'Minor', detail: {}, evidence: 'Response header\nX-Content-Type-Options: [not nosniff]' }]);
  }

  // 5. Cookies set by the server on this response (names and flags only, never values)
  {
    const issues = [];
    let severity = 'Minor';
    const seen = new Set();
    for (const c of parseCookies(h['set-cookie'])) {
      if (seen.has(c.name)) continue;
      seen.add(c.name);
      const missing = [];
      if (isHttps && !c.secure) missing.push('Secure');
      if (!c.httpOnly) missing.push('HttpOnly');
      if (!c.sameSite) missing.push('SameSite');
      if (!missing.length) continue;
      if (/sess|auth|token|jwt|sid|login/i.test(c.name) && (missing.includes('Secure') || missing.includes('HttpOnly'))) severity = 'Warning';
      issues.push(`${c.name}: missing ${missing.join(', ')}`);
    }
    add('cookies', 'Cookies have protective flags', issues.length
      ? [{ type: 'cookies', severity, detail: {}, evidence: `Set-Cookie (names and flags only)\n${issues.slice(0, 5).join('\n')}` }]
      : []);
  }

  // 6. Mixed content
  {
    if (isHttps) {
      const urls = [];
      let severity = 'Minor';
      for (const m of MIXED) {
        for (const hit of page.body.matchAll(m.re)) {
          urls.push(stripQuery(hit[1]));
          if (m.severity === 'Warning') severity = 'Warning';
        }
      }
      add('mixed', 'No insecure (http) resources on the page', urls.length
        ? [{ type: 'mixed-content', severity, detail: {}, evidence: `HTML references\n${[...new Set(urls)].slice(0, 5).join('\n')}` }]
        : []);
    } else add('mixed', 'No insecure (http) resources on the page', [], 'Page is not served over HTTPS');
  }

  // 7. Secrets in the page and the scripts it loads
  const sources = [{ url: page.url, text: page.body }, ...scripts.map((s) => ({ url: s.url, text: s.body }))];
  const secrets = scanSecrets(sources);
  add('secrets', 'No secret keys in public code', secrets.findings);

  // 8. Source maps referenced by built scripts (the tail of an untruncated script holds the comment)
  {
    const refs = [];
    for (const s of scripts) {
      if (s.truncated) continue;
      const m = s.body.slice(-2000).match(/\/\/[#@]\s*sourceMappingURL=([^\s'"]+)/);
      if (m && !m[1].startsWith('data:')) refs.push(`${pathOf(s.url)} → ${stripQuery(m[1])}`);
    }
    add('sourcemaps', 'No source maps advertised', refs.length
      ? [{ type: 'sourcemap', severity: 'Minor', detail: {}, evidence: `Scripts that point to source maps\n${refs.slice(0, 5).join('\n')}` }]
      : []);
  }

  return {
    raw: checks.flatMap((c) => c.findings),
    observations: secrets.observations,
    checked: checks.map((c) => ({
      id: c.id,
      label: c.label,
      status: c.skipped ? 'skipped' : c.findings.length ? 'finding' : 'pass',
      ...(c.skipped ? { note: c.skipped } : {}),
    })),
  };
}
