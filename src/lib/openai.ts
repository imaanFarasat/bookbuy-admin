import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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