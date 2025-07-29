import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const savePageSchema = z.object({
  handle: z.string().min(1),
  mainKeyword: z.string().min(1),
  category: z.string().optional(),
  parentPageId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonical: z.boolean().optional(),
  content: z.string().optional(),
  faqContent: z.string().optional(), // Changed back to faqContent to match database schema
  faqSchema: z.any().optional(), // Changed back to faqSchema to match database schema
  keywords: z.array(z.object({
    keyword: z.string(),
    volume: z.number().optional(),
    category: z.string().optional(),
    selected: z.boolean(),
    headingType: z.string()
  })),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string(),
    source: z.string(),
    type: z.string()
  })).optional(),
  bannerAds: z.array(z.object({
    title: z.string(),
    description: z.string(),
    cta: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
      source: z.string()
    }).nullable().optional()
  })).optional(),
  heroSection: z.object({
    h1: z.string(),
    slogan: z.string(),
    span: z.string(),
    buttonUrl: z.string(),
    image1: z.string().optional(),
    image2: z.string().optional(),
    alt1: z.string().optional(),
    alt2: z.string().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received data for page creation:', {
      handle: body.handle,
      mainKeyword: body.mainKeyword,
      contentLength: body.content?.length || 0,
      faqLength: body.faq?.length || 0,
      schemaLength: body.schema?.length || 0,
      keywordsCount: body.keywords?.length || 0
    })
    
    const validatedData = savePageSchema.parse(body)
    
    // Check content size to prevent database storage issues
    const contentSize = validatedData.content?.length || 0
    const maxContentSize = 1000000 // 1MB limit
    
    if (contentSize > maxContentSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content too large for database storage',
          details: `Content size (${contentSize} characters) exceeds maximum allowed size (${maxContentSize} characters)`,
          contentSize,
          maxContentSize
        },
        { status: 413 } // Payload Too Large
      )
    }

    // Test database connection first
    try {
      await prisma.$connect()
      console.log('Database connection successful')
    } catch (error) {
      console.error('Database connection failed:', error)
      throw new Error('Database connection failed')
    }

    // Create a default user if it doesn't exist
    let defaultUser = await prisma.user.findFirst({
      where: { email: 'default@example.com' }
    })

    if (!defaultUser) {
      console.log('Creating default user...')
      defaultUser = await prisma.user.create({
        data: {
          email: 'default@example.com',
          name: 'Default User',
          passwordHash: 'default-hash',
          subscriptionTier: 'free',
          apiQuota: 1000
        }
      })
      console.log('Default user created:', defaultUser.id)
    } else {
      console.log('Using existing default user:', defaultUser.id)
    }

    // Create the page
    const page = await prisma.page.create({
      data: {
        handle: validatedData.handle,
        mainKeyword: validatedData.mainKeyword,
        category: validatedData.category || 'general',
        parentPageId: validatedData.parentPageId,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        canonical: validatedData.canonical !== undefined ? validatedData.canonical : true,
        content: validatedData.content,
        faqContent: validatedData.faqContent,
        faqSchema: validatedData.faqSchema,
        status: 'published',
        publishedAt: new Date(),
        userId: defaultUser.id,
        keywords: {
          create: validatedData.keywords.map((kw, index) => ({
            keyword: kw.keyword,
            volume: kw.volume,
            category: kw.category,
            selected: kw.selected,
            headingType: kw.headingType,
            sortOrder: index
          }))
        },
        images: {
          create: validatedData.images?.map((img, index) => ({
            originalName: `${img.type}-${index + 1}`,
            fileName: `${img.type}-${index + 1}.jpg`,
            filePath: img.url, // Store Base64 or file path
            altText: img.alt,
            fileSize: img.url.length, // Approximate size
            mimeType: 'image/jpeg',
            sortOrder: index
          })) || []
        }
      },
      include: {
        keywords: true,
        images: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Page saved successfully',
      page: {
        id: page.id,
        handle: page.handle,
        mainKeyword: page.mainKeyword,
        status: page.status,
        createdAt: page.createdAt
      }
    })

        } catch (error) {
      console.error('Error saving page:', error)
      
      // Log more details for debugging
      if (error instanceof Error) {
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      
      // Check for specific database storage errors
      let errorMessage = 'Failed to save page'
      let statusCode = 500
      
      if (error instanceof Error) {
        if (error.message.includes('table') && error.message.includes('full')) {
          errorMessage = 'Database storage limit reached. Please try again later or contact support.'
          statusCode = 507 // Insufficient Storage
        } else if (error.message.includes('connection')) {
          errorMessage = 'Database connection failed. Please try again.'
          statusCode = 503 // Service Unavailable
        } else if (error.message.includes('Unique constraint failed') && error.message.includes('page_handle_key')) {
          errorMessage = 'A page with this handle already exists. Please try again.'
          statusCode = 409 // Conflict
        }
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        { status: statusCode }
      )
    }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category

    const pages = await prisma.page.findMany({
      where,
      include: {
        keywords: {
          where: { selected: true },
          orderBy: { sortOrder: 'asc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            keywords: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    })

    const total = await prisma.page.count({ where })

    return NextResponse.json({
      success: true,
      pages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })

  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 