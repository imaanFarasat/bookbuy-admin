import { NextRequest, NextResponse } from 'next/server'
import { generateContentWithFunctionCalling } from '@/lib/openai'
import { withSecureContentValidation } from '@/lib/security-wrapper'
import { z } from 'zod'

const assistantContentSchema = z.object({
  mainTopic: z.string().min(1, 'Main topic is required'),
  h2Keywords: z.array(z.string()).min(1, 'At least one H2 keyword is required'),
  customInstructions: z.array(z.string()).optional(),
  contentType: z.string().optional()
})

async function handler(request: NextRequest, validatedData: any): Promise<NextResponse> {
  try {
    const { mainTopic, h2Keywords, customInstructions = [], contentType = 'comprehensive guide' } = validatedData

    console.log('🤖 Assistant Content Generation Request:')
    console.log('Main Topic:', mainTopic)
    console.log('H2 Keywords:', h2Keywords)
    console.log('Custom Instructions:', customInstructions)
    console.log('Content Type:', contentType)

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        success: false
      }, { status: 500 })
    }

    // Generate content using function calling approach
    const result = await generateContentWithFunctionCalling(
      mainTopic,
      h2Keywords,
      customInstructions,
      contentType
    )

    if (result.success) {
      console.log('✅ Assistant content generated successfully')
      return NextResponse.json({
        content: result.content,
        success: true,
        model: result.model
      })
    } else {
      console.error('❌ Assistant content generation failed:', result.error)
      return NextResponse.json({
        error: result.error || 'Failed to generate content',
        success: false
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in assistant content generation:', error)
    return NextResponse.json({
      error: 'Failed to generate content with assistant',
      success: false
    }, { status: 500 })
  }
}

export const POST = withSecureContentValidation(handler, assistantContentSchema) 