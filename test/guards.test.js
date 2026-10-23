import test from 'node:test';
import assert from 'node:assert/strict';
import { isBlockedIp } from '../src/ipGuard.js';
import { parseTarget, ScanError } from '../src/target.js';
import { isAllowed } from '../src/robots.js';

test('ipGuard blocks private, loopback, metadata, mapped and reserved addresses', () => {
  const blocked = [
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1',
    '0.0.0.0', '224.0.0.1', '255.255.255.255', '::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'ff02::1',
    '::ffff:127.0.0.1', '::ffff:a00:1', '::ffff:169.254.169.254', '64:ff9b::7f00:1', '2002:7f00:1::', '2001:db8::1',
    'fe80::1%eth0', 'not-an-ip', '', undefined,
  ];
  for (const ip of blocked) assert.equal(isBlockedIp(ip), true, `should block ${ip}`);
});

test('ipGuard allows ordinary public addresses', () => {
  for (const ip of ['8.8.8.8', '93.184.216.34', '1.1.1.1', '::ffff:8.8.8.8', '2606:4700:4700::1111', '172.32.0.1']) {
    assert.equal(isBlockedIp(ip), false, `should allow ${ip}`);
  }
});

test('parseTarget reduces input to an origin root and adds https by default', () => {
  const t = parseTarget('MyApp.Example.com/some/path?token=secret#frag');
  assert.equal(t.url.href, 'https://myapp.example.com/');
  assert.equal(t.origin, 'https://myapp.example.com');
});

test('parseTarget keeps path and query only for redirect hops', () => {
  const t = parseTarget('https://example.com/en?x=1#h', { keepPath: true });
  assert.equal(t.url.href, 'https://example.com/en?x=1');
});

test('parseTarget rejects unsafe or non-public targets', () => {
  const cases = [
    '', '   ', 'ftp://example.com', 'https://user:pass@example.com', 'https://example.com:8080', 'http://example.com:22',
    'http://127.0.0.1', 'http://2130706433', 'http://[::1]', 'http://169.254.169.254/latest', 'localhost', 'http://intranet',
    'http://printer.local', 'http://db.internal', 'x'.repeat(3000), 'https://exa mple.com',
  ];
  for (const c of cases) {
    assert.throws(() => parseTarget(c), (e) => e instanceof ScanError && e.status === 400, `should reject ${JSON.stringify(c).slice(0, 40)}`);
  }
});

test('robots: wildcard group, specific group wins, longest match wins', () => {
  const txt = 'User-agent: *\nDisallow: /private\nAllow: /private/open\n\nUser-agent: SentinelScanner\nDisallow: /nope\n';
  assert.equal(isAllowed(txt, 'SentinelScanner', '/nope/x'), false);
  assert.equal(isAllowed(txt, 'SentinelScanner', '/private'), true); // specific group replaces wildcard
  assert.equal(isAllowed(txt, 'OtherBot', '/private/x'), false);
  assert.equal(isAllowed(txt, 'OtherBot', '/private/open/y'), true);
  assert.equal(isAllowed('User-agent: *\nDisallow: /\n', 'SentinelScanner', '/'), false);
  assert.equal(isAllowed('', 'SentinelScanner', '/'), true);
  assert.equal(isAllowed('<html>spa fallback</html>', 'SentinelScanner', '/'), true);
});
