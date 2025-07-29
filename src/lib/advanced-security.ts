import { NextRequest } from 'next/server'

// Threat detection patterns
const THREAT_PATTERNS = {
  // XSS patterns
  xss: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ],
  
  // SQL injection patterns
  sqlInjection: [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(\b(or|and)\b\s+\d+\s*=\s*\d+)/gi,
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*--)/gi,
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\/\*)/gi
  ],
  
  // Command injection patterns
  commandInjection: [
    /(\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ipconfig)\b)/gi,
    /(\b(rm|del|mkdir|touch|chmod|chown|sudo|su)\b)/gi,
    /(\b(wget|curl|nc|telnet|ssh|ftp|scp)\b)/gi,
    /(\b(&&|\|\||;|`|$\(|\))\b)/gi
  ],
  
  // Path traversal patterns
  pathTraversal: [
    /\.\.\//gi,
    /\.\.\\/gi,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi
  ],
  
  // File inclusion patterns
  fileInclusion: [
    /(\b(include|require|include_once|require_once)\b)/gi,
    /(\b(file_get_contents|file_put_contents|fopen|fread|fwrite)\b)/gi,
    /(\b(readfile|file|file_exists|is_file|is_dir)\b)/gi
  ]
}

// IP reputation tracking
interface IPReputation {
  ip: string
  threatScore: number
  lastSeen: number
  violations: string[]
  blocked: boolean
  blockExpiry?: number
}

class ThreatDetector {
  private ipReputations: Map<string, IPReputation> = new Map()
  private suspiciousIPs: Set<string> = new Set()
  private blockedIPs: Set<string> = new Set()
  
  // Threat score thresholds
  private readonly THREAT_THRESHOLD = 50
  private readonly BLOCK_THRESHOLD = 100
  private readonly BLOCK_DURATION = 3600000 // 1 hour in milliseconds
  
  /**
   * Analyze request for threats
   */
  analyzeRequest(request: NextRequest): {
    isThreat: boolean
    threatScore: number
    threats: string[]
    shouldBlock: boolean
  } {
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const url = request.url
    const method = request.method
    
    let threatScore = 0
    const threats: string[] = []
    
    // Check for suspicious user agents
    if (this.isSuspiciousUserAgent(userAgent)) {
      threatScore += 20
      threats.push('Suspicious User Agent')
    }
    
    // Check for suspicious request patterns
    if (this.isSuspiciousRequest(url, method)) {
      threatScore += 30
      threats.push('Suspicious Request Pattern')
    }
    
    // Check IP reputation
    const reputation = this.getIPReputation(ip)
    if (reputation.blocked) {
      if (reputation.blockExpiry && Date.now() > reputation.blockExpiry) {
        // Unblock expired IP
        this.unblockIP(ip)
      } else {
        return {
          isThreat: true,
          threatScore: 100,
          threats: ['IP Blocked'],
          shouldBlock: true
        }
      }
    }
    
    // Update IP reputation
    this.updateIPReputation(ip, threatScore, threats)
    
    return {
      isThreat: threatScore > this.THREAT_THRESHOLD,
      threatScore,
      threats,
      shouldBlock: threatScore > this.BLOCK_THRESHOLD
    }
  }
  
  /**
   * Analyze content for malicious patterns
   */
  analyzeContent(content: string): {
    isMalicious: boolean
    threatScore: number
    threats: string[]
  } {
    let threatScore = 0
    const threats: string[] = []
    
    // Check for XSS patterns
    for (const pattern of THREAT_PATTERNS.xss) {
      if (pattern.test(content)) {
        threatScore += 40
        threats.push('XSS Pattern Detected')
        break
      }
    }
    
    // Check for SQL injection patterns
    for (const pattern of THREAT_PATTERNS.sqlInjection) {
      if (pattern.test(content)) {
        threatScore += 50
        threats.push('SQL Injection Pattern Detected')
        break
      }
    }
    
    // Check for command injection patterns
    for (const pattern of THREAT_PATTERNS.commandInjection) {
      if (pattern.test(content)) {
        threatScore += 60
        threats.push('Command Injection Pattern Detected')
        break
      }
    }
    
    // Check for path traversal patterns
    for (const pattern of THREAT_PATTERNS.pathTraversal) {
      if (pattern.test(content)) {
        threatScore += 30
        threats.push('Path Traversal Pattern Detected')
        break
      }
    }
    
    // Check for file inclusion patterns
    for (const pattern of THREAT_PATTERNS.fileInclusion) {
      if (pattern.test(content)) {
        threatScore += 45
        threats.push('File Inclusion Pattern Detected')
        break
      }
    }
    
    return {
      isMalicious: threatScore > 0,
      threatScore,
      threats
    }
  }
  
  /**
   * Get client IP address
   */
  getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           request.headers.get('x-client-ip') ||
           'unknown'
  }
  
  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /perl/i,
      /ruby/i,
      /java/i,
      /go-http-client/i,
      /masscan/i,
      /nmap/i,
      /sqlmap/i,
      /nikto/i,
      /dirbuster/i,
      /gobuster/i,
      /wfuzz/i,
      /burp/i,
      /zap/i
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }
  
  /**
   * Check if request pattern is suspicious
   */
  private isSuspiciousRequest(url: string, method: string): boolean {
    const suspiciousPatterns = [
      /\.(php|asp|aspx|jsp|jspx|do|action)$/i,
      /(admin|login|wp-admin|administrator)/i,
      /(\.env|\.git|\.svn|\.htaccess|\.htpasswd)/i,
      /(union|select|insert|update|delete|drop|create|alter)/i,
      /(eval|exec|system|shell_exec|passthru)/i,
      /(file_get_contents|file_put_contents|fopen)/i,
      /(include|require|include_once|require_once)/i
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(url))
  }
  
  /**
   * Get IP reputation
   */
  private getIPReputation(ip: string): IPReputation {
    if (!this.ipReputations.has(ip)) {
      this.ipReputations.set(ip, {
        ip,
        threatScore: 0,
        lastSeen: Date.now(),
        violations: [],
        blocked: false
      })
    }
    
    return this.ipReputations.get(ip)!
  }
  
  /**
   * Update IP reputation
   */
  private updateIPReputation(ip: string, threatScore: number, threats: string[]): void {
    const reputation = this.getIPReputation(ip)
    
    reputation.threatScore += threatScore
    reputation.lastSeen = Date.now()
    reputation.violations.push(...threats)
    
    // Block IP if threshold exceeded
    if (reputation.threatScore > this.BLOCK_THRESHOLD && !reputation.blocked) {
      this.blockIP(ip)
    }
    
    // Clean old violations (keep last 10)
    if (reputation.violations.length > 10) {
      reputation.violations = reputation.violations.slice(-10)
    }
  }
  
  /**
   * Block IP address
   */
  private blockIP(ip: string): void {
    const reputation = this.getIPReputation(ip)
    reputation.blocked = true
    reputation.blockExpiry = Date.now() + this.BLOCK_DURATION
    this.blockedIPs.add(ip)
    
    console.log(`🚫 IP ${ip} blocked due to high threat score: ${reputation.threatScore}`)
  }
  
  /**
   * Unblock IP address
   */
  private unblockIP(ip: string): void {
    const reputation = this.getIPReputation(ip)
    reputation.blocked = false
    reputation.blockExpiry = undefined
    this.blockedIPs.delete(ip)
    
    console.log(`✅ IP ${ip} unblocked`)
  }
  
  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalIPs: number
    blockedIPs: number
    suspiciousIPs: number
    averageThreatScore: number
    topThreats: string[]
  } {
    const ips = Array.from(this.ipReputations.values())
    const totalThreatScore = ips.reduce((sum, ip) => sum + ip.threatScore, 0)
    const averageThreatScore = ips.length > 0 ? totalThreatScore / ips.length : 0
    
    // Count threat types
    const threatCounts: { [key: string]: number } = {}
    ips.forEach(ip => {
      ip.violations.forEach(violation => {
        threatCounts[violation] = (threatCounts[violation] || 0) + 1
      })
    })
    
    const topThreats = Object.entries(threatCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([threat]) => threat)
    
    return {
      totalIPs: ips.length,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      averageThreatScore: Math.round(averageThreatScore),
      topThreats
    }
  }
  
  /**
   * Clean up old data
   */
  cleanup(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    for (const [ip, reputation] of this.ipReputations.entries()) {
      if (now - reputation.lastSeen > maxAge) {
        this.ipReputations.delete(ip)
        this.blockedIPs.delete(ip)
        this.suspiciousIPs.delete(ip)
      }
    }
  }
}

// Global threat detector instance
export const threatDetector = new ThreatDetector()

// Security analytics
export class SecurityAnalytics {
  private events: Array<{
    timestamp: number
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    details: any
  }> = []
  
  /**
   * Log security event
   */
  logEvent(type: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any): void {
    this.events.push({
      timestamp: Date.now(),
      type,
      severity,
      details
    })
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
    
    console.log(`🔒 Security Event: ${type} (${severity})`, details)
  }
  
  /**
   * Get security analytics
   */
  getAnalytics(): {
    totalEvents: number
    eventsByType: { [key: string]: number }
    eventsBySeverity: { [key: string]: number }
    recentEvents: any[]
    threatTrends: any[]
  } {
    const now = Date.now()
    const last24Hours = now - (24 * 60 * 60 * 1000)
    const recentEvents = this.events.filter(e => e.timestamp > last24Hours)
    
    const eventsByType: { [key: string]: number } = {}
    const eventsBySeverity: { [key: string]: number } = {}
    
    this.events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
    })
    
    // Calculate threat trends (events per hour)
    const threatTrends = []
    for (let i = 23; i >= 0; i--) {
      const hourStart = now - (i * 60 * 60 * 1000)
      const hourEnd = hourStart + (60 * 60 * 1000)
      const hourEvents = this.events.filter(e => e.timestamp >= hourStart && e.timestamp < hourEnd)
      
      threatTrends.push({
        hour: new Date(hourStart).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false }),
        count: hourEvents.length,
        critical: hourEvents.filter(e => e.severity === 'critical').length,
        high: hourEvents.filter(e => e.severity === 'high').length
      })
    }
    
    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      recentEvents: recentEvents.slice(-50), // Last 50 events
      threatTrends
    }
  }
}

// Global security analytics instance
export const securityAnalytics = new SecurityAnalytics()

// Advanced security middleware
export function withAdvancedSecurity(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    // Analyze request for threats
    const threatAnalysis = threatDetector.analyzeRequest(request)
    
    // Log security event
    if (threatAnalysis.isThreat) {
      securityAnalytics.logEvent('threat_detected', 
        threatAnalysis.threatScore > 80 ? 'critical' : 
        threatAnalysis.threatScore > 60 ? 'high' : 
        threatAnalysis.threatScore > 40 ? 'medium' : 'low',
        {
          ip: threatDetector.getClientIP(request),
          threatScore: threatAnalysis.threatScore,
          threats: threatAnalysis.threats,
          url: request.url,
          method: request.method
        }
      )
    }
    
    // Block if threat is too high
    if (threatAnalysis.shouldBlock) {
      securityAnalytics.logEvent('ip_blocked', 'critical', {
        ip: threatDetector.getClientIP(request),
        threatScore: threatAnalysis.threatScore,
        threats: threatAnalysis.threats
      })
      
      return new Response(JSON.stringify({
        error: 'Access denied',
        message: 'Your request has been blocked due to security concerns',
        code: 'SECURITY_BLOCK'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Continue with request
    return handler(request)
  }
} 