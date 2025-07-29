import { RATE_LIMIT_CONFIG } from './rate-limit-config'
import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class SimpleRateLimiter {
  private store: RateLimitStore = {}
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  private cleanup() {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key]
      }
    })
  }

  checkLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanup()
    
    const now = Date.now()
    const windowStart = now - (now % this.windowMs)
    const resetTime = windowStart + this.windowMs

    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime
      }
    }

    if (now >= this.store[key].resetTime) {
      this.store[key] = {
        count: 0,
        resetTime
      }
    }

    const currentCount = this.store[key].count
    const remaining = Math.max(0, this.maxRequests - currentCount)
    const allowed = currentCount < this.maxRequests

    if (allowed) {
      this.store[key].count++
    }

    return {
      allowed,
      remaining,
      resetTime: this.store[key].resetTime
    }
  }

  getUsage(key: string): { count: number; remaining: number; resetTime: number } {
    this.cleanup()
    
    if (!this.store[key]) {
      return {
        count: 0,
        remaining: this.maxRequests,
        resetTime: Date.now() + this.windowMs
      }
    }

    return {
      count: this.store[key].count,
      remaining: Math.max(0, this.maxRequests - this.store[key].count),
      resetTime: this.store[key].resetTime
    }
  }
}

// Create rate limiters
export const openAILimiter = new SimpleRateLimiter(
  RATE_LIMIT_CONFIG.openAI.windowMs,
  RATE_LIMIT_CONFIG.openAI.maxRequests
)

export const userLimiter = new SimpleRateLimiter(
  RATE_LIMIT_CONFIG.user.windowMs,
  RATE_LIMIT_CONFIG.user.maxRequests
)

export const apiLimiter = new SimpleRateLimiter(
  RATE_LIMIT_CONFIG.api.windowMs,
  RATE_LIMIT_CONFIG.api.maxRequests
)

// Simple rate limiting function for Next.js App Router
export function checkRateLimit(
  request: Request,
  limiter: SimpleRateLimiter
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown'
  
  return limiter.checkLimit(key)
}

// Rate limiting wrapper for Next.js App Router
export function withSimpleRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: SimpleRateLimiter = apiLimiter
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimit = checkRateLimit(request, limiter)
    
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      }, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limiter['maxRequests'].toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
        }
      })
    }

    const response = await handler(request)
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', limiter['maxRequests'].toString())
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())
    
    return response
  }
} 