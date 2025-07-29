import { RATE_LIMIT_CONFIG } from './rate-limit-config'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  private cleanup() {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key]
      }
    })
  }

  isAllowed(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanup()
    
    const now = Date.now()
    const windowStart = now - (now % this.config.windowMs)
    const resetTime = windowStart + this.config.windowMs

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
    const remaining = Math.max(0, this.config.maxRequests - currentCount)
    const allowed = currentCount < this.config.maxRequests

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
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs
      }
    }

    return {
      count: this.store[key].count,
      remaining: Math.max(0, this.config.maxRequests - this.store[key].count),
      resetTime: this.store[key].resetTime
    }
  }
}

// Rate limiters
export const openAIRateLimiter = new RateLimiter({
  windowMs: RATE_LIMIT_CONFIG.openAI.windowMs,
  maxRequests: RATE_LIMIT_CONFIG.openAI.maxRequests
})

export const apiRateLimiter = new RateLimiter({
  windowMs: RATE_LIMIT_CONFIG.api.windowMs,
  maxRequests: RATE_LIMIT_CONFIG.api.maxRequests
})

export const userRateLimiter = new RateLimiter({
  windowMs: RATE_LIMIT_CONFIG.user.windowMs,
  maxRequests: RATE_LIMIT_CONFIG.user.maxRequests
})

// Rate limiting middleware
export function withRateLimit(
  handler: Function,
  limiter: RateLimiter = apiRateLimiter,
  keyGenerator?: (req: any) => string
) {
  return async (req: any, res: any) => {
    const key = keyGenerator ? keyGenerator(req) : req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    
    const rateLimit = limiter.isAllowed(key)
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      })
    }

    res.setHeader('X-RateLimit-Limit', limiter['config'].maxRequests)
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining)
    res.setHeader('X-RateLimit-Reset', rateLimit.resetTime)

    return handler(req, res)
  }
}

export function withOpenAIRateLimit(handler: Function) {
  return withRateLimit(handler, openAIRateLimiter, (req) => {
    return req.headers['x-user-id'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
  })
}

export function withUserRateLimit(handler: Function) {
  return withRateLimit(handler, userRateLimiter, (req) => {
    return req.headers['x-user-id'] || req.headers['authorization'] || req.headers['x-forwarded-for'] || 'unknown'
  })
} 