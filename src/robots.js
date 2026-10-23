// Minimal robots.txt support: user-agent groups, Allow/Disallow, * and $ wildcards, longest match wins.
function toRegex(pattern) {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const escaped = body.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${escaped}${anchored ? '$' : ''}`);
}

export function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const i = line.indexOf(':');
    if (i < 0) continue;
    const field = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (field === 'allow' || field === 'disallow') {
      lastWasAgent = false;
      if (current && value) current.rules.push({ allow: field === 'allow', re: toRegex(value), len: value.length });
    } else {
      lastWasAgent = false;
    }
  }
  return groups;
}

export function isAllowed(text, uaToken, path) {
  const groups = parseRobots(text);
  const token = uaToken.toLowerCase();
  const specific = groups.filter((g) => g.agents.some((a) => a !== '*' && token.includes(a)));
  const chosen = specific.length ? specific : groups.filter((g) => g.agents.includes('*'));
  let best = null;
  for (const g of chosen) {
    for (const r of g.rules) {
      if (!r.re.test(path)) continue;
      if (!best || r.len > best.len || (r.len === best.len && r.allow)) best = r;
    }
  }
  return best ? best.allow : true;
}
