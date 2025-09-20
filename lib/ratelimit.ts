import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client for Upstash
// This will use the UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars
let redis: Redis | null = null;
let rateLimiter: Ratelimit | null = null;

// Initialize rate limiter only if environment variables are present
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Create rate limiter with sliding window algorithm
  // Default: 10 requests per 10 seconds per identifier
  rateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true, // Enable analytics for monitoring
    prefix: '@upstash/ratelimit', // Prefix for Redis keys
  });
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given identifier
 * @param identifier - Unique identifier (e.g., "tenant:origin" or "ip:sessionId")
 * @returns Rate limit result with success status and metadata
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  // If rate limiter is not configured, always allow (for development)
  if (!rateLimiter) {
    console.warn('Rate limiter not configured - allowing all requests');
    return {
      success: true,
      limit: -1,
      remaining: -1,
      reset: -1,
    };
  }

  try {
    const result = await rateLimiter.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the request but log the issue
    return {
      success: true,
      limit: -1,
      remaining: -1,
      reset: -1,
    };
  }
}

/**
 * Get custom rate limiter with specific limits
 * @param requests - Number of requests allowed
 * @param window - Time window (e.g., "10 s", "1 m", "1 h")
 * @returns Custom rate limiter instance
 */
type DurationString = `${number} ${'ms' | 's' | 'm' | 'h'}`;

export function createCustomRateLimiter(requests: number, window: DurationString): Ratelimit | null {
  if (!redis) {
    console.warn('Redis not configured - rate limiting disabled');
    return null;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: '@upstash/ratelimit/custom',
  });
}

/**
 * Rate limit configurations for different tiers
 */
export const RATE_LIMIT_TIERS = {
  // Free tier: 10 requests per minute
  free: { requests: 10, window: '60 s' as DurationString },
  // Basic tier: 60 requests per minute
  basic: { requests: 60, window: '60 s' as DurationString },
  // Pro tier: 300 requests per minute
  pro: { requests: 300, window: '60 s' as DurationString },
  // Enterprise tier: 1000 requests per minute
  enterprise: { requests: 1000, window: '60 s' as DurationString },
} as const;

/**
 * Get rate limiter for a specific tier
 * @param tier - The tier name (free, basic, pro, enterprise)
 * @returns Rate limiter instance for the tier
 */
export function getRateLimiterForTier(tier: keyof typeof RATE_LIMIT_TIERS): Ratelimit | null {
  const config = RATE_LIMIT_TIERS[tier];
  return createCustomRateLimiter(config.requests, config.window);
}

// Export the default rate limiter instance
export { rateLimiter };
