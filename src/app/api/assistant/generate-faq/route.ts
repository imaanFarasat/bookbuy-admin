import { NextRequest, NextResponse } from 'next/server'
import { generateFAQFromContent } from '@/lib/openai'
import { withSecureContentValidation } from '@/lib/security-wrapper'
import { z } from 'zod'

const assistantFAQSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  mainKeyword: z.string().min(1, 'Main keyword is required'),
  questionCount: z.number().min(1).max(50).optional().default(20)
})

async function handler(request: NextRequest, validatedData: any): Promise<NextResponse> {
  try {
    const { content, mainKeyword, questionCount = 20 } = validatedData

    console.log('🤖 Assistant FAQ Generation Request:')
    console.log('Main Keyword:', mainKeyword)
    console.log('Content Length:', content.length)
    console.log('Question Count:', questionCount)

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        success: false
      }, { status: 500 })
    }

    // Generate FAQ using assistant-style approach
    const result = await generateFAQFromContent(
      content,
      mainKeyword,
      questionCount
    )

    if (result.success) {
      console.log('✅ Assistant FAQ generated successfully')
      return NextResponse.json({
        faqContent: result.faqContent,
        success: true,
        model: result.model
      })
    } else {
      console.error('❌ Assistant FAQ generation failed:', result.error)
      return NextResponse.json({
        error: result.error || 'Failed to generate FAQ',
        success: false
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in assistant FAQ generation:', error)
    return NextResponse.json({
      error: 'Failed to generate FAQ with assistant',
      success: false
    }, { status: 500 })
  }
}

export const POST = withSecureContentValidation(handler, assistantFAQSchema) 