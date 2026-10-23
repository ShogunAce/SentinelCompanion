import test from 'node:test';
import assert from 'node:assert/strict';
import { runChecks, scanSecrets } from '../src/checks.js';
import { buildReport, scoreReport } from '../src/report.js';

// Secrets are assembled at runtime so no realistic token literal sits in the repository.
const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const fakeJwt = (payload) => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.${'s1gN4tur3'.repeat(4)}`;
const stripeKey = ['sk', 'live', 'a1B2c3D4e5F6g7H8i9J0k1L2'].join('_');
const githubTok = `ghp_${'aB3dE6gH9jK2mN5pQ8sT1vW4yZ7bC0eF3hJ6'}`;

const page = (over = {}) => ({
  url: 'https://app.example.com/',
  status: 200,
  headers: {
    'content-security-policy': "default-src 'self'",
    'strict-transport-security': 'max-age=31536000',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  },
  body: '<html><body>hi</body></html>',
  truncated: false,
  ...over,
});
const types = (res) => res.raw.map((f) => f.type);

test('a well-configured page produces no findings and lists what was checked', () => {
  const res = runChecks({ page: page(), scripts: [] });
  assert.deepEqual(res.raw, []);
  assert.ok(res.checked.length >= 8);
  assert.ok(res.checked.every((c) => c.status === 'pass'));
});

test('missing headers, unsafe referrer and weak CSP are found', () => {
  const res = runChecks({ page: page({ headers: { 'referrer-policy': 'unsafe-url' } }), scripts: [] });
  for (const t of ['csp-missing', 'referrer', 'hsts', 'nosniff', 'framing']) assert.ok(types(res).includes(t), t);
  const weak = runChecks({ page: page({ headers: { ...page().headers, 'content-security-policy': "script-src 'self' 'unsafe-eval'" } }), scripts: [] });
  assert.ok(types(weak).includes('csp-weak'));
});

test('secrets are detected, redacted and never echoed in full', () => {
  const scripts = [{ url: 'https://app.example.com/assets/app.js', body: `const k="${stripeKey}";const g="${githubTok}";`, truncated: false }];
  const res = runChecks({ page: page(), scripts });
  const secrets = res.raw.filter((f) => f.type === 'secret');
  assert.equal(secrets.length, 2);
  assert.ok(secrets.every((f) => f.severity === 'Critical'));
  const dump = JSON.stringify(res);
  assert.ok(!dump.includes(stripeKey) && !dump.includes(githubTok), 'full secret must never appear in output');
  assert.match(secrets[0].evidence, /sk_l…\[\d+ chars\]|ghp_…\[\d+ chars\]/);
});

test('placeholder-looking values are ignored', () => {
  const res = scanSecrets([{ url: 'https://a.example/x.js', text: `x="sk_live_${'x'.repeat(30)}"; y="sk-${'a'.repeat(40)}"; z="sk_live_EXAMPLEEXAMPLEEXAMPLE1"` }]);
  assert.equal(res.findings.length, 0);
});

test('a Supabase service_role token is Critical, an anon token is only an observation', () => {
  const service = fakeJwt({ role: 'service_role', iss: 'supabase' });
  const anon = fakeJwt({ role: 'anon', iss: 'supabase' });
  const res = scanSecrets([{ url: 'https://app.example.com/a.js', text: `url="https://abcdefghijklmnopqrst.supabase.co";a="${anon}";s="${service}"` }]);
  assert.equal(res.findings.length, 1);
  assert.equal(res.findings[0].type, 'service-role');
  assert.ok(res.observations.some((o) => o.id === 'supabase'));
  assert.ok(!JSON.stringify(res).includes(service));
});

test('Google and AWS style keys are a Warning to review, not Critical', () => {
  const g = `AIza${'A1b2C3d4E5'.repeat(4).slice(0, 35)}`; // AIza + exactly 35 characters
  const aws = ['AKIA', 'ABCDEFGHIJKLMNOP'].join('');
  const res = scanSecrets([{ url: 'https://a.example/x.js', text: `k="${g}";a="${aws}"` }]);
  assert.equal(res.findings.length, 2);
  assert.ok(res.findings.every((f) => f.severity === 'Warning' && f.type === 'review-key'));
  assert.ok(!JSON.stringify(res).includes(g) && !JSON.stringify(res).includes(aws));
});

test('cookies report names and flags only, never values', () => {
  const res = runChecks({ page: page({ headers: { ...page().headers, 'set-cookie': ['session_id=SUPERSECRETVALUE; Path=/', 'theme=dark; Secure; HttpOnly; SameSite=Lax'] } }), scripts: [] });
  const c = res.raw.find((f) => f.type === 'cookies');
  assert.equal(c.severity, 'Warning');
  assert.match(c.evidence, /session_id: missing Secure, HttpOnly, SameSite/);
  assert.ok(!c.evidence.includes('SUPERSECRETVALUE'));
});

test('http page: password form is Critical, otherwise Warning; mixed content on https', () => {
  const pw = runChecks({ page: page({ url: 'http://app.example.com/', body: '<input type="password">' }), scripts: [] });
  assert.ok(types(pw).includes('password-over-http') && !types(pw).includes('no-https'));
  const plain = runChecks({ page: page({ url: 'http://app.example.com/' }), scripts: [] });
  assert.ok(types(plain).includes('no-https'));
  const mixed = runChecks({ page: page({ body: '<script src="http://cdn.example.net/x.js?k=1"></script><img src="http://i.example.net/a.png">' }), scripts: [] });
  const m = mixed.raw.find((f) => f.type === 'mixed-content');
  assert.equal(m.severity, 'Warning');
  assert.ok(!m.evidence.includes('k=1'));
});

test('source map references are found only in untruncated scripts', () => {
  const body = 'console.log(1);\n//# sourceMappingURL=app.js.map';
  const ok = runChecks({ page: page(), scripts: [{ url: 'https://app.example.com/a.js', body, truncated: false }] });
  assert.ok(types(ok).includes('sourcemap'));
  const cut = runChecks({ page: page(), scripts: [{ url: 'https://app.example.com/a.js', body, truncated: true }] });
  assert.ok(!types(cut).includes('sourcemap'));
});

test('report uses the existing finding shape, sorts by severity and scores deterministically', () => {
  const checks = runChecks({
    page: page({ headers: {} }),
    scripts: [{ url: 'https://app.example.com/a.js', body: `k="${stripeKey}"`, truncated: false }],
  });
  const r = buildReport({ requestedOrigin: 'https://app.example.com', finalOrigin: 'https://app.example.com', checks, coverage: { requests: 3 } });
  assert.equal(r.mode, 'LIVE_PASSIVE');
  assert.equal(r.findings[0].severity, 'Critical');
  for (const f of r.findings) {
    for (const key of ['id', 'severity', 'deduction', 'category', 'title', 'description', 'evidence', 'action', 'prompt']) assert.ok(f[key] !== undefined, `${f.id} missing ${key}`);
    assert.match(f.prompt, /not a review of my code/);
  }
  assert.deepEqual(scoreReport(r.findings), { score: r.score, grade: r.grade });
  assert.deepEqual(r.coverage.notAssessed, ['Authentication', 'Authorization and access controls', 'Database rules']);
  assert.equal(scoreReport([{ deduction: 30 }, { deduction: 10 }, { deduction: 5 }]).score, 55);
  assert.equal(scoreReport([{ deduction: 30 }, { deduction: 10 }, { deduction: 5 }]).grade, 'D');
});
