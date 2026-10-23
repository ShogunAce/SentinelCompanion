// Turns raw check output into the same finding shape the Sentinel front end already renders
// (id, severity, deduction, category, title, description, evidence, action, prompt).
// Text is deterministic. A language model can rephrase it later, but never decides what is a finding.

const DEDUCT = { Critical: 30, Warning: 10, Minor: 5 };
const ORDER = { Critical: 0, Warning: 1, Minor: 2 };

const SOURCE =
  'This finding comes from a passive Sentinel check of my public site, not a review of my code. Inspect my actual app and deployment before changing anything.';
const VERIFY =
  'Test the change and verify the result before deploying, and explain exactly how to verify it. Do not claim the issue is fixed until it is verified.';

const TEMPLATES = {
  secret: (d) => ({
    category: 'Client-side secrets',
    title: 'A secret key is visible in your public code.',
    description: `Your public code includes what looks like a ${d.label}. Anyone who opens your app can copy it, which can mean charges on your account or access to your data.`,
    action: 'Revoke the key, then move it to the server.',
    prompt: `${SOURCE} Sentinel found what looks like a ${d.label} in browser code (${d.where}). Confirm what the value is and whether it is truly secret; public client identifiers are not automatically secrets. If it is secret, revoke and rotate it with the provider first, because deleting it from code does not revoke it. Then keep the replacement only in a server-side environment variable used by an authenticated endpoint with rate limits. Add a check that fails the build if secrets appear in the production bundle. ${VERIFY}`,
  }),
  'review-key': (d) => ({
    category: 'Client-side keys',
    title: 'A key in your public code needs a second look.',
    description: `Your public code includes a ${d.label}. Some of these are meant to be public and some are not, and Sentinel cannot tell which from outside.`,
    action: 'Confirm what this key can do and restrict it.',
    prompt: `${SOURCE} Sentinel found a ${d.label} in browser code (${d.where}). Identify which service it belongs to. Firebase web config and map keys are designed to be public but should be restricted by allowed domain and by API. Keys for paid or sensitive services such as Gemini, AWS or any model API must not be in client code: move those behind an authenticated server endpoint and rotate the key. Tell me how to restrict or rotate it in the provider console. ${VERIFY}`,
  }),
  'service-role': () => ({
    category: 'Client-side secrets',
    title: "Your database's admin key is public.",
    description: 'A token that bypasses your database access rules (a Supabase service-role key) is included in your public code. Anyone can use it to read or change any data.',
    action: 'Rotate the key now and keep it server-side only.',
    prompt: `${SOURCE} Sentinel found a token whose role is service_role in browser code. Treat it as compromised: rotate the project's API keys or JWT secret in the Supabase dashboard first, because removing it from code does not revoke it. Use only the anon key in the browser, enable Row Level Security with explicit policies on every table, and use the service role only inside server-side code. Check recent database activity for misuse. ${VERIFY}`,
  }),
  'csp-missing': () => ({
    category: 'Browser protections',
    title: 'Give your browser a list of trusted sources.',
    description: 'Your site does not send a Content Security Policy. A carefully tested policy can limit which scripts run if unwanted content gets into your app.',
    action: 'Add and test a Content Security Policy.',
    prompt: `${SOURCE} Review my deployment for a Content Security Policy. Inventory the scripts, styles, fonts, connections and frames my app needs, then propose a restrictive policy using nonces or hashes where appropriate. Start with Content-Security-Policy-Report-Only and review violations before enforcing. Avoid broad wildcards and unsafe-eval. Test login, payments and embedded services. Explain deployment-specific header configuration. ${VERIFY}`,
  }),
  'csp-weak': () => ({
    category: 'Browser protections',
    title: 'Your trusted-sources list is looser than it needs to be.',
    description: 'Your Content Security Policy allows script sources that weaken its protection, such as unsafe-eval or a wildcard.',
    action: 'Tighten the policy and test it.',
    prompt: `${SOURCE} Review my Content Security Policy for unsafe-eval and wildcard script sources. Propose the strictest policy my app can run under, using nonces or hashes, and test in Report-Only mode first. ${VERIFY}`,
  }),
  framing: () => ({
    category: 'Browser protections',
    title: 'Stop other sites from framing yours.',
    description: 'Nothing tells browsers to refuse to show your app inside another site\'s page, which can be used to trick people into clicking things.',
    action: 'Add frame-ancestors or X-Frame-Options.',
    prompt: `${SOURCE} Add clickjacking protection: a Content-Security-Policy frame-ancestors directive (and X-Frame-Options for older browsers) that only allows my own origins to frame the app. Check I do not rely on being embedded anywhere. ${VERIFY}`,
  }),
  referrer: () => ({
    category: 'Privacy defaults',
    title: 'Share less when someone follows a link.',
    description: 'Your referrer policy sends full page addresses to other sites. Addresses can contain private details.',
    action: 'Use a more private referrer policy.',
    prompt: `${SOURCE} Inspect my Referrer-Policy header and meta tags. Switch to strict-origin-when-cross-origin or no-referrer based on product needs, remove sensitive details from URL paths and query strings, and test analytics and required integrations. ${VERIFY}`,
  }),
  hsts: () => ({
    category: 'Transport security',
    title: 'Tell browsers to always use the secure version.',
    description: 'Your site does not send a strong HSTS header, so a browser may still try the insecure address first.',
    action: 'Add Strict-Transport-Security.',
    prompt: `${SOURCE} Add a Strict-Transport-Security header with a max-age of at least 6 months. Confirm every subdomain supports HTTPS before adding includeSubDomains, and do not add preload without understanding it. ${VERIFY}`,
  }),
  nosniff: () => ({
    category: 'Browser protections',
    title: 'Stop browsers from guessing file types.',
    description: 'Your site does not send X-Content-Type-Options: nosniff, so browsers may treat a file as a different type than intended.',
    action: 'Add the nosniff header.',
    prompt: `${SOURCE} Add the response header X-Content-Type-Options: nosniff to all responses and make sure each file is served with the correct Content-Type. ${VERIFY}`,
  }),
  cookies: () => ({
    category: 'Sign-in and sessions',
    title: 'Lock down your cookies.',
    description: 'Some cookies your site sets are missing protective flags, which makes them easier to steal or misuse.',
    action: 'Add Secure, HttpOnly and SameSite.',
    prompt: `${SOURCE} Review the cookies my server sets (names and flags in the evidence). Session and authentication cookies should be Secure, HttpOnly and SameSite=Lax or Strict. Check whether anything in my app reads them from JavaScript before adding HttpOnly. ${VERIFY}`,
  }),
  'mixed-content': () => ({
    category: 'Transport security',
    title: 'Your secure page loads something insecure.',
    description: 'A page served over HTTPS pulls in resources over plain HTTP. Anyone on the network could alter them.',
    action: 'Load every resource over HTTPS.',
    prompt: `${SOURCE} Find every http:// resource referenced by my pages (the evidence lists some), switch them to https:// or host them myself, and consider upgrade-insecure-requests. ${VERIFY}`,
  }),
  'no-https': () => ({
    category: 'Transport security',
    title: 'Your site is not using HTTPS.',
    description: 'Visitors connect without encryption, so anything they send or see can be read or changed on the way.',
    action: 'Turn on HTTPS and redirect to it.',
    prompt: `${SOURCE} My site is served over plain HTTP. Enable HTTPS with a valid certificate, redirect all HTTP to HTTPS, and add HSTS once it works. Explain the steps for my host. ${VERIFY}`,
  }),
  'password-over-http': () => ({
    category: 'Transport security',
    title: 'A password box is served without encryption.',
    description: 'Your page shows a password field over plain HTTP. Passwords typed there can be read by anyone on the network.',
    action: 'Serve every page over HTTPS now.',
    prompt: `${SOURCE} A page with a password field is served over HTTP. Move the whole site to HTTPS immediately, redirect HTTP to HTTPS, and confirm login requests are only sent over HTTPS. ${VERIFY}`,
  }),
  sourcemap: () => ({
    category: 'Information exposure',
    title: 'Your built code points to its readable source.',
    description: 'Your scripts reference source map files. If those files are public, anyone can read your original source code.',
    action: 'Remove source maps from production, or confirm they are not public.',
    prompt: `${SOURCE} My built scripts reference source maps. Check whether those .map files are publicly reachable. If they are, stop publishing them to production, or upload them only to an error-tracking service. ${VERIFY}`,
  }),
};

