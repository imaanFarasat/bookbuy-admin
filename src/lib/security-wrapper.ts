import { NextRequest, NextResponse } from 'next/server'
import { withSimpleRateLimit, openAILimiter, userLimiter } from './rate-limiter-simple'
import { withValidation, withContentValidation, withPageValidation } from './validation-middleware'
import { addSecurityHeaders } from './validation-middleware'

/**
 * Security wrapper that combines rate limiting with validation
 */
export function withSecureValidation<T>(
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>,
  schema: any,
  rateLimiter: any = userLimiter
) {
  const validatedHandler = withValidation(handler, schema)
  const rateLimitedHandler = withSimpleRateLimit(validatedHandler, rateLimiter)
  
  return async (request: NextRequest) => {
    const response = await rateLimitedHandler(request)
    return addSecurityHeaders(response)
  }
}

/**
 * Security wrapper for content generation (OpenAI rate limiting + validation)
 */
export function withSecureContentValidation<T>(
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>,
  schema: any
) {
  const validatedHandler = withContentValidation(handler, schema)
  const rateLimitedHandler = withSimpleRateLimit(validatedHandler, openAILimiter)
  
  return async (request: NextRequest) => {
    const response = await rateLimitedHandler(request)
    return addSecurityHeaders(response)
  }
}

/**
 * Security wrapper for page operations (user rate limiting + validation)
 */
export function withSecurePageValidation(
  handler: (request: NextRequest, validatedData: any) => Promise<NextResponse>
) {
  const validatedHandler = withPageValidation(handler)
  const rateLimitedHandler = withSimpleRateLimit(validatedHandler, userLimiter)
  
  return async (request: NextRequest) => {
    const response = await rateLimitedHandler(request)
    return addSecurityHeaders(response)
  }
}

/**
 * Add security headers to all responses
 */
export function secureResponse(response: NextResponse): NextResponse {
  return addSecurityHeaders(response)
} 