import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { withSecureContentValidation } from '@/lib/security-wrapper'
import { contentGenerationSchema } from '@/lib/validation-schemas'

// ⚠️ CRITICAL RULE: NEVER ADD PRE-WRITTEN CONTENT OR SUGGESTIONS
// AI must decide what to write about keywords - no hardcoded content allowed
// This rule applies to ALL content generation functions in this codebase

async function handler(request: NextRequest, validatedData: any): Promise<NextResponse> {
  try {
    console.log('Received validated data:', validatedData)
    const { keywords, mainKeyword, customPrompt } = validatedData // Use validated and sanitized data
    
    console.log('🔍 DEBUG: mainKeyword =', mainKeyword)
    console.log('🔍 DEBUG: keywords =', keywords)
    console.log('🔍 DEBUG: all keywords =', keywords.map((k: any) => k.keyword).join(', '))

    // Get all keywords to generate content for
    const allKeywords = keywords.map((k: any) => k.keyword)
    console.log('🔍 DEBUG: allKeywords =', allKeywords)

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, generating simple content')
      
      // Generate simple content without AI - just provide structure for all keywords
      // ⚠️ REMEMBER: No pre-written content - only structure and placeholders
      let simpleContent = ''
      
      for (const keyword of keywords) {
        const capitalizedKeyword = keyword.keyword
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
        
        simpleContent += `<div class="row mb-4">
          <div class="col-lg-4 mb-4">
              <!-- Image will be added by user later -->
          </div>
          <div class="col-lg-8 mb-4">
              <h2 class="h2-body-content">${capitalizedKeyword}</h2>
              <p class="p-body-content">[AI will generate content about ${keyword.keyword}]</p>
          </div>
      </div>`
      }
      
      return NextResponse.json({ 
        content: simpleContent,
        success: true,
        message: 'Generated simple content (OpenAI API key not configured)'
      })
    }

    // Try to use OpenAI API
    // ⚠️ CRITICAL: Only provide structure to AI - let AI decide content
    try {
      let promptContent = `Create a unique article about ${mainKeyword} using these H2 keywords: ${allKeywords.join(', ')}. 

Treat this as ONE unique article with multiple sections. Each H2 keyword should have its own distinct content section. Use each keyword exactly as provided as an h2 heading with the class "h2-body-content". 

Create content sections using Bootstrap grid structure for each keyword:

${keywords.map((keyword: any) => {
  const capitalizedKeyword = keyword.keyword.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
  return `<div class="row mb-4">
  <div class="col-lg-4 mb-4">
      <!-- Image will be added by user later -->
  </div>
  <div class="col-lg-8 mb-4">
      <h2 class="h2-body-content">${capitalizedKeyword}</h2>
      <p class="p-body-content">[Generate comprehensive, informative content about ${keyword.keyword}]</p>
  </div>
</div>`
}).join('\n\n')}

Generate detailed, informative content for each keyword using <p class="p-body-content"> tags. Make each section unique and valuable, even if the keywords are similar. Focus on providing comprehensive information about each specific keyword.`

      // Add custom prompt if provided
      if (customPrompt && customPrompt.trim()) {
        promptContent += `\n\nIMPORTANT: ${customPrompt}`
        console.log('🔍 DEBUG: Custom prompt added:', customPrompt)
      }

      console.log('🔍 DEBUG: OpenAI prompt =', promptContent)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: promptContent
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })

      const aiContent = completion.choices[0]?.message?.content || ''
      
      if (aiContent) {
        console.log('Generated content with OpenAI:', aiContent.substring(0, 200) + '...')
        return NextResponse.json({ 
          content: aiContent.trim(),
          success: true 
        })
      }
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError)
      return NextResponse.json(
        { error: 'Failed to generate content with AI. Please check your OpenAI API key and try again.' }, 
        { status: 500 }
      )
    }

    // Fallback response if no content was generated
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' }, 
      { status: 500 }
    )

  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content. Please check your OpenAI API key.' }, 
      { status: 500 }
    )
  }
} 

export const POST = withSecureContentValidation(handler, contentGenerationSchema) 