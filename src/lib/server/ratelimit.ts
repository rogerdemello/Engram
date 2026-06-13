import "server-only";

/**
 * Lightweight abuse protection for the public deployment.
 *
 * The /api/agent and /api/capture routes call Azure OpenAI (real cost) and
 * /api/grant signs Sui transactions (gas). Since the demo is public and we
 * can't set an upstream spend cap, we rate-limit per IP in-memory and apply a
 * soft global cap per instance to bound Azure usage. Not bulletproof on
 * serverless (memory is per-instance), but it stops casual bot abuse cheaply.
 */
const ipBuckets = new Map<string, number[]>();
const globalWin = { count: 0, start: Date.now() };

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

/** Per-IP sliding-window limit. Returns ok=false when exceeded. */
export function rateLimit(
  req: Request,
  key: string,
  limit: number,
  windowMs = 60_000,
): { ok: boolean; retryAfter: number } {
  const id = `${key}:${clientIp(req)}`;
  const now = Date.now();
  const arr = (ipBuckets.get(id) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - arr[0])) / 1000) };
  }
  arr.push(now);
  ipBuckets.set(id, arr);
  if (ipBuckets.size > 5000) ipBuckets.clear(); // crude memory guard
  return { ok: true, retryAfter: 0 };
}

/** Soft global cap (per serverless instance) to bound Azure spend. */
export function globalCap(max = 500, windowMs = 3_600_000): boolean {
  const now = Date.now();
  if (now - globalWin.start > windowMs) {
    globalWin.count = 0;
    globalWin.start = now;
  }
  if (globalWin.count >= max) return false;
  globalWin.count++;
  return true;
}

export function tooMany(retryAfter = 30, message = "Too many requests — please slow down.") {
  return Response.json({ error: message }, {
    status: 429,
    headers: { "Retry-After": String(retryAfter) },
  });
}
