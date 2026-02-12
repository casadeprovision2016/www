import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter for Cloudflare Workers
// For production with multiple workers, use Upstash Redis or similar

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
}

const STRICT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
}

export function getClientIdentifier(request: NextRequest): string {
  // Use CF-Connecting-IP header if available (Cloudflare)
  const cfIp = request.headers.get('CF-Connecting-IP')
  if (cfIp) return cfIp

  // Fall back to X-Forwarded-For
  const forwardedFor = request.headers.get('X-Forwarded-For')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Last resort: use a combination of user agent and accept language
  // This is less reliable but better than nothing
  const ua = request.headers.get('User-Agent') || 'unknown'
  const lang = request.headers.get('Accept-Language') || 'unknown'
  return `${ua}-${lang}`
}

export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  const identifier = getClientIdentifier(request)
  const now = Date.now()

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean up on each request
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }

  const existing = rateLimitStore.get(identifier)

  if (!existing || existing.resetTime < now) {
    // New window
    const resetTime = now + config.windowMs
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    })
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime,
    }
  }

  // Existing window
  if (existing.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: existing.resetTime,
    }
  }

  existing.count++
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - existing.count,
    resetTime: existing.resetTime,
  }
}

export function createRateLimitMiddleware(config: RateLimitConfig = DEFAULT_CONFIG) {
  return function rateLimitMiddleware(request: NextRequest) {
    const result = rateLimit(request, config)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
            'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
          },
        }
      )
    }

    return null // Continue to next handler
  }
}

// Pre-configured rate limiters
export const authRateLimit = createRateLimitMiddleware(STRICT_CONFIG)
export const apiRateLimit = createRateLimitMiddleware(DEFAULT_CONFIG)
export const strictRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
})
