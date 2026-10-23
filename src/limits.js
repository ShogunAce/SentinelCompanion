// In-memory limiters. Fine for a single instance (deploy with max-instances 1).
// With several instances, move these counters to Redis so limits are shared.

export function createSlidingWindowLimiter({ windowMs, max, now = Date.now }) {
  const hits = new Map();
  return {
    take(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return { ok: false, retryAfterMs: Math.max(1000, windowMs - (t - recent[0])) };
      }
      recent.push(t);
      hits.set(key, recent);
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (!v.some((x) => t - x < windowMs)) hits.delete(k);
      }
      return { ok: true, remaining: max - recent.length };
    },
  };
}

export function createCache({ ttlMs, maxEntries, now = Date.now }) {
  const map = new Map();
  return {
    get(key) {
      const hit = map.get(key);
      if (!hit) return null;
      if (now() - hit.at > ttlMs) {
        map.delete(key);
        return null;
      }
      return hit;
    },
    set(key, value) {
      map.delete(key);
      map.set(key, { value, at: now() });
      while (map.size > maxEntries) map.delete(map.keys().next().value);
    },
  };
}

export function createSemaphore(max) {
  let active = 0;
  return {
    tryAcquire() {
      if (active >= max) return false;
      active += 1;
      return true;
    },
    release() {
      active = Math.max(0, active - 1);
    },
    get active() {
      return active;
    },
  };
}

// Guarantees a minimum gap between requests to the same host, even across concurrent scans.
export function createHostPacer({ spacingMs, now = Date.now, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const next = new Map();
  return {
    async wait(host) {
      const t = now();
      const slot = Math.max(t, next.get(host) ?? 0);
      next.set(host, slot + spacingMs);
      if (slot > t) await sleep(slot - t);
      if (next.size > 5_000) {
        for (const [k, v] of next) if (v < t) next.delete(k);
      }
    },
  };
}
