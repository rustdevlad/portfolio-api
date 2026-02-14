
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();

  check(
    key: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No entry or window expired - create new
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
    }

    // Check if within limits
    if (entry.count < maxRequests) {
      entry.count++;
      return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetIn: entry.resetTime - now,
      };
    }

    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.limits.forEach((entry, key) => {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.limits.delete(key));
  }
}

export const rateLimiter = new RateLimiter();

export const RateLimits = {
  STANDARD: { maxRequests: 60, windowMs: 60 * 1000 },
  WRITE: { maxRequests: 10, windowMs: 60 * 1000 },
  HEAVY: { maxRequests: 5, windowMs: 60 * 1000 },
} as const;

export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function rateLimitHeaders(
  remaining: number,
  resetIn: number
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)),
  };
}

