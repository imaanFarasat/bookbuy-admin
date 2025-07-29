import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sanitizePageData, sanitizeHtml, sanitizeText, containsMaliciousCode } from './sanitizers'

// Request size limits
const MAX_REQUEST_SIZE = 1024 * 1024 // 1MB
const MAX_CONTENT_LENGTH = 50000 // 50KB for content
const MAX_JSON_DEPTH = 10

/**
 * Validate request size
 */
export function validateRequestSize(request: NextRequest): boolean {
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    return size <= MAX_REQUEST_SIZE
  }
  return true
}

/**
 * Validate request body size after parsing
 */
export function validateRequestBodySize(data: any): boolean {
  const dataString = JSON.stringify(data)
  return dataString.length <= MAX_REQUEST_SIZE
}

/**
 * Validate JSON structure depth
 */
export function validateJsonDepth(obj: any, maxDepth: number = MAX_JSON_DEPTH, currentDepth: number = 0): boolean {
  if (currentDepth > maxDepth) {
    return false
  }
  
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (!validateJsonDepth(obj[key], maxDepth, currentDepth + 1)) {
        return false
      }
    }
  }
  
  return true
}

/**
 * Generic validation middleware
 */
export function withValidation<T>(
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>,
  schema: z.ZodSchema<T>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check request size
      if (!validateRequestSize(request)) {
        return NextResponse.json({
          error: 'Request too large',
          message: 'Request body exceeds maximum allowed size'
        }, { status: 413 })
      }

      // Parse and validate JSON
      let data: any
      try {
        data = await request.json()
      } catch (error) {
        return NextResponse.json({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        }, { status: 400 })
      }

      // Check request body size after parsing
      if (!validateRequestBodySize(data)) {
        return NextResponse.json({
          error: 'Request too large',
          message: 'Request body exceeds maximum allowed size'
        }, { status: 413 })
      }

      // Check JSON depth
      if (!validateJsonDepth(data)) {
        return NextResponse.json({
          error: 'Invalid request structure',
          message: 'Request structure is too deep'
        }, { status: 400 })
      }

      // Validate with schema
      const validatedData = schema.parse(data)

      // Check for malicious content
      const dataString = JSON.stringify(validatedData)
      if (containsMaliciousCode(dataString)) {
        return NextResponse.json({
          error: 'Malicious content detected',
          message: 'Request contains potentially harmful content'
        }, { status: 400 })
      }

      // Call the handler with validated data
      return await handler(request, validatedData)

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          message: 'Request data does not match expected format',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 })
      }

      console.error('Validation middleware error:', error)
      return NextResponse.json({
        error: 'Internal server error',
        message: 'An error occurred while processing the request'
      }, { status: 500 })
    }
  }
}

/**
 * Content validation middleware with sanitization
 */
export function withContentValidation<T>(
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>,
  schema: z.ZodSchema<T>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check request size
      if (!validateRequestSize(request)) {
        return NextResponse.json({
          error: 'Request too large',
          message: 'Request body exceeds maximum allowed size'
        }, { status: 413 })
      }

      // Parse JSON
      let data: any
      try {
        data = await request.json()
      } catch (error) {
        return NextResponse.json({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        }, { status: 400 })
      }

      // Check request body size after parsing
      if (!validateRequestBodySize(data)) {
        return NextResponse.json({
          error: 'Request too large',
          message: 'Request body exceeds maximum allowed size'
        }, { status: 413 })
      }

      // Check JSON depth
      if (!validateJsonDepth(data)) {
        return NextResponse.json({
          error: 'Invalid request structure',
          message: 'Request structure is too deep'
        }, { status: 400 })
      }

      // Sanitize content fields
      if (data.content && typeof data.content === 'string') {
        data.content = sanitizeHtml(data.content)
        if (data.content.length > MAX_CONTENT_LENGTH) {
          return NextResponse.json({
            error: 'Content too large',
            message: 'Content exceeds maximum allowed length'
          }, { status: 413 })
        }
      }

      if (data.faq && typeof data.faq === 'string') {
        data.faq = sanitizeHtml(data.faq)
      }

      if (data.mainKeyword && typeof data.mainKeyword === 'string') {
        data.mainKeyword = sanitizeText(data.mainKeyword)
      }

      if (data.handle && typeof data.handle === 'string') {
        data.handle = sanitizeText(data.handle)
      }

      // Validate with schema
      const validatedData = schema.parse(data)

      // Call the handler with validated and sanitized data
      return await handler(request, validatedData)

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          message: 'Request data does not match expected format',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 })
      }

      console.error('Content validation middleware error:', error)
      return NextResponse.json({
        error: 'Internal server error',
        message: 'An error occurred while processing the request'
      }, { status: 500 })
    }
  }
}

/**
 * Page data validation middleware with full sanitization
 */
export function withPageValidation(
  handler: (request: NextRequest, validatedData: any) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check request size
      if (!validateRequestSize(request)) {
        return NextResponse.json({
          error: 'Request too large',
          message: 'Request body exceeds maximum allowed size'
        }, { status: 413 })
      }

      // Parse JSON
      let data: any
      try {
        data = await request.json()
      } catch (error) {
        return NextResponse.json({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        }, { status: 400 })
      }

      // Check JSON depth
      if (!validateJsonDepth(data)) {
        return NextResponse.json({
          error: 'Invalid request structure',
          message: 'Request structure is too deep'
        }, { status: 400 })
      }

      // Sanitize all page data
      const sanitizedData = sanitizePageData(data)
      if (!sanitizedData) {
        return NextResponse.json({
          error: 'Invalid page data',
          message: 'Page data is invalid or missing required fields'
        }, { status: 400 })
      }

      // Call the handler with sanitized data
      return await handler(request, sanitizedData)

    } catch (error) {
      console.error('Page validation middleware error:', error)
      return NextResponse.json({
        error: 'Internal server error',
        message: 'An error occurred while processing the request'
      }, { status: 500 })
    }
  }
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  )
  
  return response
} 