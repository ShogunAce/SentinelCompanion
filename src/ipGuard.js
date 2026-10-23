import net from 'node:net';

// Anything that is not a normal public internet address is refused.
// NOTE: do NOT add ::ffff:0:0/96 here. Node's BlockList treats IPv4 as mapped, so that rule would
// block every IPv4 address. Node already checks IPv4-mapped IPv6 against the IPv4 rules below.
const blocked = new net.BlockList();

const V4 = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
];
const V6 = [
  ['::', 96], // unspecified, loopback and deprecated IPv4-compatible
  ['64:ff9b::', 96], ['64:ff9b:1::', 48], // NAT64 can smuggle IPv4 targets
  ['100::', 64], ['2001::', 32], ['2001:db8::', 32],
  ['2002::', 16], // 6to4
  ['fc00::', 7], ['fe80::', 10], ['fec0::', 10], ['ff00::', 8],
];
for (const [addr, prefix] of V4) blocked.addSubnet(addr, prefix, 'ipv4');
for (const [addr, prefix] of V6) blocked.addSubnet(addr, prefix, 'ipv6');

export function isBlockedIp(ip) {
  if (typeof ip !== 'string' || ip.includes('%')) return true; // zone ids are never legitimate here
  const family = net.isIP(ip);
  if (!family) return true; // fail closed on anything unparseable
  return blocked.check(ip, family === 4 ? 'ipv4' : 'ipv6');
}
