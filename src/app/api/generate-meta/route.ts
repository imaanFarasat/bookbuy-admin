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
            content: `You are an SEO expert. Generate a compelling meta title and meta description for a webpage.

CRITICAL REQUIREMENTS - STRICTLY ENFORCE THESE LIMITS:
- Meta Title: MAXIMUM 60 CHARACTERS (including spaces)
- Meta Description: MAXIMUM 160 CHARACTERS (including spaces)

IMPORTANT RULES:
1. ALWAYS include the main keyword in both meta title and meta description
2. NEVER exceed the character limits - this is critical for SEO
3. Count every character including spaces and punctuation
4. Make the meta tags engaging and click-worthy
5. Analyze the provided content and FAQ to understand the page topic

Return only a JSON object with "metaTitle" and "metaDescription" fields.
Example format:
{
  "metaTitle": "Best Nail Salons Near Me - Top Rated Services",
  "metaDescription": "Find the best nail salons near you. Professional manicures, pedicures, and nail art services. Book your appointment today!"
}`
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
  // Check if it's a location-based keyword
  const isLocationBased = mainKeyword.toLowerCase().includes('near me') || 
                         mainKeyword.toLowerCase().includes('in ') || 
                         mainKeyword.toLowerCase().includes('near ')
  
  if (isLocationBased) {
    // Clean the keyword for location-based titles
    const cleanKeyword = mainKeyword
      .replace(/ near me/gi, '')
      .replace(/ in [a-zA-Z\s]+/gi, '')
      .replace(/ near [a-zA-Z\s]+/gi, '')
      .trim()
    
    const locationTitles = [
      `Find Best ${cleanKeyword} Near You - Local Services`,
      `Top ${cleanKeyword} - Local & Nearby Services`,
      `Best Local ${cleanKeyword} - Find & Book Today`,
      `${cleanKeyword} Near Me - Local Services Available`,
      `Find ${cleanKeyword} - Best Local Options`
    ]
    
    let title = locationTitles[Math.floor(Math.random() * locationTitles.length)]
    
    // Ensure it doesn't exceed 60 characters
    if (title.length > 60) {
      title = title.substring(0, 57) + '...'
    }
    
    return title
  } else {
    // Non-location keywords - avoid generic patterns
    const titles = [
      `${mainKeyword} - Expert Guide & Tips`,
      `Best ${mainKeyword} - Complete Overview`,
      `${mainKeyword} Guide - Expert Recommendations`,
      `Professional ${mainKeyword} - Expert Tips`,
      `${mainKeyword} - Complete Guide & Expert Advice`
    ]
    
    let title = titles[Math.floor(Math.random() * titles.length)]
    
    // Ensure it doesn't exceed 60 characters
    if (title.length > 60) {
      title = title.substring(0, 57) + '...'
    }
    
    return title
  }
}

function generateFallbackMetaDescription(mainKeyword: string): string {
  // Check if it's a location-based keyword
  const isLocationBased = mainKeyword.toLowerCase().includes('near me') || 
                         mainKeyword.toLowerCase().includes('in ') || 
                         mainKeyword.toLowerCase().includes('near ')
  
  if (isLocationBased) {
    // Clean the keyword for location-based descriptions
    const cleanKeyword = mainKeyword
      .replace(/ near me/gi, '')
      .replace(/ in [a-zA-Z\s]+/gi, '')
      .replace(/ near [a-zA-Z\s]+/gi, '')
      .trim()
    
    const locationDescriptions = [
      `Find the best ${cleanKeyword} near you. Local services, convenient locations, and expert quality. Book your appointment today.`,
      `Discover top-rated ${cleanKeyword} in your area. Local professionals, convenient scheduling, and excellent service.`,
      `Find local ${cleanKeyword} services near you. Expert professionals, convenient locations, and quality service.`,
      `Best ${cleanKeyword} near me - local services with expert quality and convenient scheduling.`,
      `Find and book ${cleanKeyword} services in your area. Local professionals, quality service, and convenient locations.`
    ]
    
    let description = locationDescriptions[Math.floor(Math.random() * locationDescriptions.length)]
    
    // Ensure it doesn't exceed 160 characters
    if (description.length > 160) {
      description = description.substring(0, 157) + '...'
    }
    
    return description
  } else {
    // Non-location keywords
    const descriptions = [
      `Expert guide to ${mainKeyword} with professional tips, recommendations, and everything you need to know.`,
      `Complete ${mainKeyword} guide with expert advice, tips, and professional recommendations.`,
      `Professional ${mainKeyword} guide with expert insights and comprehensive information.`,
      `Expert ${mainKeyword} advice with tips, recommendations, and professional guidance.`,
      `Complete ${mainKeyword} information with expert tips and professional recommendations.`
    ]
    
    let description = descriptions[Math.floor(Math.random() * descriptions.length)]
    
    // Ensure it doesn't exceed 160 characters
    if (description.length > 160) {
      description = description.substring(0, 157) + '...'
    }
    
    return description
  }
} 