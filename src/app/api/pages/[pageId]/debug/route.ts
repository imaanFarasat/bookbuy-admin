import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params
    
    console.log('Debug: Looking for page with ID:', pageId)
    
    const page = await prisma.page.findUnique({
      where: { id: pageId }
    })

    if (!page) {
      return NextResponse.json({ 
        error: 'Page not found',
        searchedId: pageId,
        message: 'No page found with this ID in the database'
      }, { status: 404 })
    }

    // Show exactly what's in the database
    const debugData = {
      pageId: page.id,
      handle: page.handle,
      mainKeyword: page.mainKeyword,
      parentPageId: page.parentPageId,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      canonicalUrl: page.canonicalUrl,
      content: {
        hasContent: !!page.content,
        length: page.content ? page.content.length : 0,
        preview: page.content ? page.content.substring(0, 100) + '...' : 'No content'
      },
      faqContent: {
        hasFaq: !!page.faqContent,
        length: page.faqContent ? page.faqContent.length : 0,
        preview: page.faqContent ? page.faqContent.substring(0, 100) + '...' : 'No FAQ'
      },
      faqSchema: {
        hasSchema: !!page.faqSchema,
        type: typeof page.faqSchema
      },
      tableOfContents: {
        hasToc: !!page.tableOfContents,
        length: page.tableOfContents ? page.tableOfContents.length : 0,
        preview: page.tableOfContents ? page.tableOfContents.substring(0, 100) + '...' : 'No TOC'
      },
      relatedArticles: {
        hasRelated: !!page.relatedArticles,
        type: typeof page.relatedArticles
      },
      openGraphImage: page.openGraphImage,
      timestamps: {
        createdAt: page.createdAt,
        updatedAt: page.updatedAt
      },
      allFields: Object.keys(page),
      rawData: page
    }

    console.log('Debug: Found page data:', {
      id: page.id,
      handle: page.handle,
      mainKeyword: page.mainKeyword,
      allFields: Object.keys(page)
    })

    return NextResponse.json(debugData, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch debug data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
} 