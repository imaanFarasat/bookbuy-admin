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
    console.log('🔍 DEBUG: === INCOMING REQUEST DATA ===')
    console.log('Keywords:', JSON.stringify(validatedData.keywords, null, 2))
    console.log('Main Keyword:', validatedData.mainKeyword)
    console.log('Custom Prompt:', validatedData.customPrompt)
    console.log('🔍 DEBUG: === END OF REQUEST DATA ===')
    
    const { keywords, mainKeyword, customPrompt } = validatedData // Use validated and sanitized data
    
    console.log('🔍 DEBUG: mainKeyword =', mainKeyword)
    console.log('🔍 DEBUG: keywords =', keywords)
    console.log('🔍 DEBUG: all keywords =', keywords.map((k: any) => k.keyword).join(', '))

    // Get all keywords to generate content for
    const allKeywords = keywords.map((k: any) => k.keyword)
    console.log('🔍 DEBUG: allKeywords =', allKeywords)

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('🔍 DEBUG: FALLBACK TRIGGERED - OpenAI API key not configured')
      
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

    // Check if OpenAI API key is missing or empty
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
      console.log('🔍 DEBUG: FALLBACK TRIGGERED - OpenAI API key is missing or empty')
      console.log('🔍 DEBUG: API Key exists:', !!process.env.OPENAI_API_KEY)
      console.log('🔍 DEBUG: API Key length:', process.env.OPENAI_API_KEY?.length || 0)
      return NextResponse.json({ 
        content: `<div class="row mb-4">
          <div class="col-lg-4 mb-4">
              <!-- Image will be added by user later -->
          </div>
          <div class="col-lg-8 mb-4">
              <h2 class="h2-body-content">${keywords[0]?.keyword.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}</h2>
              <p class="p-body-content">[AI will generate content about ${keywords[0]?.keyword}]</p>
          </div>
      </div>`,
        success: true,
        message: 'Generated simple content (OpenAI API key is missing or empty)'
      })
    }

    // Try to use OpenAI API
    // ⚠️ CRITICAL: Only provide structure to AI - let AI decide content
    try {
      // Build clean natural language prompt
      const specificInstructions = keywords.filter((k: any) => k.customPrompt).map((keyword: any, index: number) => 
  `(${index + 1}) Keyword: "${keyword.keyword}"\nInstruction: ${keyword.customPrompt}`
).join('\n\n')

      // Create a comprehensive prompt that includes all keywords
      const allKeywordsList = keywords.map((k: any, index: number) => 
        `${index + 1}. ${k.keyword}`
      ).join('\n')

      // Detect content type based on keywords and main keyword
      const detectContentType = (mainKeyword: string, keywords: any[]) => {
        const allText = (mainKeyword + ' ' + keywords.map(k => k.keyword).join(' ')).toLowerCase()
        
        if (allText.includes('near me') || allText.includes('in ') || allText.includes('near ')) {
          return 'LOCAL_BUSINESS'
        } else if (allText.includes('review') || allText.includes('best ') || allText.includes('top ')) {
          return 'PRODUCT_REVIEW'
        } else if (allText.includes('guide') || allText.includes('how to') || allText.includes('tips')) {
          return 'HOW_TO_GUIDE'
        } else if (allText.includes('service') || allText.includes('professional')) {
          return 'SERVICE_GUIDE'
        } else {
          return 'GENERAL_INFORMATIVE'
        }
      }

      const contentType = detectContentType(mainKeyword, keywords)
      
      // Create content type specific instructions
      const getContentTypeInstructions = (type: string) => {
        switch (type) {
          case 'LOCAL_BUSINESS':
            return `Focus on local business information, services, locations, and customer benefits. Include practical details about what customers can expect.`
          case 'PRODUCT_REVIEW':
            return `Provide detailed product analysis, features, pros and cons, and recommendations. Include specific details and comparisons.`
          case 'HOW_TO_GUIDE':
            return `Create step-by-step instructions, tips, and practical advice. Make it actionable and easy to follow.`
          case 'SERVICE_GUIDE':
            return `Explain services, benefits, processes, and what to expect. Include professional insights and industry knowledge.`
          default:
            return `Provide comprehensive, informative content with practical insights and valuable information.`
        }
      }

      let promptContent = `You are a professional content writer specializing in creating detailed, informative content for web pages. 

MAIN TOPIC: ${mainKeyword}
CONTENT TYPE: ${contentType}
CONTENT FOCUS: ${getContentTypeInstructions(contentType)}

H2 KEYWORDS TO WRITE ABOUT:
${allKeywordsList}

${specificInstructions ? `SPECIFIC INSTRUCTIONS:
${specificInstructions}

` : ''}Write detailed, specific content for each keyword in the same order. Do not skip any. Focus on the actual topic and write real, helpful content - not generic placeholders.

IMPORTANT REQUIREMENTS:
- Write about each keyword specifically and in detail
- Make content informative and valuable for readers
- Use natural, engaging language that flows well
- Include practical information, tips, and insights
- Keep each section focused on its keyword
- Provide specific details and actionable advice
- Adapt tone and style to the content type (${contentType})
- Each paragraph should be substantial (150-300 words)
- Write in a professional but accessible tone

Respond with only the content paragraphs, one per line, in the same order as the keywords.`



      // Log individual prompts
      keywords.forEach((keyword: any, index: number) => {
        if (keyword.customPrompt) {
          console.log(`🔍 DEBUG: Individual prompt for "${keyword.keyword}": ${keyword.customPrompt}`)
        }
      })

      console.log('🔍 DEBUG: Keywords being processed:', allKeywords)
      console.log('🔍 DEBUG: Number of keywords:', allKeywords.length)
      console.log('🔍 DEBUG: Custom prompt provided:', customPrompt)
      console.log('🔍 DEBUG: Individual prompts found:', keywords.filter((k: any) => k.customPrompt).map((k: any) => `${k.keyword}: ${k.customPrompt}`))
      console.log('🔍 DEBUG: Full OpenAI prompt =', promptContent)
      console.log('🔍 DEBUG: === FULL PROMPT BEING SENT TO OPENAI ===')
      console.log(promptContent)
      console.log('🔍 DEBUG: === END OF PROMPT ===')
      console.log('🔍 DEBUG: About to call OpenAI API...')
      console.log('🔍 DEBUG: OpenAI API key configured:', !!process.env.OPENAI_API_KEY)
      console.log('🔍 DEBUG: OpenAI API key length:', process.env.OPENAI_API_KEY?.length || 0)
      console.log('🔍 DEBUG: OpenAI API key starts with sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-') || false)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a professional content writer specializing in creating detailed, informative content for web pages. Your task is to write specific content for each H2 keyword provided. 

