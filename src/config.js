// All limits live here so they are easy to audit. Every value can be overridden by an env var.
const num = (v, fallback) => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const DEFAULTS = Object.freeze({
  port: 8080,
  allowedOrigins: [],
  trustProxyHops: 1,
  contact: 'unset',
  userAgentToken: 'SentinelScanner',

  // Per-scan budget: the target never sees more than this many requests from one scan.
  maxRequestsPerScan: 10,
  maxScripts: 5,
  maxHtmlBytes: 1_000_000,
  maxScriptBytes: 1_500_000,
  maxRobotsBytes: 100_000,
  requestTimeoutMs: 8_000,
  scanDeadlineMs: 25_000,
  maxRedirects: 3,
  requestSpacingMs: 400,

  // Abuse and load limits on the service itself.
  requestsPerHourPerClient: 60,
  scansPerHourPerClient: 6,
  scansPerHourGlobal: 150,
  maxConcurrentScans: 3,
  hostCooldownMs: 10 * 60 * 1000,
  cacheMaxEntries: 500,
});

export function loadConfig(env = process.env) {
  const c = {
    ...DEFAULTS,
    port: num(env.PORT, DEFAULTS.port),
    allowedOrigins: (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    trustProxyHops: num(env.TRUST_PROXY_HOPS, DEFAULTS.trustProxyHops),
    contact: env.SCANNER_CONTACT?.trim() || DEFAULTS.contact,
    maxRequestsPerScan: num(env.MAX_REQUESTS_PER_SCAN, DEFAULTS.maxRequestsPerScan),
    maxScripts: num(env.MAX_SCRIPTS, DEFAULTS.maxScripts),
    requestSpacingMs: num(env.REQUEST_SPACING_MS, DEFAULTS.requestSpacingMs),
    scansPerHourPerClient: num(env.SCANS_PER_HOUR_PER_CLIENT, DEFAULTS.scansPerHourPerClient),
    scansPerHourGlobal: num(env.SCANS_PER_HOUR_GLOBAL, DEFAULTS.scansPerHourGlobal),
    maxConcurrentScans: num(env.MAX_CONCURRENT_SCANS, DEFAULTS.maxConcurrentScans),
    hostCooldownMs: num(env.HOST_COOLDOWN_SECONDS, DEFAULTS.hostCooldownMs / 1000) * 1000,
  };
  c.userAgent = `${c.userAgentToken}/1.0 (passive security check, rate limited; contact: ${c.contact})`;
  return Object.freeze(c);
}
