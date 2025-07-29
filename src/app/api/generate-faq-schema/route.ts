import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { faq, mainKeyword } = await request.json()

    if (!faq) {
      return NextResponse.json({ error: 'FAQ content is required' }, { status: 400 })
    }

    console.log('Generating FAQ schema for content length:', faq.length)
    console.log('FAQ content preview:', faq.substring(0, 200) + '...')

    // Parse FAQ content to extract questions and answers
    const faqItems = parseFaqContent(faq)
    console.log('Parsed FAQ items:', faqItems.length)
    console.log('FAQ items preview:', faqItems.slice(0, 2))
    
    // Generate FAQ schema markup
    const schema = generateFaqSchema(faqItems, mainKeyword)

    console.log('Generated FAQ schema preview:', schema.substring(0, 500) + '...')
    
    return NextResponse.json({ 
      schema: schema.trim(),
      success: true 
    })

  } catch (error) {
    console.error('Error generating FAQ schema:', error)
    return NextResponse.json(
      { error: 'Failed to generate FAQ schema' }, 
      { status: 500 }
    )
  }
}

// Helper function to parse FAQ content
function parseFaqContent(faqContent: string): Array<{question: string, answer: string}> {
  const items = []
  
  // Skip the title and hr line
  const contentWithoutHeader = faqContent.replace(/<h2 class="h2-faq-title">.*?<\/h2>/, '')
    .replace(/<hr class="mb-5">/, '')
  
  // Find all FAQ question-answer pairs using regex
  const faqPattern = /<h2 class="h2-faq">(.*?)<\/h2>\s*<p>(.*?)<\/p>/g
  let match
  
  while ((match = faqPattern.exec(contentWithoutHeader)) !== null) {
    const question = match[1].trim()
    const answer = match[2].trim()
    
    if (question && answer) {
      items.push({
        question: question,
        answer: answer
      })
    }
  }
  
  return items
}

// Helper function to generate FAQ schema
function generateFaqSchema(faqItems: Array<{question: string, answer: string}>, mainKeyword: string): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  }

  return JSON.stringify(schema, null, 2)
} 