import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withSecureValidation } from '@/lib/security-wrapper'
import { z } from 'zod'

const parentPageSchema = z.object({
  name: z.string()
    .min(1, 'Parent page name is required')
    .max(100, 'Parent page name too long')
    .refine(
      (value) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(value),
      'Script tags are not allowed'
    )
    .refine(
      (value) => !/javascript:|data:|vbscript:|on\w+\s*=/i.test(value),
      'Malicious content detected'
    )
})

// GET - Fetch all parent pages
export async function GET() {
  try {
    const parentPages = await prisma.parentPage.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    })

    return NextResponse.json({ parentPages })
  } catch (error) {
    console.error('Error fetching parent pages:', error)
    return NextResponse.json({ error: 'Failed to fetch parent pages' }, { status: 500 })
  }
}

// POST - Create new parent page or check if exists
async function handler(request: NextRequest, validatedData: any) {
  try {
    const { name } = validatedData

    // Capitalize first letters of each word
    const capitalizedName = name
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    // Check if parent page already exists
    const existingParentPage = await prisma.parentPage.findUnique({
      where: { name: capitalizedName }
    })

    if (existingParentPage) {
      return NextResponse.json({ 
        exists: true, 
        parentPage: existingParentPage,
        message: 'Parent page already exists in database'
      })
    }

    // Create new parent page
    const newParentPage = await prisma.parentPage.create({
      data: { name: capitalizedName }
    })

    return NextResponse.json({ 
      exists: false, 
      parentPage: newParentPage,
      message: 'New parent page created successfully'
    })
  } catch (error) {
    console.error('Error creating parent page:', error)
    return NextResponse.json({ error: 'Failed to create parent page' }, { status: 500 })
  }
}

export const POST = withSecureValidation(handler, parentPageSchema) 