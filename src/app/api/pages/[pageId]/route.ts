import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const updatePageSchema = z.object({
  handle: z.string().min(1),
  mainKeyword: z.string().min(1),
  parentPageId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  content: z.string().optional(),
  faqContent: z.string().optional(),
  faqSchema: z.any().optional(),
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
    }).optional()
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const { pageId } = params
    const body = await request.json()
    const validatedData = updatePageSchema.parse(body)

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        keywords: true,
        images: true
      }
    })

    if (!existingPage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Page not found'
        },
        { status: 404 }
      )
    }

    // Update the page
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        handle: validatedData.handle,
        mainKeyword: validatedData.mainKeyword,
        parentPageId: validatedData.parentPageId,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        content: validatedData.content,
        faqContent: validatedData.faqContent,
        faqSchema: validatedData.faqSchema,
        heroImage1: validatedData.heroSection?.image1 || null,
        updatedAt: new Date(),
        // Update keywords
        keywords: {
          deleteMany: {}, // Delete all existing keywords
          create: validatedData.keywords.map((kw, index) => ({
            keyword: kw.keyword,
            volume: kw.volume,
            category: kw.category,
            selected: kw.selected,
            headingType: kw.headingType,
            sortOrder: index
          }))
        },
        // Update images
        images: {
          deleteMany: {}, // Delete all existing images
          create: validatedData.images?.map((img, index) => ({
            originalName: `${img.type}-${index + 1}`,
            fileName: `${img.type}-${index + 1}.jpg`,
            filePath: img.url,
            altText: img.alt,
            fileSize: img.url.length,
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
      message: 'Page updated successfully',
      page: {
        id: updatedPage.id,
        handle: updatedPage.handle,
        mainKeyword: updatedPage.mainKeyword,
        status: updatedPage.status,
        updatedAt: updatedPage.updatedAt
      }
    })

  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update page',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const { pageId } = params

    // Check if page exists
    const page = await prisma.page.findUnique({
      where: { id: pageId }
    })

    if (!page) {
      return NextResponse.json(
        {
          success: false,
          error: 'Page not found'
        },
        { status: 404 }
      )
    }

    // Delete the page (this will cascade delete keywords and images)
    await prisma.page.delete({
      where: { id: pageId }
    })

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete page',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const { pageId } = params

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        keywords: {
          orderBy: { sortOrder: 'asc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!page) {
      return NextResponse.json(
        {
          success: false,
          error: 'Page not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      page
    })

  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch page',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 