import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { prompt, mainKeyword } = await request.json()

    if (!prompt || !mainKeyword) {
      return NextResponse.json(
        { error: 'Prompt and mainKeyword are required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Use OpenAI API to generate slogan
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 50,
      temperature: 0.7
    })

    const slogan = completion.choices[0]?.message?.content?.trim() || ''
    
    if (slogan) {
      return NextResponse.json({ 
        slogan: slogan,
        success: true 
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to generate slogan' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error generating slogan:', error)
    return NextResponse.json(
      { error: 'Failed to generate slogan. Please try again.' },
      { status: 500 }
    )
  }
} 