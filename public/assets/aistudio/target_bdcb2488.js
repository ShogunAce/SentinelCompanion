import net from 'node:net';

export class ScanError extends Error {
  constructor(code, message, status = 422) {
    super(message);
    this.name = 'ScanError';
    this.code = code;
    this.status = status;
  }
}

const BAD_SUFFIX = /(^|\.)(localhost|local|internal|localdomain|lan|home|corp|intranet|test|invalid)$/;

// Validates a scan target. By default the scan target is reduced to its origin root ("/"),
// so the service never fetches deep paths the user typed. Redirect hops pass keepPath: true.
export function parseTarget(input, { keepPath = false, allowedPorts = [80, 443] } = {}) {
  const raw = String(input ?? '').trim();
  const bad = (code, msg) => new ScanError(code, msg, 400);
  if (!raw || raw.length > 2048) throw bad('INVALID_URL', 'Enter a valid web address, like myapp.example.');

  let url;
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`);
  } catch {
    throw bad('INVALID_URL', 'Enter a valid web address, like myapp.example.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw bad('INVALID_URL', 'Use an http or https web address.');
  if (url.username || url.password) throw bad('INVALID_URL', 'Use an address without a username or password.');

  const port = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80;
  if (!allowedPorts.includes(port)) throw bad('PORT_NOT_ALLOWED', 'Sentinel only scans standard web ports (80 and 443).');

  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (net.isIP(host.replace(/^\[|\]$/g, ''))) throw bad('IP_NOT_ALLOWED', "Use your app's domain name, not an IP address.");
  if (!host.includes('.') || BAD_SUFFIX.test(host)) throw bad('HOST_NOT_ALLOWED', 'That address is not a public website.');

  const href = keepPath ? `${url.origin}${url.pathname}${url.search}` : `${url.origin}/`;
  return { url: new URL(href), origin: url.origin, host, protocol: url.protocol };
}
