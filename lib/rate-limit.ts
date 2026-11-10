interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const trackers = new Map<string, RateLimitRecord>();

/**
 * IP tabanlı basit ve hafif in-memory rate limiter.
 * Production'da multi-instance / serverless gereksiniminde doğrudan Upstash/Redis ile değiştirilebilir.
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): { success: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const existing = trackers.get(key);

  // Süresi dolmuş kayıtları temizle
  if (!existing || now > existing.resetAt) {
    trackers.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetInSec: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetInSec: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: limit - existing.count,
    resetInSec: Math.ceil((existing.resetAt - now) / 1000),
  };
}

export function getClientIp(request: Request): string {
  // 1. Cloudflare real client IP
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  // 2. Nginx / reverse proxy real IP
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  // 3. Standard x-forwarded-for header (first IP in comma-separated list)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

