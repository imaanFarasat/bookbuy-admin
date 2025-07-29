import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const resolvedParams = await params
  try {
    const page = await prisma.page.findUnique({
      where: { id: resolvedParams.pageId },
      select: { relatedArticles: true }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Get images separately
    const images = await prisma.pageImage.findMany({
      where: { pageId: resolvedParams.pageId },
      orderBy: { sortOrder: 'asc' }
    })

    // Get the first image URL to use as default for related articles
    const defaultImageUrl = images.length > 0 ? images[0].filePath : null

    return NextResponse.json({
      relatedArticles: page.relatedArticles || [],
      defaultImageUrl
    })
  } catch (error) {
    console.error('Get related articles error:', error)
    return NextResponse.json({
      error: 'Failed to get related articles',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const resolvedParams = await params
  try {
    const { relatedArticles } = await request.json()
    console.log('Updating related articles for page:', resolvedParams.pageId, 'with data:', relatedArticles)

    const updatedPage = await prisma.page.update({
      where: { id: resolvedParams.pageId },
      data: { relatedArticles }
    })

    console.log('Related articles updated:', updatedPage)

    return NextResponse.json({
      success: true,
      message: 'Related articles updated successfully',
      page: updatedPage
    })
  } catch (error) {
    console.error('Update related articles error:', error)
    return NextResponse.json({
      error: 'Update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 