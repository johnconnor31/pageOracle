// Fixed-window request counter keyed by client IP.
// The counts live in this server instance's memory, so they reset on cold start and are
// not shared between instances. That is enough to stop a single script hammering the
// endpoint; use a shared store (e.g. Upstash Redis) or the Vercel firewall for a hard limit.

export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }) {
  const hits = new Map();

  return function check(key, now = Date.now()) {
    let entry = hits.get(key);
    if (!entry || now - entry.start >= windowMs) {
      if (!entry && hits.size >= maxKeys) {
        for (const [k, v] of hits) if (now - v.start >= windowMs) hits.delete(k);
        if (hits.size >= maxKeys) hits.delete(hits.keys().next().value);
      }
      entry = { start: now, count: 0 };
      hits.set(key, entry);
    }
    entry.count += 1;
    const allowed = entry.count <= limit;
    const retryAfterSeconds = allowed ? 0 : Math.ceil((entry.start + windowMs - now) / 1000);
    return { allowed, retryAfterSeconds };
  };
}

// On Vercel, x-real-ip and x-forwarded-for are set by the platform, not the client.
export function clientIp(request) {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}
