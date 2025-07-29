import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'


async function handler(request: NextRequest) {
  try {
    const { content, mainKeyword, faq } = await request.json()

    if (!mainKeyword) {
      return NextResponse.json({ error: 'Main keyword is required' }, { status: 400 })
    }

    console.log('Generating meta fields for keyword:', mainKeyword)
    console.log('Content length:', content?.length || 0)
    console.log('FAQ length:', faq?.length || 0)

    try {
      // Try to use OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a content expert specializing in SEO meta titles and descriptions. Generate compelling meta tags based on the content type and main keyword.

CRITICAL REQUIREMENTS - STRICTLY ENFORCE THESE LIMITS:
- Meta Title: MAXIMUM 60 CHARACTERS (including spaces)
- Meta Description: MAXIMUM 160 CHARACTERS (including spaces)

CONTENT TYPE DETECTION:
- LOCAL_BUSINESS: Focus on location, services, and local benefits
- PRODUCT_REVIEW: Focus on reviews, comparisons, and recommendations  
- HOW_TO_GUIDE: Focus on instructions, tips, and learning
- SERVICE_GUIDE: Focus on professional services and expertise
- GENERAL_INFORMATIVE: Focus on comprehensive information and insights

IMPORTANT RULES:
1. ALWAYS include the main keyword in both meta title and meta description
2. NEVER exceed the character limits
3. Count every character including spaces and punctuation
4. Make the meta tags engaging and click-worthy
5. Adapt tone to the content type
6. Analyze the provided content and FAQ to understand the page topic

Return only a JSON object with "metaTitle" and "metaDescription" fields.`
          },
          {
            role: "user",
            content: `Generate the best meta title and meta description for this webpage.

CRITICAL: STRICTLY ENFORCE CHARACTER LIMITS
- Meta Title: MAX 60 CHARACTERS
- Meta Description: MAX 160 CHARACTERS

Main keyword to include: ${mainKeyword}

Main content:
${content || 'Content not provided'}

FAQ section:
${faq || 'FAQ not provided'}

Remember: Count every character including spaces. Never exceed the limits.`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })

      const response = completion.choices[0]?.message?.content
      
      if (response) {
        try {
          const metaData = JSON.parse(response)
          
          // Validate and truncate if necessary
          let metaTitle = metaData.metaTitle || generateFallbackMetaTitle(mainKeyword)
          let metaDescription = metaData.metaDescription || generateFallbackMetaDescription(mainKeyword)
          
          // Enforce character limits
          if (metaTitle.length > 60) {
            console.log(`Meta title too long (${metaTitle.length} chars), truncating to 60`)
            metaTitle = metaTitle.substring(0, 57) + '...'
          }
          
          if (metaDescription.length > 160) {
            console.log(`Meta description too long (${metaDescription.length} chars), truncating to 160`)
            metaDescription = metaDescription.substring(0, 157) + '...'
          }
          
          console.log(`Final meta title: ${metaTitle.length} characters`)
          console.log(`Final meta description: ${metaDescription.length} characters`)
          
          return NextResponse.json({
            metaTitle: metaTitle,
            metaDescription: metaDescription,
            success: true
          })
        } catch (parseError) {
          console.error('Error parsing OpenAI response:', parseError)
          return NextResponse.json({
            metaTitle: generateFallbackMetaTitle(mainKeyword),
            metaDescription: generateFallbackMetaDescription(mainKeyword),
            success: true
          })
        }
      }
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError)
      // Fallback to generated content
    }

    // Fallback content
    return NextResponse.json({
      metaTitle: generateFallbackMetaTitle(mainKeyword),
      metaDescription: generateFallbackMetaDescription(mainKeyword),
      success: true
    })

  } catch (error) {
    console.error('Error generating meta fields:', error)
    return NextResponse.json(
      { error: 'Failed to generate meta fields' }, 
      { status: 500 }
    )
  }
}

import { withSimpleRateLimit, openAILimiter } from '@/lib/rate-limiter-simple'

export const POST = withSimpleRateLimit(handler, openAILimiter)

function generateFallbackMetaTitle(mainKeyword: string): string {
  // Detect content type from keyword
  const detectContentType = (keyword: string) => {
    const lowerKeyword = keyword.toLowerCase()
    if (lowerKeyword.includes('near me') || lowerKeyword.includes('in ') || lowerKeyword.includes('near ')) {
      return 'LOCAL_BUSINESS'
    } else if (lowerKeyword.includes('review') || lowerKeyword.includes('best ') || lowerKeyword.includes('top ')) {
      return 'PRODUCT_REVIEW'
    } else if (lowerKeyword.includes('guide') || lowerKeyword.includes('how to') || lowerKeyword.includes('tips')) {
      return 'HOW_TO_GUIDE'
    } else if (lowerKeyword.includes('service') || lowerKeyword.includes('professional')) {
      return 'SERVICE_GUIDE'
    } else {
      return 'GENERAL_INFORMATIVE'
    }
  }

  const contentType = detectContentType(mainKeyword)
  const cleanKeyword = mainKeyword.trim()
  
  // Generate titles based on content type
  const getTitlesByType = (type: string, keyword: string) => {
    switch (type) {
      case 'LOCAL_BUSINESS':
        return [
          `${keyword} Near Me - Local Services`,
          `Best ${keyword} - Local & Nearby`,
          `Find ${keyword} - Local Services`,
          `${keyword} - Local Professional Services`,
          `Top ${keyword} - Local Options`
        ]
      case 'PRODUCT_REVIEW':
        return [
          `${keyword} - Expert Review & Guide`,
          `Best ${keyword} - Complete Review`,
          `${keyword} Review - Expert Analysis`,
          `Top ${keyword} - Expert Recommendations`,
          `${keyword} - Comprehensive Review`
        ]
      case 'HOW_TO_GUIDE':
        return [
          `${keyword} - Complete Guide & Tips`,
          `How to ${keyword} - Expert Guide`,
          `${keyword} Guide - Step-by-Step`,
          `${keyword} - Professional Guide`,
          `${keyword} - Expert Tips & Guide`
        ]
      case 'SERVICE_GUIDE':
        return [
          `${keyword} - Professional Services`,
          `${keyword} Services - Expert Guide`,
          `${keyword} - Professional Solutions`,
          `${keyword} - Expert Service Guide`,
          `${keyword} - Professional Expertise`
        ]
      default:
        return [
          `${keyword} - Complete Guide & Expert Tips`,
          `${keyword} Guide - Professional Insights`,
          `${keyword} - Expert Recommendations`,
          `${keyword} - Comprehensive Overview`,
          `${keyword} - Professional Guide & Tips`
        ]
    }
  }
  
  const titles = getTitlesByType(contentType, cleanKeyword)
  let title = titles[Math.floor(Math.random() * titles.length)]
  
  // Ensure it doesn't exceed 60 characters
  if (title.length > 60) {
    title = title.substring(0, 57) + '...'
  }
  
  return title
}

function generateFallbackMetaDescription(mainKeyword: string): string {
  // Detect content type from keyword
  const detectContentType = (keyword: string) => {
    const lowerKeyword = keyword.toLowerCase()
    if (lowerKeyword.includes('near me') || lowerKeyword.includes('in ') || lowerKeyword.includes('near ')) {
      return 'LOCAL_BUSINESS'
    } else if (lowerKeyword.includes('review') || lowerKeyword.includes('best ') || lowerKeyword.includes('top ')) {
      return 'PRODUCT_REVIEW'
    } else if (lowerKeyword.includes('guide') || lowerKeyword.includes('how to') || lowerKeyword.includes('tips')) {
      return 'HOW_TO_GUIDE'
    } else if (lowerKeyword.includes('service') || lowerKeyword.includes('professional')) {
      return 'SERVICE_GUIDE'
    } else {
      return 'GENERAL_INFORMATIVE'
    }
  }

  const contentType = detectContentType(mainKeyword)
  const cleanKeyword = mainKeyword.trim()
  
  // Generate descriptions based on content type
  const getDescriptionsByType = (type: string, keyword: string) => {
    switch (type) {
      case 'LOCAL_BUSINESS':
        return [
          `Find the best ${keyword} near you. Local services, convenient locations, and expert quality. Book your appointment today.`,
          `Discover top-rated ${keyword} in your area. Local professionals, convenient scheduling, and excellent service.`,
          `Find local ${keyword} services near you. Expert professionals, convenient locations, and quality service.`,
          `Best ${keyword} near me - local services with expert quality and convenient scheduling.`,
          `Find and book ${keyword} services in your area. Local professionals, quality service, and convenient locations.`
        ]
      case 'PRODUCT_REVIEW':
        return [
          `Expert review of ${keyword} with detailed analysis, pros and cons, and recommendations. Make informed decisions.`,
          `Comprehensive ${keyword} review with expert insights, comparisons, and buying recommendations.`,
          `Detailed ${keyword} analysis with expert opinions, features, and professional recommendations.`,
          `Best ${keyword} review with expert evaluation, comparisons, and buying guide.`,
          `Complete ${keyword} review with expert analysis, recommendations, and detailed insights.`
        ]
      case 'HOW_TO_GUIDE':
        return [
          `Complete guide to ${keyword} with step-by-step instructions, expert tips, and professional advice.`,
          `Learn how to ${keyword} with expert guidance, practical tips, and comprehensive instructions.`,
          `Professional ${keyword} guide with detailed steps, expert tips, and practical advice.`,
          `Expert ${keyword} tutorial with step-by-step instructions and professional insights.`,
          `Comprehensive ${keyword} guide with expert tips, detailed instructions, and professional advice.`
        ]
      case 'SERVICE_GUIDE':
        return [
          `Professional ${keyword} services with expert guidance, quality assurance, and comprehensive solutions.`,
          `Expert ${keyword} services with professional expertise, quality results, and comprehensive support.`,
          `Professional ${keyword} guide with expert insights, quality service, and comprehensive solutions.`,
          `${keyword} services with professional expertise, quality assurance, and expert guidance.`,
          `Expert ${keyword} solutions with professional service, quality results, and comprehensive support.`
        ]
      default:
        return [
          `Comprehensive guide to ${keyword} with expert insights, practical tips, and professional recommendations.`,
          `Expert ${keyword} guide with detailed information, best practices, and professional advice.`,
          `Complete ${keyword} overview with expert tips, recommendations, and comprehensive insights.`,
          `Professional ${keyword} guide with expert advice, practical tips, and detailed information.`,
          `In-depth ${keyword} guide with expert insights, recommendations, and professional tips.`
        ]
    }
  }
  
  const descriptions = getDescriptionsByType(contentType, cleanKeyword)
  let description = descriptions[Math.floor(Math.random() * descriptions.length)]
  
  // Ensure it doesn't exceed 160 characters
  if (description.length > 160) {
    description = description.substring(0, 157) + '...'
  }
  
  return description
} 