import { NextRequest, NextResponse } from 'next/server'
import { generateFAQSchema } from '@/lib/openai'
import { withSecureContentValidation } from '@/lib/security-wrapper'
import { z } from 'zod'

const assistantSchemaSchema = z.object({
  faqContent: z.string().min(1, 'FAQ content is required'),
  mainKeyword: z.string().min(1, 'Main keyword is required')
})

async function handler(request: NextRequest, validatedData: any): Promise<NextResponse> {
  try {
    const { faqContent, mainKeyword } = validatedData

    console.log('🤖 Assistant Schema Generation Request:')
    console.log('Main Keyword:', mainKeyword)
    console.log('FAQ Content Length:', faqContent.length)

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        success: false
      }, { status: 500 })
    }

    // Generate FAQ schema using assistant-style approach
    const result = await generateFAQSchema(
      faqContent,
      mainKeyword
    )

    if (result.success) {
      console.log('✅ Assistant schema generated successfully')
      return NextResponse.json({
        schema: result.schema,
        success: true,
        model: result.model
      })
    } else {
      console.error('❌ Assistant schema generation failed:', result.error)
      return NextResponse.json({
        error: result.error || 'Failed to generate schema',
        success: false
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in assistant schema generation:', error)
    return NextResponse.json({
      error: 'Failed to generate schema with assistant',
      success: false
    }, { status: 500 })
  }
}

export const POST = withSecureContentValidation(handler, assistantSchemaSchema) 