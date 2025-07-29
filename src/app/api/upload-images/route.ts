import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    const pageId = formData.get('pageId') as string
    const altText = formData.get('altText') as string

    const uploadedImages = []

    for (const file of files) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        continue
      }

      // Create upload directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', pageId)
      await mkdir(uploadDir, { recursive: true })

      // Process image with Sharp
      const buffer = Buffer.from(await file.arrayBuffer())
      const optimizedBuffer = await sharp(buffer)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer()

      // Generate filename
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      const filePath = path.join(uploadDir, fileName)

      // Save file
      await writeFile(filePath, optimizedBuffer)

      // Get image dimensions
      const metadata = await sharp(optimizedBuffer).metadata()

      // Generate absolute URL for the image
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const imageUrl = `${baseUrl}/uploads/${pageId}/${fileName}`

      uploadedImages.push({
        originalName: file.name,
        fileName: fileName,
        filePath: `/uploads/${pageId}/${fileName}`,
        imageUrl: imageUrl, // Add absolute URL
        altText: altText,
        fileSize: optimizedBuffer.length,
        mimeType: 'image/jpeg',
        width: metadata.width,
        height: metadata.height
      })
    }

    return NextResponse.json({ success: true, images: uploadedImages })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
} 