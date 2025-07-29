import { sanitizeHtml, sanitizeText, sanitizeUrl, containsMaliciousCode } from './sanitizers'
import { handleSchema, contentSchema, metaTitleSchema } from './validation-schemas'

/**
 * Security test suite for validating our security implementation
 */
export class SecurityTester {
  
  /**
   * Test XSS prevention
   */
  static testXSSPrevention(): boolean {
    console.log('🔒 Testing XSS Prevention...')
    
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')">',
      '<iframe src="javascript:alert(\'xss\')"></iframe>',
      '<object data="javascript:alert(\'xss\')"></object>',
      '<embed src="javascript:alert(\'xss\')"></embed>',
      'data:text/html,<script>alert("xss")</script>',
      'vbscript:alert("xss")',
      'file:///etc/passwd'
    ]
    
    let allTestsPassed = true
    
    xssPayloads.forEach((payload, index) => {
      const sanitized = sanitizeHtml(payload)
      const isMalicious = containsMaliciousCode(payload)
      
      if (sanitized.includes('<script') || sanitized.includes('javascript:')) {
        console.log(`❌ XSS Test ${index + 1} FAILED: Malicious content not sanitized`)
        allTestsPassed = false
      } else {
        console.log(`✅ XSS Test ${index + 1} PASSED: ${payload.substring(0, 30)}...`)
      }
      
      if (!isMalicious) {
        console.log(`❌ Malicious Detection Test ${index + 1} FAILED: Should detect malicious content`)
        allTestsPassed = false
      }
    })
    
