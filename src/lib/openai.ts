import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Content generation with assistant-style prompts
export async function generateContentWithAssistant(
  mainTopic: string,
  h2Keywords: string[],
  customInstructions: string[],
  contentType: string = 'comprehensive guide'
) {
  try {
    // Build assistant-style prompt
    const prompt = `You are a content writer. Generate detailed content for each H2 keyword.

MAIN TOPIC: ${mainTopic}
H2 KEYWORDS: ${h2Keywords.join(', ')}

CUSTOM INSTRUCTIONS:
${customInstructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

Generate detailed content for each H2 keyword. Format the response as HTML with this exact structure:

<div class="row mb-4">
  <div class="col-lg-4 mb-4">
    <!-- Image will be added by user later -->
  </div>
  <div class="col-lg-8 mb-4">
    <h2 class="h2-body-content">[H2 KEYWORD]</h2>
    <p class="p-body-content">[DETAILED CONTENT FOLLOWING CUSTOM INSTRUCTIONS]</p>
  </div>
</div>

Focus on the main topic: ${mainTopic}. Follow the custom instructions exactly. Write specific, helpful content - not generic placeholders.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 8000,
      temperature: 0.7
    })

    const content = completion.choices[0]?.message?.content || ''
    
    return {
      success: true,
      content: content,
      model: "gpt-4-turbo-preview"
    }
  } catch (error) {
    console.error('❌ Error generating content with assistant:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Generate FAQ from content
export async function generateFAQFromContent(
  content: string,
  mainKeyword: string,
  questionCount: number = 20
) {
  try {
    const prompt = `You are an expert content writer. Generate ${questionCount} FAQ questions and answers based on the provided content.

MAIN KEYWORD: ${mainKeyword}
CONTENT: ${content}

Generate ${questionCount} relevant FAQ questions and answers. Format the response as HTML with the following structure:

<div class="faq-section">
  <h2 class="h2-faq mb-4">Frequently Asked Questions</h2>
  <div class="faq-content">
    <h3>[Question 1]</h3>
    <p>[Answer 1]</p>
    
    <h3>[Question 2]</h3>
    <p>[Answer 2]</p>
    
    ... (continue for all ${questionCount} questions)
  </div>
</div>

Focus on the main keyword: ${mainKeyword}. Make questions and answers specific, helpful, and relevant to the content.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 6000,
      temperature: 0.7
    })

    const faqContent = completion.choices[0]?.message?.content || ''
    
    return {
      success: true,
      faqContent: faqContent,
      model: "gpt-4-turbo-preview"
    }
  } catch (error) {
    console.error('❌ Error generating FAQ:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Generate FAQ schema
export async function generateFAQSchema(
  faqContent: string,
  mainKeyword: string
) {
  try {
    const prompt = `Generate JSON-LD schema markup for FAQ content.

MAIN KEYWORD: ${mainKeyword}
FAQ CONTENT: ${faqContent}

Extract questions and answers from the FAQ content and create a JSON-LD schema following this structure:

{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Question text]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Answer text]"
      }
    }
  ]
}

Generate the complete JSON-LD schema with all questions and answers from the FAQ content.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })

    const schemaContent = completion.choices[0]?.message?.content || ''
    
    return {
      success: true,
      schema: schemaContent,
      model: "gpt-4-turbo-preview"
    }
  } catch (error) {
    console.error('❌ Error generating FAQ schema:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function generatePageContent(keyword: string, handle: string, h2Headings?: string[], h3Headings?: string[]) {
  const customHeadings = h2Headings && h3Headings ? `
  Use these specific headings:
  H2 Headings: ${h2Headings.join(', ')}
  H3 Headings: ${h3Headings.join(', ')}
  ` : ''

  const prompt = `Generate SEO-optimized content for the keyword "${keyword}" with handle "${handle}". 
  ${customHeadings}
  Return a JSON object with the following structure:
  {
    "metaTitle": "SEO optimized title under 60 characters",
    "metaDescription": "SEO optimized description under 160 characters",
    "h1Heading": "Main heading that includes the keyword naturally",
    "h2Headings": ${h2Headings ? JSON.stringify(h2Headings) : '["H2 heading 1", "H2 heading 2", "H2 heading 3"]'},
    "h3Headings": ${h3Headings ? JSON.stringify(h3Headings) : '["H3 heading 1", "H3 heading 2"]'},
    "bodyContent": "Comprehensive main content with keyword optimization, structured in paragraphs. Include the keyword naturally throughout the content.",
    "internalLinks": [{"text": "link text", "url": "/internal-page"}],
    "externalLinks": [{"text": "link text", "url": "https://external.com"}],
    "faqSchema": {"questions": [{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}]},
    "imageAltText": "SEO optimized alt text for relevant image"
  }`

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
} 