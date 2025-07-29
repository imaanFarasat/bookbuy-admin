import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('Generating sitemap...')
    
    // Test database connection first
    try {
      await prisma.$connect()
      console.log('Database connected successfully')
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      throw new Error('Database connection failed')
    }
    
    // Get all pages
    const pages = await prisma.page.findMany({
      select: { 
        handle: true, 
        mainKeyword: true,
        metaTitle: true,
        updatedAt: true 
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    console.log('Found pages:', pages.length)
    console.log('Sample pages:', pages.slice(0, 3))

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'
    
    // Start building sitemap XML
    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n`
    sitemapContent += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    
    // Add homepage
    sitemapContent += `  <url>\n`
    sitemapContent += `    <loc>${baseUrl}</loc>\n`
    sitemapContent += `    <lastmod>${new Date().toISOString()}</lastmod>\n`
    sitemapContent += `    <changefreq>daily</changefreq>\n`
    sitemapContent += `    <priority>1.0</priority>\n`
    sitemapContent += `  </url>\n`
    
    // Add all pages
    pages.forEach(page => {
      const pageUrl = `${baseUrl}/${page.handle}`
      const lastmod = page.updatedAt.toISOString()
      
      sitemapContent += `  <url>\n`
      sitemapContent += `    <loc>${pageUrl}</loc>\n`
      sitemapContent += `    <lastmod>${lastmod}</lastmod>\n`
      sitemapContent += `    <changefreq>weekly</changefreq>\n`
      sitemapContent += `    <priority>0.8</priority>\n`
      sitemapContent += `  </url>\n`
    })
    
    sitemapContent += `</urlset>`

    return new NextResponse(sitemapContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Fallback sitemap
    const fallbackContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`
    
    return new NextResponse(fallbackContent, {
      headers: {
        'Content-Type': 'application/xml'
      }
    })
  }
} 