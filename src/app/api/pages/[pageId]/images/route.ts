import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const resolvedParams = await params
  try {
    const data = await request.json()
    const images = data.images || []

    const savedImages = []

    for (const image of images) {
      const savedImage = await prisma.pageImage.create({
        data: {
          pageId: resolvedParams.pageId,
          originalName: image.originalName,
          fileName: image.fileName,
          filePath: image.filePath,
          altText: image.altText,
          fileSize: image.fileSize,
          mimeType: image.mimeType,
          width: image.width,
          height: image.height,
          sortOrder: image.sortOrder || 0
        }
      })
      savedImages.push(savedImage)
    }

    return NextResponse.json({ success: true, images: savedImages })
  } catch (error) {
    console.error('Save images error:', error)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const resolvedParams = await params
  try {
    const images = await prisma.pageImage.findMany({
      where: { pageId: resolvedParams.pageId },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Fetch images error:', error)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }
} 