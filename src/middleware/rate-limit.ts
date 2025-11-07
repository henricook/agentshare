import { Context, Next } from 'hono';
import { env } from '../config/environment.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private max: number;

  constructor(windowMs: number, max: number) {
    this.windowMs = windowMs;
    this.max = max;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    let entry = this.store.get(key);

    // If no entry or expired, create new one
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + this.windowMs,
      };
      this.store.set(key, entry);
    }

    entry.count++;

    return {
      allowed: entry.count <= this.max,
      remaining: Math.max(0, this.max - entry.count),
      resetAt: entry.resetAt,
    };
  }
}

const uploadLimiter = new RateLimiter(
  env.RATE_LIMIT_UPLOAD_WINDOW_MS,
  env.RATE_LIMIT_UPLOAD_MAX
);

const viewLimiter = new RateLimiter(
  env.RATE_LIMIT_VIEW_WINDOW_MS,
  env.RATE_LIMIT_VIEW_MAX
);

function getClientKey(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

/**
 * Rate limit middleware for upload endpoint
 */
export async function uploadRateLimit(c: Context, next: Next): Promise<Response> {
  const key = `upload:${getClientKey(c)}`;
  const { allowed, remaining, resetAt } = uploadLimiter.check(key);

  c.header('X-RateLimit-Limit', env.RATE_LIMIT_UPLOAD_MAX.toString());
  c.header('X-RateLimit-Remaining', remaining.toString());
  c.header('X-RateLimit-Reset', new Date(resetAt).toISOString());

  if (!allowed) {
    return c.json(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      },
      429
    );
  }

  await next();
  return c.res;
}

/**
 * Rate limit middleware for view endpoint
 */
export async function viewRateLimit(c: Context, next: Next): Promise<Response> {
  const key = `view:${getClientKey(c)}`;
  const { allowed, remaining, resetAt } = viewLimiter.check(key);

  c.header('X-RateLimit-Limit', env.RATE_LIMIT_VIEW_MAX.toString());
  c.header('X-RateLimit-Remaining', remaining.toString());
  c.header('X-RateLimit-Reset', new Date(resetAt).toISOString());

  if (!allowed) {
    return c.json(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      },
      429
    );
  }

  await next();
  return c.res;
}
