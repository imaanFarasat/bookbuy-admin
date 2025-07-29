import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { generatePageContent } from '@/lib/openai'


async function handler(request: NextRequest) {
  try {
    const { handle, mainKeyword, parentPageId, h2Headings, h3Headings } = await request.json()

    // Validate input
    if (!handle || !mainKeyword) {
      return NextResponse.json({ error: 'Handle and main keyword are required' }, { status: 400 })
    }

    // Check if page already exists
    const existingPage = await prisma.page.findUnique({
      where: { handle },
    })

    if (existingPage) {
      return NextResponse.json({ error: 'Page with this handle already exists' }, { status: 409 })
    }

    // Generate content using AI with custom headings
    const generatedContent = await generatePageContent(mainKeyword, handle, h2Headings, h3Headings)

    // Save to database
    const page = await prisma.page.create({
      data: {
        handle,
        mainKeyword,
        metaTitle: generatedContent.metaTitle || `${mainKeyword} - Complete Guide`,
        metaDescription: generatedContent.metaDescription || `Learn everything about ${mainKeyword}. Expert insights and comprehensive information.`,
        canonicalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${handle}`,
        content: generatedContent.bodyContent || `Content about ${mainKeyword} will be generated here.`,
        faqSchema: generatedContent.faqSchema || null,
        tableOfContents: generatedContent.tableOfContents || null,
        relatedArticles: generatedContent.internalLinks || null,
        parentPageId: parentPageId || null,
        userId: 'default-user-id', // This should be replaced with actual user ID
      },
    })

    return NextResponse.json({ success: true, page })
  } catch (error) {
    console.error('Error generating page:', error)
    return NextResponse.json({ error: 'Failed to generate page' }, { status: 500 })
  }
}

import { withSimpleRateLimit, openAILimiter } from '@/lib/rate-limiter-simple'

export const POST = withSimpleRateLimit(handler, openAILimiter) 