// Rate Limit Configuration
// Adjust these values based on your OpenAI plan and requirements

export const RATE_LIMIT_CONFIG = {
  // OpenAI API rate limits (per minute) - Single admin setup
  openAI: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute (higher for single admin)
    // Adjust based on your OpenAI plan:
    // - Free tier: 3 requests per minute
    // - Pay-as-you-go: 20 requests per minute (increased for single user)
    // - Team/Enterprise: 50+ requests per minute
  },
  
  // User-specific rate limits (per minute) - Single admin setup
  user: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 user actions per minute (higher for single admin)
  },
  
  // General API rate limits (per minute) - Single admin setup
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 API requests per minute (higher for single admin)
  },
  
  // Rate limit headers
  headers: {
    limit: 'X-RateLimit-Limit',
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    retryAfter: 'Retry-After'
  }
}

// Helper function to get rate limit config
export function getRateLimitConfig(type: 'openAI' | 'user' | 'api') {
  return RATE_LIMIT_CONFIG[type]
}

// Helper function to check if rate limit is exceeded
export function isRateLimitExceeded(count: number, limit: number): boolean {
  return count >= limit
}

// Helper function to get remaining requests
export function getRemainingRequests(count: number, limit: number): number {
  return Math.max(0, limit - count)
}

// Helper function to get retry after time
export function getRetryAfterTime(resetTime: number): number {
  return Math.ceil((resetTime - Date.now()) / 1000)
} 