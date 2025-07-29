import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Function calling tools for content generation
export const contentGenerationTools = [
  {
    type: "function" as const,
    function: {
      name: "get_business_data",
      description: "Get real business data for content generation",
      parameters: {
        type: "object",
        properties: {
          business_type: {
            type: "string",
            description: "Type of business (e.g., nail salon, restaurant, spa)"
          },
          location: {
            type: "string", 
            description: "Location (e.g., downtown Toronto, New York)"
          },
          count: {
            type: "number",
            description: "Number of businesses to get (default 10)"
          }
        },
        required: ["business_type", "location"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_product_data",
      description: "Get real product information for content generation",
      parameters: {
        type: "object",
        properties: {
          product_category: {
            type: "string",
            description: "Product category (e.g., amethyst, kitchen knives, electronics)"
          },
          features: {
            type: "string",
            description: "Specific features to focus on"
          },
          count: {
            type: "number",
            description: "Number of products to get (default 5)"
          }
        },
        required: ["product_category"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_service_data",
      description: "Get real service information for content generation",
      parameters: {
        type: "object",
        properties: {
          service_type: {
            type: "string",
            description: "Type of service (e.g., SEO, web design, consulting)"
          },
          location: {
            type: "string",
            description: "Location for local services"
          },
          features: {
            type: "string",
            description: "Specific service features to focus on"
          }
        },
        required: ["service_type"]
      }
    }
  }
]

// Function implementations
export async function getBusinessData(businessType: string, location: string, count: number = 10) {
  // Simulate real business data - in production, this would call a real API
  const businesses = []
  
  for (let i = 1; i <= count; i++) {
    businesses.push({
      name: `${businessType.charAt(0).toUpperCase() + businessType.slice(1)} ${i}`,
      address: `${Math.floor(Math.random() * 999) + 1} ${location} Street`,
      phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      rating: (Math.random() * 2 + 3).toFixed(1),
      services: [`${businessType} service 1`, `${businessType} service 2`, `${businessType} service 3`],
      description: `Professional ${businessType} services in ${location}. High quality and customer satisfaction.`
    })
  }
  
  return {
    businesses,
    location,
    businessType,
    totalCount: businesses.length
  }
}

export async function getProductData(productCategory: string, features: string = "", count: number = 5) {
  // Simulate real product data
  const products = []
  
  for (let i = 1; i <= count; i++) {
    products.push({
      name: `${productCategory.charAt(0).toUpperCase() + productCategory.slice(1)} Product ${i}`,
      price: `$${(Math.random() * 200 + 20).toFixed(2)}`,
      rating: (Math.random() * 2 + 3).toFixed(1),
      features: features ? [features, `Feature ${i}`, `Feature ${i + 1}`] : [`Feature ${i}`, `Feature ${i + 1}`, `Feature ${i + 2}`],
      description: `High-quality ${productCategory} product with excellent features and durability.`
    })
  }
  
  return {
    products,
    category: productCategory,
    totalCount: products.length
  }
}

export async function getServiceData(serviceType: string, location: string = "", features: string = "") {
  // Simulate real service data
  const services = [
    {
      name: `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Service 1`,
      description: `Professional ${serviceType} services with expert team.`,
      price: `$${(Math.random() * 500 + 100).toFixed(2)}`,
      rating: (Math.random() * 2 + 3).toFixed(1),
      features: features ? [features, "Expert team", "Quality guarantee"] : ["Expert team", "Quality guarantee", "24/7 support"]
    },
    {
      name: `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Service 2`,
      description: `Premium ${serviceType} solutions for your needs.`,
      price: `$${(Math.random() * 800 + 200).toFixed(2)}`,
      rating: (Math.random() * 2 + 3).toFixed(1),
      features: features ? [features, "Premium quality", "Fast delivery"] : ["Premium quality", "Fast delivery", "Custom solutions"]
    }
  ]
  
  return {
    services,
    serviceType,
    location,
    totalCount: services.length
  }
}

// Content generation with function calling
export async function generateContentWithFunctionCalling(
  mainTopic: string,
  h2Keywords: string[],
  customInstructions: string[],
  contentType: string = 'comprehensive guide'
) {
  try {
    const prompt = `You are a content writer. Generate detailed content for each H2 keyword using real data.

MAIN TOPIC: ${mainTopic}
H2 KEYWORDS: ${h2Keywords.join(', ')}

CUSTOM INSTRUCTIONS:
${customInstructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

Use the available functions to get real data for your content. Then format the response as HTML with this exact structure:

<div class="row mb-4">
  <div class="col-lg-4 mb-4">
    <!-- Image will be added by user later -->
  </div>
  <div class="col-lg-8 mb-4">
    <h2 class="h2-body-content">[H2 KEYWORD]</h2>
    <p class="p-body-content">[DETAILED CONTENT USING REAL DATA]</p>
  </div>
</div>

Focus on the main topic: ${mainTopic}. Use real data from the functions to create specific, helpful content.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      tools: contentGenerationTools,
      tool_choice: "auto",
      max_tokens: 8000,
      temperature: 0.7
    })

    const response = completion.choices[0]
    const content = response.message.content || ''
    const toolCalls = response.message.tool_calls || []
    
    // Handle function calls
    if (toolCalls.length > 0) {
      const availableFunctions = {
        get_business_data: getBusinessData,
        get_product_data: getProductData,
        get_service_data: getServiceData
      }
      
             const messages: any[] = [
         {
           role: "user",
           content: prompt
         },
         response.message
       ]
      
             // Execute function calls
       for (const toolCall of toolCalls) {
         const functionName = toolCall.function.name
         const functionArgs = JSON.parse(toolCall.function.arguments)
         
         if (availableFunctions[functionName as keyof typeof availableFunctions]) {
           const functionResult = await availableFunctions[functionName as keyof typeof availableFunctions](
             functionArgs.business_type || functionArgs.product_category || functionArgs.service_type,
             functionArgs.location || "",
             functionArgs.count || functionArgs.features || 10
           )
           
           messages.push({
             role: "tool" as const,
             tool_call_id: toolCall.id,
             content: JSON.stringify(functionResult)
           })
         }
       }
      
      // Get final response with function results
      const finalCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages,
        max_tokens: 8000,
        temperature: 0.7
      })
      
      return {
        success: true,
        content: finalCompletion.choices[0].message.content || '',
        model: "gpt-4-turbo-preview",
        functionCalls: toolCalls.length
      }
    }
    
    return {
      success: true,
      content: content,
      model: "gpt-4-turbo-preview",
      functionCalls: 0
    }
  } catch (error) {
    console.error('❌ Error generating content with function calling:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

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

    const prompt = `Generate content for the keyword "${keyword}" with handle "${handle}".
  ${customHeadings}
  Return a JSON object with the following structure:
  {
    "metaTitle": "Compelling title under 60 characters",
    "metaDescription": "Engaging description under 160 characters",
    "h1Heading": "Main heading that includes the keyword naturally",
    "h2Headings": ${h2Headings ? JSON.stringify(h2Headings) : '["H2 heading 1", "H2 heading 2", "H2 heading 3"]'},
    "h3Headings": ${h3Headings ? JSON.stringify(h3Headings) : '["H3 heading 1", "H3 heading 2"]'},
    "bodyContent": "Comprehensive main content with natural keyword usage, structured in paragraphs. Include the keyword naturally throughout the content.",
    "internalLinks": [{"text": "link text", "url": "/internal-page"}],
    "externalLinks": [{"text": "link text", "url": "https://external.com"}],
    "faqSchema": {"questions": [{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}]},
    "imageAltText": "Descriptive alt text for relevant image"
  }`

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
} 