    return allTestsPassed
  }
  
  /**
   * Test input validation
   */
  static testInputValidation(): boolean {
    console.log('🔒 Testing Input Validation...')
    
    let allTestsPassed = true
    
    // Test handle validation
    const invalidHandles = [
      'UPPERCASE',
      'with spaces',
      'with@symbols',
      'with_underscores',
      'with.dots',
      'a'.repeat(101), // too long
      ''
    ]
    
    invalidHandles.forEach((handle, index) => {
      try {
        handleSchema.parse(handle)
        console.log(`❌ Handle Validation Test ${index + 1} FAILED: Should reject invalid handle`)
        allTestsPassed = false
      } catch (error) {
        console.log(`✅ Handle Validation Test ${index + 1} PASSED: Rejected invalid handle`)
      }
    })
    
    // Test content validation
    const invalidContent = [
      'a'.repeat(50001), // too long
      '<script>alert("xss")</script>',
      ''
    ]
    
    invalidContent.forEach((content, index) => {
      try {
        contentSchema.parse(content)
        console.log(`❌ Content Validation Test ${index + 1} FAILED: Should reject invalid content`)
        allTestsPassed = false
      } catch (error) {
        console.log(`✅ Content Validation Test ${index + 1} PASSED: Rejected invalid content`)
      }
    })
    
    // Test meta title validation
    const invalidMetaTitles = [
      'a'.repeat(61), // too long
      '<script>alert("xss")</script>',
      ''
    ]
    
    invalidMetaTitles.forEach((title, index) => {
      try {
        metaTitleSchema.parse(title)
        console.log(`❌ Meta Title Validation Test ${index + 1} FAILED: Should reject invalid title`)
        allTestsPassed = false
      } catch (error) {
        console.log(`✅ Meta Title Validation Test ${index + 1} PASSED: Rejected invalid title`)
      }
    })
    
    return allTestsPassed
  }
  
  /**
   * Test URL sanitization
   */
  static testURLSanitization(): boolean {
    console.log('🔒 Testing URL Sanitization...')
    
    const maliciousUrls = [
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      'vbscript:alert("xss")',
      'file:///etc/passwd',
      'ftp://malicious.com',
      'gopher://malicious.com'
    ]
    
    let allTestsPassed = true
    
    maliciousUrls.forEach((url, index) => {
      const sanitized = sanitizeUrl(url)
      
      if (sanitized !== '') {
        console.log(`❌ URL Sanitization Test ${index + 1} FAILED: Should block malicious URL`)
        allTestsPassed = false
      } else {
        console.log(`✅ URL Sanitization Test ${index + 1} PASSED: Blocked malicious URL`)
      }
    })
    
    // Test valid URLs
    const validUrls = [
      'https://example.com',
      'http://example.com',
      '/relative/path',
      './relative/path',
      '../relative/path'
    ]
    
    validUrls.forEach((url, index) => {
      const sanitized = sanitizeUrl(url)
      
      if (sanitized === '') {
        console.log(`❌ Valid URL Test ${index + 1} FAILED: Should allow valid URL`)
        allTestsPassed = false
      } else {
        console.log(`✅ Valid URL Test ${index + 1} PASSED: Allowed valid URL`)
      }
    })
    
    return allTestsPassed
  }
  
  /**
   * Test content sanitization
   */
  static testContentSanitization(): boolean {
    console.log('🔒 Testing Content Sanitization...')
    
    let allTestsPassed = true
    
    // Test HTML sanitization
    const htmlContent = '<h1>Title</h1><p>Content</p><script>alert("xss")</script>'
    const sanitizedHtml = sanitizeHtml(htmlContent)
    
    if (sanitizedHtml.includes('<script>')) {
      console.log('❌ HTML Sanitization Test FAILED: Script tags not removed')
      allTestsPassed = false
    } else {
      console.log('✅ HTML Sanitization Test PASSED: Script tags removed')
    }
    
    // Test text sanitization
    const textContent = '<script>alert("xss")</script>javascript:alert("xss")'
    const sanitizedText = sanitizeText(textContent)
    
    if (sanitizedText.includes('<script>') || sanitizedText.includes('javascript:')) {
      console.log('❌ Text Sanitization Test FAILED: Malicious content not removed')
      allTestsPassed = false
    } else {
      console.log('✅ Text Sanitization Test PASSED: Malicious content removed')
    }
    
    return allTestsPassed
  }
  
  /**
   * Run all security tests
   */
  static runAllTests(): void {
    console.log('🚀 Starting Security Test Suite...\n')
    
    const tests = [
      { name: 'XSS Prevention', test: this.testXSSPrevention },
      { name: 'Input Validation', test: this.testInputValidation },
      { name: 'URL Sanitization', test: this.testURLSanitization },
      { name: 'Content Sanitization', test: this.testContentSanitization }
    ]
    
    let allTestsPassed = true
    
    tests.forEach(({ name, test }) => {
      console.log(`\n📋 Running ${name} Tests:`)
      const passed = test.call(this)
      if (!passed) {
        allTestsPassed = false
      }
    })
    
    console.log('\n' + '='.repeat(50))
    if (allTestsPassed) {
      console.log('🎉 ALL SECURITY TESTS PASSED!')
      console.log('✅ Your application is secure!')
    } else {
      console.log('❌ SOME SECURITY TESTS FAILED!')
      console.log('⚠️  Please review and fix the failed tests.')
    }
    console.log('='.repeat(50))
  }
}

/**
 * Security test utilities for manual testing
 */
export const SecurityTestUtils = {
  /**
   * Generate test payloads for manual testing
   */
  generateTestPayloads() {
    return {
      xss: [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '<iframe src="javascript:alert(\'xss\')"></iframe>'
      ],
      sqlInjection: [
        "'; DROP TABLE users; --",
        "' OR 1=1 --",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --"
      ],
      maliciousUrls: [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'file:///etc/passwd'
      ],
      oversizedContent: [
        'a'.repeat(50001), // too long content
        'a'.repeat(101),   // too long handle
        'a'.repeat(61)     // too long meta title
      ]
    }
  },
  
  /**
   * Test API endpoint security
   */
  async testAPIEndpoint(url: string, payload: any): Promise<{ success: boolean; response: any }> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      return {
        success: response.ok,
        response: data
      }
    } catch (error) {
      return {
        success: false,
        response: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
} 