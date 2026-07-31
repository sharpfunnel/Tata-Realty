import "server-only";

/**
 * In-memory fixed-window rate limiter.
 *
 * Scope: one serverless instance. On Vercel each lambda keeps its own map, so
 * the effective ceiling is (limit x warm instances) rather than a hard global
 * cap. That is enough to stop a single browser or script flooding the tracking
 * endpoints, which is what these limits are for. If you later need a true
 * global limit, swap the body of `rateLimit` for Upstash Redis — the signature
 * is designed to stay the same.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Cheap opportunistic sweep so the map cannot grow without bound.
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): boolean {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}