export function scoreReport(items) {
  const score = Math.max(0, 100 - items.reduce((sum, item) => sum + item.deduction, 0));
  return { score, grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'F' };
}

export function buildReport({ requestedOrigin, finalOrigin, checks, coverage }) {
  const findings = checks.raw
    .map((f) => ({ f, tpl: TEMPLATES[f.type]?.(f.detail ?? {}) }))
    .filter((x) => x.tpl)
    .sort((a, b) => ORDER[a.f.severity] - ORDER[b.f.severity])
    .slice(0, 25)
    .map(({ f, tpl }, i) => ({
      id: `${f.type}-${i + 1}`,
      kind: f.type,
      severity: f.severity,
      deduction: DEDUCT[f.severity],
      ...tpl,
      evidence: f.evidence,
    }));

  const { score, grade } = scoreReport(findings);
  return {
    mode: 'LIVE_PASSIVE',
    requestedOrigin,
    origin: finalOrigin,
    scannedAt: new Date().toISOString(),
    score,
    grade,
    findings,
    observations: checks.observations,
    checked: checks.checked,
    coverage: {
      ...coverage,
      notAssessed: ['Authentication', 'Authorization and access controls', 'Database rules'],
      notDone: ['Logging in', 'Testing forms or APIs', 'Probing hidden paths or admin pages'],
    },
    limitations:
      'A passive check of the public home page and the scripts it loads directly. It is not a security audit, and a good grade is not a guarantee that your app is safe.',
  };
}