IMPORTANT REQUIREMENTS:
- Write detailed, informative content for each keyword
- Focus on providing value and practical information
- Use natural, engaging language
- Include specific details, tips, and insights
- Make content helpful for readers searching for this information
- Avoid generic or placeholder content
- Each paragraph should be substantial (150-300 words)
- Write in a professional but accessible tone`
          },
          {
            role: "user",
            content: promptContent
          }
        ],
        max_tokens: 6000,
        temperature: 0.7
      })

      const aiContent = completion.choices[0]?.message?.content || ''
      
      console.log('🔍 DEBUG: OpenAI response received:', aiContent.substring(0, 500) + '...')
      
      if (aiContent) {
        console.log('Generated content with OpenAI:', aiContent.substring(0, 200) + '...')
        
        // Parse the response into paragraphs
        const paragraphs = aiContent.trim().split('\n').filter(p => p.trim())
        
        // Build HTML with the generated content
        const htmlContent = keywords.map((keyword: any, index: number) => {
          const capitalizedKeyword = keyword.keyword.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
          const paragraph = paragraphs[index] || `Content about ${keyword.keyword}`
          
          return `<div class="row mb-4">
  <div class="col-lg-4 mb-4">
      <!-- Image will be added by user later -->
  </div>
  <div class="col-lg-8 mb-4">
      <h2 class="h2-body-content">${capitalizedKeyword}</h2>
      <p class="p-body-content">${paragraph}</p>
  </div>
</div>`
        }).join('\n\n')
        
        return NextResponse.json({ 
          content: htmlContent,
          success: true 
        })
      } else {
        console.error('No content generated from OpenAI')
        return NextResponse.json(
          { error: 'No content was generated. Please try again.' }, 
          { status: 500 }
        )
      }
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)
      console.error('Error details:', openaiError.message)
      
      // Check if it's an API key issue
      if (openaiError.message?.includes('401') || openaiError.message?.includes('authentication')) {
        return NextResponse.json(
          { error: 'OpenAI API key is invalid or missing. Please check your configuration.' }, 
          { status: 500 }
        )
      }
      
      // Check if it's a rate limit issue
      if (openaiError.message?.includes('rate limit') || openaiError.message?.includes('429')) {
        return NextResponse.json(
          { error: 'OpenAI rate limit exceeded. Please try again in a few minutes.' }, 
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to generate content with AI: ${openaiError.message || 'Unknown error'}` }, 
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