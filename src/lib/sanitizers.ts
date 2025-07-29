import DOMPurify from 'isomorphic-dompurify'

// HTML sanitization configuration
const sanitizeConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 'i', 'b',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'a', 'img', 'div', 'span', 'table', 'tr', 'td', 'th',
    'thead', 'tbody', 'tfoot'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id',
    'width', 'height', 'target', 'rel'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // Remove any script tags and event handlers
  const cleanHtml = DOMPurify.sanitize(html, sanitizeConfig)
  
  // Additional safety check for script tags
  if (cleanHtml.includes('<script') || cleanHtml.includes('javascript:')) {
    return ''
  }

  return cleanHtml
}

/**
 * Sanitize plain text content
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 50000) // Limit length
}

/**
 * Sanitize URL to prevent open redirect attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  const cleanUrl = url.trim()
  
  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  const hasDangerousProtocol = dangerousProtocols.some(protocol => 
    cleanUrl.toLowerCase().startsWith(protocol)
  )
  
  if (hasDangerousProtocol) {
    return ''
  }

  // Only allow http, https, and relative URLs
  if (!cleanUrl.startsWith('http://') && 
      !cleanUrl.startsWith('https://') && 
      !cleanUrl.startsWith('/') &&
      !cleanUrl.startsWith('./') &&
      !cleanUrl.startsWith('../')) {
    return ''
  }

  return cleanUrl.substring(0, 500) // Limit length
}

/**
 * Sanitize handle/slug for URL safety
 */
export function sanitizeHandle(handle: string): string {
  if (!handle || typeof handle !== 'string') {
    return ''
  }

  return handle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '') // Only allow lowercase letters, numbers, hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
}

/**
 * Sanitize keyword text
 */
export function sanitizeKeyword(keyword: string): string {
  if (!keyword || typeof keyword !== 'string') {
    return ''
  }

  return keyword
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 200) // Limit length
}

/**
 * Sanitize meta title
 */
export function sanitizeMetaTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    return ''
  }

  return title
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 60) // Limit length for SEO
}

/**
 * Sanitize meta description
 */
export function sanitizeMetaDescription(description: string): string {
  if (!description || typeof description !== 'string') {
    return ''
  }

  return description
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 160) // Limit length for SEO
}

/**
 * Sanitize image data
 */
export function sanitizeImageData(image: any): any {
  if (!image || typeof image !== 'object') {
    return null
  }

  return {
    name: image.name ? sanitizeText(image.name) : '',
    url: image.url ? sanitizeUrl(image.url) : '',
    alt: image.alt ? sanitizeText(image.alt) : '',
    width: typeof image.width === 'number' && image.width > 0 && image.width <= 10000 ? image.width : null,
    height: typeof image.height === 'number' && image.height > 0 && image.height <= 10000 ? image.height : null
  }
}

/**
 * Sanitize keyword data
 */
export function sanitizeKeywordData(keyword: any): any {
  if (!keyword || typeof keyword !== 'object') {
    return null
  }

  return {
    keyword: keyword.keyword ? sanitizeKeyword(keyword.keyword) : '',
    volume: typeof keyword.volume === 'number' && keyword.volume >= 0 && keyword.volume <= 1000000 ? keyword.volume : 0,
    category: keyword.category ? sanitizeText(keyword.category) : '',
    selected: typeof keyword.selected === 'boolean' ? keyword.selected : false,
    headingType: keyword.headingType === 'h2' || keyword.headingType === 'h3' ? keyword.headingType : 'h2',
    sortOrder: typeof keyword.sortOrder === 'number' && keyword.sortOrder >= 0 && keyword.sortOrder <= 1000 ? keyword.sortOrder : 0
  }
}

/**
 * Sanitize page data object
 */
export function sanitizePageData(data: any): any {
  if (!data || typeof data !== 'object') {
    return null
  }

  return {
    handle: data.handle ? sanitizeHandle(data.handle) : '',
    mainKeyword: data.mainKeyword ? sanitizeKeyword(data.mainKeyword) : '',
    content: data.content ? sanitizeHtml(data.content) : '',
    faq: data.faq ? sanitizeHtml(data.faq) : '',
    schema: data.schema ? sanitizeText(data.schema) : '',
    metaTitle: data.metaTitle ? sanitizeMetaTitle(data.metaTitle) : '',
    metaDescription: data.metaDescription ? sanitizeMetaDescription(data.metaDescription) : '',
    keywords: Array.isArray(data.keywords) ? data.keywords.map(sanitizeKeywordData).filter(Boolean) : [],
    images: Array.isArray(data.images) ? data.images.map(sanitizeImageData).filter(Boolean) : [],
    parentPageId: data.parentPageId ? sanitizeText(data.parentPageId) : '',
    status: ['draft', 'published', 'archived'].includes(data.status) ? data.status : 'draft'
  }
}

/**
 * Validate and sanitize request body
 */
export function validateAndSanitizeRequest<T>(data: any, validator: (data: any) => T): T {
  try {
    const validated = validator(data)
    return validated
  } catch (error) {
    throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if content contains malicious code
 */
export function containsMaliciousCode(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }

  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /file:/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ]

  return maliciousPatterns.some(pattern => pattern.test(content))
}

/**
 * Remove malicious code from content
 */
export function removeMaliciousCode(content: string): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/file:/gi, '')
    .replace(/<iframe[^>]*>/gi, '')
    .replace(/<\/iframe>/gi, '')
    .replace(/<object[^>]*>/gi, '')
    .replace(/<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
} 