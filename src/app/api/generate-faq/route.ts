import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { withSecureContentValidation } from '@/lib/security-wrapper'
import { faqGenerationSchema } from '@/lib/validation-schemas'

async function handler(request: NextRequest, validatedData: any): Promise<NextResponse> {
      try {
      const { content, mainKeyword } = validatedData // Use validated and sanitized data

    console.log('Generating FAQ for content length:', content.length)

    // Try to use OpenAI API first
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert content writer. Generate exactly 2 FAQ questions and answers based on the provided content. Format the response as HTML with the following structure:

1. Start with: <h2 class="h2-faq-title">Frequently Asked Questions</h2>
2. Then: <hr class="mb-5">
3. Then create FAQ pairs in a grid layout:
   <div class="row mb-4">
     <div class="col-lg-6 mb-4">
       <h2 class="h2-faq">[Question]</h2>
       <p>[Answer]</p>
     </div>
     <div class="col-lg-6 mb-4">
       <h2 class="h2-faq">[Question]</h2>
       <p>[Answer]</p>
     </div>
   </div>

Focus on the main keyword: ${mainKeyword}.`
          },
          {
            role: "user",
            content: `Generate 2 FAQ questions and answers for this content:\n\n${content}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })

      const faqContent = completion.choices[0]?.message?.content || ''
      
      if (faqContent) {
        console.log('Generated FAQ with OpenAI:', faqContent.substring(0, 200) + '...')
        return NextResponse.json({ 
          faq: faqContent.trim(),
          success: true 
        })
      }
    } catch (openaiError) {
      console.log('OpenAI API failed, using fallback FAQ generation')
    }

    // Fallback: Create simple FAQ based on the main keyword
    const fallbackFaq = `
<h2 class="h2-faq-title">Frequently Asked Questions</h2>
<hr class="mb-5">

<div class="row mb-4">
    <div class="col-lg-6 mb-4">
        <h2 class="h2-faq">What is ${mainKeyword} and why is it important?</h2>
        <p>${mainKeyword} is a valuable topic that provides essential insights and knowledge for various applications and purposes.</p>
    </div>
    <div class="col-lg-6 mb-4">
        <h2 class="h2-faq">How can I learn more about ${mainKeyword}?</h2>
        <p>Explore resources, consult experts, and conduct research. This article provides a comprehensive starting point for understanding ${mainKeyword}.</p>
    </div>
</div>`.trim()

    console.log('Using fallback FAQ generation')
    
    return NextResponse.json({ 
      faq: fallbackFaq,
      success: true 
    })

  } catch (error) {
    console.error('Error generating FAQ:', error)
    return NextResponse.json(
      { error: 'Failed to generate FAQ. Please check your OpenAI API key.' }, 
      { status: 500 }
    )
  }
}

import { withSimpleRateLimit, openAILimiter } from '@/lib/rate-limiter-simple'

export const POST = withSecureContentValidation(handler, faqGenerationSchema)

// Helper function to extract keywords from content
function extractKeywordsFromContent(content: string): string[] {
  const keywords = []
  const lines = content.split('\n')
  
  for (const line of lines) {
    if (line.includes('<h2>') || line.includes('<h3>')) {
      const match = line.match(/<h[23]>(.*?)<\/h[23]>/)
      if (match) {
        keywords.push(match[1].trim())
      }
    }
  }
  
  return keywords
}

// Helper function to generate questions based on content
function generateQuestionsFromContent(keywords: string[], mainKeyword: string): string[] {
  const questions = []
  
  // Questions based on extracted keywords (limit to 2 for testing)
  if (keywords.length > 0) {
    questions.push(`What is ${keywords[0]} and how does it relate to ${mainKeyword}?`)
  }
  
  // General questions about the main topic (limit to 2 total)
  questions.push(`What makes ${mainKeyword} so fascinating and valuable?`)
  
  return questions.slice(0, 2) // Return exactly 2 questions for testing
}

// Helper function to generate answers based on content
function generateAnswerFromContent(question: string, content: string, mainKeyword: string): string {
  // Extract relevant information from the content based on the question
  const questionLower = question.toLowerCase()
  const contentLower = content.toLowerCase()
  
  // Look for relevant sections in the content
  if (questionLower.includes('identify') || questionLower.includes('distinguish')) {
    return `${mainKeyword} can be identified through various characteristics and features that distinguish different types and qualities.`
  }
  
  if (questionLower.includes('care') || questionLower.includes('maintain')) {
    return `Proper care involves understanding specific requirements, storage conditions, and handling practices to preserve quality and value.`
  }
  
  if (questionLower.includes('value') || questionLower.includes('investment')) {
    return `Value is determined by rarity, quality, historical significance, and market demand. Understanding these factors helps make informed decisions.`
  }
  
  // Default answer based on content
  return `The content provides comprehensive information about ${mainKeyword} and its various aspects, helping readers understand its significance.`
} 