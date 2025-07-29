import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { withSecureValidation } from '@/lib/security-wrapper'
import { keywordAnalysisSchema } from '@/lib/validation-schemas'


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function handler(request: NextRequest, validatedData: any) {
  try {
    const { content } = validatedData

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Parse keywords from the input text
    const lines = content.split('\n').filter((line: string) => line.trim())
    const keywords: any[] = []
    
    // Process each line to find keywords and volumes
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines, single letters, numbers, and time references
      if (!line || 
          line === 'I' || line === 'C' || line === 'T' ||
          /^\d+$/.test(line) || 
          line.includes('Last week') || 
          line.includes('This week') ||
          line.includes('weeks') ||
          line.includes('vol') ||
          /^(yesterday|today|tomorrow|week|month|year)$/i.test(line) ||
          parseFloat(line) > 0 && parseFloat(line) < 150) {
        continue
      }
      
      // Check if this line looks like a keyword (has letters, can be single or multiple words)
      if (line.length > 2 && /[a-zA-Z]/.test(line)) {
        // Clean the keyword (remove special characters)
        const keyword = line.replace(/[^\w\s-]/g, '').trim()
        
        if (keyword.length < 3) continue
        
        // Look for volume in the next few lines
        let volume = 0
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim()
          
          // Skip single letters and small numbers
          if (nextLine === 'I' || nextLine === 'C' || nextLine === 'T' ||
              /^\d+$/.test(nextLine) && parseInt(nextLine) < 150 ||
              nextLine.includes('Last week') || 
              nextLine.includes('This week') ||
              nextLine.includes('weeks') ||
              /^(yesterday|today|tomorrow|week|month|year)$/i.test(nextLine)) {
            continue
          }
          
          // Look for volume pattern (numbers with commas)
          const volumeMatch = nextLine.match(/^(\d{1,3}(?:,\d{3})*)/)
          if (volumeMatch) {
            const vol = parseInt(volumeMatch[1].replace(/,/g, ''))
            if (vol >= 150) {
              volume = vol
              break
            }
          }
        }
        
        // Only add if we found a reasonable volume
        if (volume >= 150) {
          // Simple categorization based on keyword content
          let category = 'General'
          if (keyword.toLowerCase().includes('best') || keyword.toLowerCase().includes('top')) {
            category = 'Reviews'
          } else if (keyword.toLowerCase().includes('how') || keyword.toLowerCase().includes('guide')) {
            category = 'How-to'
          } else if (keyword.toLowerCase().includes('vs') || keyword.toLowerCase().includes('compare')) {
            category = 'Comparison'
          } else if (keyword.toLowerCase().includes('types') || keyword.toLowerCase().includes('kinds')) {
            category = 'Product Types'
          } else if (keyword.toLowerCase().includes('tips') || keyword.toLowerCase().includes('advice')) {
            category = 'Tips'
          } else if (keyword.toLowerCase().includes('maintenance') || keyword.toLowerCase().includes('care')) {
            category = 'Care & Maintenance'
          } else if (keyword.toLowerCase().includes('professional') || keyword.toLowerCase().includes('pro')) {
            category = 'Professional'
          } else if (keyword.toLowerCase().includes('budget') || keyword.toLowerCase().includes('cheap')) {
            category = 'Budget Options'
          } else if (keyword.toLowerCase().includes('safety') || keyword.toLowerCase().includes('safe')) {
            category = 'Safety'
          } else if (keyword.toLowerCase().includes('meaning')) {
            category = 'Definitions'
          } else if (keyword.toLowerCase().includes('ring') || keyword.toLowerCase().includes('jewelry')) {
            category = 'Jewelry'
          } else if (keyword.toLowerCase().includes('stone') || keyword.toLowerCase().includes('crystal')) {
            category = 'Stones & Crystals'
          }
          
          keywords.push({
            keyword,
            volume,
            category
          })
        }
      }
    }

    return NextResponse.json({ keywords })
  } catch (error) {
    console.error('Error processing keywords:', error)
    return NextResponse.json({ error: 'Failed to process keywords' }, { status: 500 })
  }
} 

export const POST = withSecureValidation(handler, keywordAnalysisSchema) 