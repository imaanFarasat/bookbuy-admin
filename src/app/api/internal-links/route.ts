import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const createInternalLinksSchema = z.object({
  mainPageId: z.string().min(1),
  relatedPageIds: z.array(z.string().min(1))
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')

    if (!pageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Page ID is required'
        },
        { status: 400 }
      )
    }

    const links = await prisma.internalLink.findMany({
      where: { mainPageId: pageId },
      include: {
        mainPage: true,
        relatedPage: true
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({
      success: true,
      links
    })

  } catch (error) {
    console.error('Error fetching internal links:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch internal links',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received internal links request')
    const body = await request.json()
    console.log('Request body:', body)
    
    const validatedData = createInternalLinksSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Test database connection first
    try {
      await prisma.$connect()
      console.log('Database connection successful')
    } catch (error) {
      console.error('Database connection failed:', error)
      throw new Error('Database connection failed')
    }

    // Delete existing links for this main page
    console.log('Deleting existing links for main page:', validatedData.mainPageId)
    await prisma.internalLink.deleteMany({
      where: { mainPageId: validatedData.mainPageId }
    })

    // Create new links
    console.log('Creating new links:', validatedData.relatedPageIds)
    const links = await Promise.all(
      validatedData.relatedPageIds.map((relatedPageId, index) =>
        prisma.internalLink.create({
          data: {
            mainPageId: validatedData.mainPageId,
            relatedPageId,
            sortOrder: index
          },
          include: {
            mainPage: true,
            relatedPage: true
          }
        })
      )
    )

    console.log('Successfully created links:', links.length)
    return NextResponse.json({
      success: true,
      message: 'Internal links created successfully',
      links
    })

  } catch (error) {
    console.error('Error creating internal links:', error)
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create internal links',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mainPageId = searchParams.get('mainPageId')
    const relatedPageId = searchParams.get('relatedPageId')

    if (!mainPageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Main page ID is required'
        },
        { status: 400 }
      )
    }

    const whereClause = relatedPageId 
      ? { mainPageId, relatedPageId }
      : { mainPageId }

    await prisma.internalLink.deleteMany({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      message: 'Internal links deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting internal links:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete internal links',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 