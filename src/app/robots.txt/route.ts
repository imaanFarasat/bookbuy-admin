import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get all pages
    const pages = await prisma.page.findMany({
      select: { handle: true, createdAt: true }
    })

    // Generate sitemap URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'
    const sitemapUrl = `${baseUrl}/sitemap.xml`

    // Start building robots.txt content
    let robotsContent = `User-agent: *\n`
    robotsContent += `Allow: /\n\n`
    
    // Add sitemap
    robotsContent += `Sitemap: ${sitemapUrl}\n\n`
    
    // Add crawl delay for large sites
    if (pages.length > 1000) {
      robotsContent += `Crawl-delay: 1\n\n`
    }

    // Add specific rules for different user agents
    robotsContent += `# Googlebot specific rules\n`
    robotsContent += `User-agent: Googlebot\n`
    robotsContent += `Allow: /\n`
    robotsContent += `Crawl-delay: 0.5\n\n`

    robotsContent += `# Bingbot specific rules\n`
    robotsContent += `User-agent: Bingbot\n`
    robotsContent += `Allow: /\n`
    robotsContent += `Crawl-delay: 1\n\n`

    // Add disallow rules for admin areas
    robotsContent += `# Disallow admin areas\n`
    robotsContent += `User-agent: *\n`
    robotsContent += `Disallow: /dashboard\n`
    robotsContent += `Disallow: /api/\n`
    robotsContent += `Disallow: /admin\n\n`

    // Add specific page rules if needed
    if (pages.length > 0) {
      robotsContent += `# Allow all content pages\n`
      pages.forEach(page => {
        robotsContent += `Allow: /${page.handle}\n`
      })
    }

    return new NextResponse(robotsContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })
  } catch (error) {
    console.error('Error generating robots.txt:', error)
    
    // Fallback robots.txt
    const fallbackContent = `User-agent: *\nAllow: /\n\nSitemap: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'}/sitemap.xml`
    
    return new NextResponse(fallbackContent, {
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }
} 