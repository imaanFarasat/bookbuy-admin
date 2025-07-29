import { z } from 'zod'

// ⚠️ CRITICAL RULE: NEVER ADD PRE-WRITTEN CONTENT OR SUGGESTIONS
// AI must decide what to write about keywords - no hardcoded content allowed
// This rule applies to ALL content generation functions in this codebase

// Base validation schemas
export const baseStringSchema = z.string().min(1).max(1000)
export const baseUrlSchema = z.string().url().max(500)
export const baseIdSchema = z.string().min(1).max(100)

// Handle validation (URL-friendly slug)
export const handleSchema = z.string()
  .min(1, 'Handle is required')
  .max(100, 'Handle must be less than 100 characters')
  .regex(/^[a-z0-9-]+$/, 'Handle must contain only lowercase letters, numbers, and hyphens')
  .refine(val => !val.startsWith('-') && !val.endsWith('-'), {
    message: 'Handle cannot start or end with a hyphen'
  })

// Main keyword validation
export const mainKeywordSchema = z.string()
  .min(1, 'Main keyword is required')
  .max(200, 'Main keyword must be less than 200 characters')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Main keyword contains invalid characters')
  .refine(val => !val.includes('<script') && !val.includes('javascript:') && !val.includes('data:text/html'), {
    message: 'Main keyword contains malicious content'
  })

// Content validation with length limits
export const contentSchema = z.string()
  .min(1, 'Content is required')
  .max(50000, 'Content must be less than 50,000 characters')
  .refine(val => !val.includes('<script') && !val.includes('javascript:') && !val.includes('data:text/html'), {
    message: 'Content cannot contain malicious code'
  })

// FAQ content validation
export const faqContentSchema = z.string()
  .min(1, 'FAQ content is required')
  .max(10000, 'FAQ content must be less than 10,000 characters')
  .refine(val => !val.includes('<script'), {
    message: 'FAQ content cannot contain script tags'
  })

// Meta title validation
export const metaTitleSchema = z.string()
  .min(1, 'Meta title is required')
  .max(60, 'Meta title must be less than 60 characters')
  .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Meta title contains invalid characters')

// Meta description validation
export const metaDescriptionSchema = z.string()
  .min(1, 'Meta description is required')
  .max(160, 'Meta description must be less than 160 characters')
  .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Meta description contains invalid characters')

// Keyword object validation
export const keywordSchema = z.object({
  id: z.string().optional(),
  keyword: z.string()
    .min(1, 'Keyword is required')
    .max(200, 'Keyword must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Keyword contains invalid characters')
    .refine(val => !val.includes('<script') && !val.includes('javascript:') && !val.includes('data:text/html'), {
      message: 'Keyword contains malicious content'
    }),
  volume: z.number().min(0).max(10000000).optional(),
  category: z.string().max(100).optional(),
  selected: z.boolean().default(false),
  headingType: z.enum(['h2', 'h3']).default('h2'),
  sortOrder: z.number().min(0).max(1000).optional()
})

// Image object validation
export const imageSchema = z.object({
  name: z.string().max(255).optional(),
  url: z.string().url().max(500),
  alt: z.string().max(200).optional(),
  width: z.number().min(1).max(10000).optional(),
  height: z.number().min(1).max(10000).optional()
})

// Page creation/update schema
export const pageCreateSchema = z.object({
  handle: handleSchema,
  mainKeyword: mainKeywordSchema,
  content: contentSchema.optional(),
  faq: faqContentSchema.optional(),
  schema: z.string().max(50000).optional(),
  metaTitle: metaTitleSchema.optional(),
  metaDescription: metaDescriptionSchema.optional(),
  keywords: z.array(keywordSchema).max(50).optional(),
  images: z.array(imageSchema).max(20).optional(),
  parentPageId: baseIdSchema.optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft')
})

// Simplified keyword schema for API calls
export const simpleKeywordSchema = z.object({
  keyword: z.string()
    .min(1, 'Keyword is required')
    .max(200, 'Keyword must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Keyword contains invalid characters')
    .refine(val => !val.includes('<script') && !val.includes('javascript:') && !val.includes('data:text/html'), {
      message: 'Keyword contains malicious content'
    }),
  headingType: z.enum(['h2', 'h3']).default('h2'),
  customPrompt: z.string().max(1000).optional()
})

// Content generation schema
export const contentGenerationSchema = z.object({
  keywords: z.array(simpleKeywordSchema).min(1).max(50),
  mainKeyword: mainKeywordSchema,
  customPrompt: z.string().max(1000).optional()
})

// FAQ generation schema
export const faqGenerationSchema = z.object({
  content: contentSchema,
  mainKeyword: mainKeywordSchema
})

// Meta generation schema
export const metaGenerationSchema = z.object({
  content: contentSchema.optional(),
  mainKeyword: mainKeywordSchema,
  faq: faqContentSchema.optional()
})

// Keyword analysis schema
export const keywordAnalysisSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(100000, 'Content must be less than 100,000 characters')
})

// Page update schema
export const pageUpdateSchema = z.object({
  content: contentSchema.optional(),
  faq: faqContentSchema.optional(),
  schema: z.string().max(50000).optional(),
  metaTitle: metaTitleSchema.optional(),
  metaDescription: metaDescriptionSchema.optional(),
  status: z.enum(['draft', 'published', 'archived']).optional()
})

// Search images schema
export const searchImagesSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Search query contains invalid characters'),
  count: z.number().min(1).max(20).default(12)
})

// Internal links schema
export const internalLinksSchema = z.object({
  internalLinks: z.array(z.object({
    text: z.string().max(200),
    url: z.string().max(500),
    pageId: baseIdSchema.optional()
  })).max(100)
})

// Related articles schema
export const relatedArticlesSchema = z.object({
  relatedArticles: z.array(z.object({
    title: z.string().max(200),
    url: z.string().max(500),
    description: z.string().max(500).optional()
  })).max(20)
})

// Type exports for use in components
export type PageCreateData = z.infer<typeof pageCreateSchema>
export type ContentGenerationData = z.infer<typeof contentGenerationSchema>
export type FaqGenerationData = z.infer<typeof faqGenerationSchema>
export type MetaGenerationData = z.infer<typeof metaGenerationSchema>
export type KeywordAnalysisData = z.infer<typeof keywordAnalysisSchema>
export type PageUpdateData = z.infer<typeof pageUpdateSchema>
export type SearchImagesData = z.infer<typeof searchImagesSchema>
export type InternalLinksData = z.infer<typeof internalLinksSchema>
export type RelatedArticlesData = z.infer<typeof relatedArticlesSchema> 