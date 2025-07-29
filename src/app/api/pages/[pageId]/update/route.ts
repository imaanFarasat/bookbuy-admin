import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params
    const data = await request.json()
    console.log('=== DATABASE OPERATION: UPDATE PAGE ===')
    console.log('📝 Page ID:', pageId)
    console.log('📝 Data being sent to database:')
    Object.keys(data).forEach(key => {
      const value = data[key]
      if (typeof value === 'string') {
        console.log(`  - ${key}:`, value.length > 100 ? `${value.substring(0, 100)}...` : value)
      } else {
        console.log(`  - ${key}:`, value)
      }
    })

        // Only update fields that are provided, don't overwrite with null
    const updateData: any = {}

    if (data.content !== undefined) updateData.content = data.content
    if (data.faq !== undefined) updateData.faqContent = data.faq
    if (data.schema !== undefined) updateData.faqSchema = data.schema
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription
    if (data.tableOfContents !== undefined) updateData.tableOfContents = data.tableOfContents
    if (data.relatedArticles !== undefined) updateData.relatedArticles = data.relatedArticles
    if (data.canonicalUrl !== undefined) updateData.canonicalUrl = data.canonicalUrl
    if (data.openGraphImage !== undefined) updateData.openGraphImage = data.openGraphImage
    if (data.status !== undefined) updateData.status = data.status

    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: updateData
    })

    console.log('📊 Database result:')
    console.log('  - Updated at:', updatedPage.updatedAt)
    console.log('  - Fields updated:', Object.keys(updateData).join(', '))
    console.log('=====================================')

    return NextResponse.json({ 
      success: true, 
      message: 'Page updated successfully',
      page: updatedPage
    })
  } catch (error) {
    console.error('Update page error:', error)
    return NextResponse.json({ 
      error: 'Update failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 