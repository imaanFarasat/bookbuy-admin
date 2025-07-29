import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { withSecureContentValidation } from '@/lib/security-wrapper'
import { faqGenerationSchema } from '@/lib/validation-schemas'
import { detectContentType, getContentTypeInstructions } from '@/lib/openai'

async function handler(request: NextRequest, validatedData: any): Promise<NextResponse> {
  try {
    const { content, mainKeyword } = validatedData // Use validated and sanitized data

    console.log('Generating FAQ for content length:', content.length)

    // Detect content type for better FAQ generation
    const contentType = detectContentType(mainKeyword)
    const contentTypeInstructions = getContentTypeInstructions(contentType)

    // Try to use OpenAI API first
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert content writer specializing in FAQ generation. Generate exactly 2 FAQ questions and answers based on the provided content.

CONTENT TYPE: ${contentType}
CONTENT FOCUS: ${contentTypeInstructions}

FAQ REQUIREMENTS:
- Generate questions that are relevant to the content type
- Provide detailed, helpful answers
- Focus on practical information and user concerns
- Make answers informative and actionable
- Adapt tone to the content type (${contentType})

Format the response as HTML with the following structure:

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

    // Fallback: Create simple FAQ based on the main keyword and content type
    const getFallbackFAQ = (mainKeyword: string, contentType: string) => {
      const cleanKeyword = mainKeyword.trim()
      
      const getFAQByType = (type: string, keyword: string) => {
        switch (type) {
          case 'LOCAL_BUSINESS':
            return {
              question1: `What are the best ${keyword} services in my area?`,
              answer1: `The best ${keyword} services in your area offer professional quality, convenient locations, and excellent customer service. Look for businesses with positive reviews, experienced staff, and competitive pricing.`,
              question2: `How do I choose the right ${keyword} provider?`,
              answer2: `Choose a ${keyword} provider by checking their credentials, reading customer reviews, comparing prices, and ensuring they offer the specific services you need. Visit their location or website to learn more.`
            }
          case 'PRODUCT_REVIEW':
            return {
              question1: `What should I look for when buying ${keyword}?`,
              answer1: `When buying ${keyword}, consider quality, features, price, brand reputation, and customer reviews. Compare different options and read detailed reviews to make an informed decision.`,
              question2: `How do I know if ${keyword} is worth the investment?`,
              answer2: `Evaluate ${keyword} based on your specific needs, budget, and long-term value. Read expert reviews, compare alternatives, and consider the return on investment for your particular use case.`
            }
          case 'HOW_TO_GUIDE':
            return {
              question1: `What are the essential steps for ${keyword}?`,
              answer1: `The essential steps for ${keyword} include proper preparation, following expert guidelines, using the right tools and techniques, and maintaining consistency throughout the process.`,
              question2: `How can I improve my ${keyword} skills?`,
              answer2: `Improve your ${keyword} skills by practicing regularly, learning from experts, using quality tools, and staying updated with the latest techniques and best practices in the field.`
            }
          case 'SERVICE_GUIDE':
            return {
              question1: `What professional ${keyword} services are available?`,
              answer1: `Professional ${keyword} services include expert consultation, specialized solutions, quality assurance, and comprehensive support. These services are designed to meet your specific needs and requirements.`,
              question2: `How do I find reliable ${keyword} professionals?`,
              answer2: `Find reliable ${keyword} professionals by checking their credentials, reading client testimonials, verifying their experience, and ensuring they have proper licensing and insurance for their services.`
            }
          default:
            return {
              question1: `What makes ${keyword} important and valuable?`,
              answer1: `${keyword} is important because it provides essential information, practical solutions, and expert insights that help you make informed decisions and achieve better results in your specific area of interest.`,
              question2: `How can I learn more about ${keyword}?`,
              answer2: `Learn more about ${keyword} by researching reliable sources, consulting experts, reading comprehensive guides, and exploring practical applications. This knowledge will help you make better decisions.`
            }
        }
      }
      
      const faq = getFAQByType(contentType, cleanKeyword)
      
      return `
<h2 class="h2-faq-title">Frequently Asked Questions</h2>
<hr class="mb-5">

<div class="row mb-4">
    <div class="col-lg-6 mb-4">
        <h2 class="h2-faq">${faq.question1}</h2>
        <p>${faq.answer1}</p>
    </div>
    <div class="col-lg-6 mb-4">
        <h2 class="h2-faq">${faq.question2}</h2>
        <p>${faq.answer2}</p>
    </div>
</div>`.trim()
    }

    const fallbackFaq = getFallbackFAQ(mainKeyword, contentType)

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