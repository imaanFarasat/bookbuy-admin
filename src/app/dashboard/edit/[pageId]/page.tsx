'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Navigation from '@/components/ui/navigation'
import ParentPageInput from '@/components/ui/parent-page-input'
import HeroSection from '@/components/ui/hero-section'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const formSchema = z.object({
  handle: z.string().min(1, 'Handle is required').regex(/^[a-z0-9-]+$/, 'Handle must contain only lowercase letters, numbers, and hyphens'),
  mainKeyword: z.string().min(1, 'Main keyword is required'),
  parentPageId: z.string().optional(),
})

interface KeywordData {
  id: string
  keyword: string
  volume: number
  category: string
  selected: boolean
  headingType: 'h2' | 'h3'
  customPrompt?: string
}

interface PageImage {
  id: string
  originalName: string
  fileName: string
  filePath: string
  altText: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  sortOrder: number
}

interface SavedPage {
  id: string
  handle: string
  mainKeyword: string
  parentPageId?: string
  metaTitle?: string
  metaDescription?: string
  canonical?: boolean
  content?: string
  faqContent?: string
  faqSchema?: any
  status: string
  createdAt: string
  updatedAt: string
  keywords: KeywordData[]
  images: PageImage[]
  heroSection?: {
    h1: string;
    slogan: string;
    span: string;
    buttonUrl: string;
    buttonText: string;
    image1: string;
    image2: string;
    alt1: string;
    alt2: string;
  };
  bannerAds?: any[];
}

// Sortable Keyword Component
function SortableKeywordItem({ 
  keyword, 
  index, 
  toggleKeyword, 
  changeHeadingType,
  removeKeyword,
  updateCustomPrompt
}: { 
  keyword: KeywordData
  index: number
  toggleKeyword: (index: number) => void
  changeHeadingType: (index: number) => void
  removeKeyword: (index: number) => void
  updateCustomPrompt: (index: number, prompt: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: keyword.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border rounded-lg cursor-move ${
        keyword.selected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={keyword.selected}
            onChange={() => toggleKeyword(index)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className={`font-medium ${keyword.selected ? 'text-blue-900' : 'text-gray-700'}`}>
            {keyword.keyword}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={keyword.headingType}
            onChange={(e) => changeHeadingType(index)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="h2">H2</option>
            <option value="h3">H3</option>
          </select>
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeKeyword(index)
            }}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <div>Volume: {keyword.volume?.toLocaleString() || 'N/A'}</div>
        <div>Category: {keyword.category || 'General'}</div>
        <div>Type: {keyword.headingType.toUpperCase()}</div>
      </div>
      
      {/* Custom Prompt Input */}
      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Custom Prompt (Optional)
        </label>
        <textarea
          value={keyword.customPrompt || ''}
          onChange={(e) => {
            e.stopPropagation()
            updateCustomPrompt(index, e.target.value)
          }}
          placeholder={`Custom instructions for "${keyword.keyword}" (e.g., "Add bullet points", "Focus on Toronto", "Include 10 examples")`}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors resize-none"
          rows={2}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="text-xs text-gray-500 mt-1">
          💡 Leave empty to use default content generation
        </div>
      </div>
    </div>
  )
}

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const pageId = params.pageId as string

  // Form state
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    resolver: zodResolver(formSchema)
  })

  // Page data state
  const [savedPage, setSavedPage] = useState<SavedPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Content state
  const [keywords, setKeywords] = useState<KeywordData[]>([])
  const [editableContent, setEditableContent] = useState('')
  const [editableFaq, setEditableFaq] = useState('')
  const [editableSchema, setEditableSchema] = useState('')
  const [generatedMetaTitle, setGeneratedMetaTitle] = useState('')
  const [generatedMetaDescription, setGeneratedMetaDescription] = useState('')
  const [isCanonical, setIsCanonical] = useState(true)

  // Hero section state
  const [heroH1, setHeroH1] = useState('')
  const [heroSlogan, setHeroSlogan] = useState('')
  const [heroSpan, setHeroSpan] = useState('')
  const [heroButtonUrl, setHeroButtonUrl] = useState('')
  const [heroButtonText, setHeroButtonText] = useState('')
  const [heroImage1, setHeroImage1] = useState('')
  const [heroImage2, setHeroImage2] = useState('')
  const [heroAlt1, setHeroAlt1] = useState('')
  const [heroAlt2, setHeroAlt2] = useState('')
  const [isGeneratingSlogan, setIsGeneratingSlogan] = useState(false)

  // Banner ads state
  const [bannerAds, setBannerAds] = useState<any[]>([])
  const [showBannerAd, setShowBannerAd] = useState(false)

  // Main content images state
  const [bodyContentImages, setBodyContentImages] = useState<any[]>([])
  const [showMainContentImages, setShowMainContentImages] = useState(false)

  // UI state
  const [showKeywords, setShowKeywords] = useState(false)
  const [showGeneratedContent, setShowGeneratedContent] = useState(false)
  const [showFaqCard, setShowFaqCard] = useState(false)
  const [showFaqSchema, setShowFaqSchema] = useState(false)
  const [showMetaFields, setShowMetaFields] = useState(false)
  const [showHeroSection, setShowHeroSection] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualKeywordInput, setManualKeywordInput] = useState('')

  // Generation state
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [isGeneratingFaq, setIsGeneratingFaq] = useState(false)
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false)
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load page data
  useEffect(() => {
    if (pageId) {
      loadPageData()
    }
  }, [pageId])

  const loadPageData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pages/${pageId}`)
      const data = await response.json()

      if (data.success) {
        const page = data.page
        setSavedPage(page)

        // Populate form
        reset({
          handle: page.handle,
          mainKeyword: page.mainKeyword,
          parentPageId: page.parentPageId || ''
        })

        // Populate content
        setKeywords(page.keywords || [])
        setEditableContent(page.content || '')
        setEditableFaq(page.faqContent || '')
        setEditableSchema(page.faqSchema ? JSON.stringify(page.faqSchema, null, 2) : '')
        setGeneratedMetaTitle(page.metaTitle || '')
        setGeneratedMetaDescription(page.metaDescription || '')
        setIsCanonical(page.canonical !== undefined ? page.canonical : true)

        // Populate images
        setBodyContentImages(page.images?.filter((img: PageImage) => 
          img.originalName.includes('content')
        ).map((img: PageImage) => ({
          url: img.filePath,
          alt: img.altText || page.mainKeyword || '', // Use main keyword as fallback
          source: 'file',
          id: img.id
        })) || [])

        // Populate hero section if available
        if (page.heroSection) {
          setHeroH1(page.heroSection.h1 || '')
          setHeroSlogan(page.heroSection.slogan || '')
          setHeroSpan(page.heroSection.span || '')
          setHeroButtonUrl(page.heroSection.buttonUrl || '')
          setHeroButtonText(page.heroSection.buttonText || '')
          setHeroImage1(page.heroSection.image1 || '')
          setHeroImage2(page.heroSection.image2 || '')
          // Use main keyword as alt text for hero images
          setHeroAlt1(page.heroSection.alt1 || page.mainKeyword || '')
          setHeroAlt2(page.heroSection.alt2 || page.mainKeyword || '')
        }

        // Populate banner ads if available
        if (page.bannerAds) {
          setBannerAds(page.bannerAds)
        }

        // Show sections
        setShowKeywords(true)
        setShowGeneratedContent(true)
        setShowMetaFields(true)
        setShowMainContentImages(true)
        setShowHeroSection(true)

      } else {
        setError(data.error || 'Failed to load page')
      }
    } catch (error) {
      setError('Failed to load page')
      console.error('Error loading page:', error)
    } finally {
      setLoading(false)
    }
  }

  // Utility functions
  const capitalizeFirstLetterOfEachWord = (text: string): string => {
    return text.replace(/\b\w/g, l => l.toUpperCase())
  }

  const generateHandleFromKeyword = (keyword: string): string => {
    return keyword.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const capitalizeAllWords = (keyword: string): string => {
    return keyword.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  // Keyword management
  const toggleKeyword = (index: number) => {
    setKeywords(prev => prev.map((kw, i) => 
      i === index ? { ...kw, selected: !kw.selected } : kw
    ))
  }

  const removeKeyword = (index: number) => {
    setKeywords(prev => prev.filter((_, i) => i !== index))
  }

  const changeHeadingType = (index: number) => {
    setKeywords(prev => prev.map((kw, i) => 
      i === index ? { ...kw, headingType: kw.headingType === 'h2' ? 'h3' : 'h2' } : kw
    ))
  }

  const updateCustomPrompt = (index: number, prompt: string) => {
    setKeywords(prev => prev.map((kw, i) => 
      i === index ? { ...kw, customPrompt: prompt } : kw
    ))
  }

  const addManualKeyword = () => {
    if (manualKeywordInput.trim()) {
      const newKeyword: KeywordData = {
        id: `manual-${Date.now()}`,
        keyword: capitalizeAllWords(manualKeywordInput.trim()),
        volume: 0,
        category: 'Manual',
        selected: true,
        headingType: 'h2'
      }
      setKeywords(prev => [...prev, newKeyword])
      setManualKeywordInput('')
      setShowManualInput(false)
    }
  }

  // DnD handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setKeywords((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Content generation
  const generateAllComponents = async () => {
    setIsGeneratingAll(true)
    setMessage('🔄 Generating content...')

    try {
      const selectedKeywords = keywords.filter(k => k.selected)
      
      if (selectedKeywords.length === 0) {
        setError('Please select at least one keyword')
        return
      }

      // Generate content for each selected keyword
      let combinedContent = ''
      
      for (const keyword of selectedKeywords) {
        const response = await fetch('/api/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mainKeyword: keyword.keyword,
            keywords: [keyword]
          })
        })

        if (response.ok) {
          const data = await response.json()
          combinedContent += data.content + '\n\n'
        }
      }

      setEditableContent(combinedContent)
      setMessage('✅ Content generated successfully!')
      setShowGeneratedContent(true)

    } catch (error) {
      setError('Failed to generate content')
      console.error('Error generating content:', error)
    } finally {
      setIsGeneratingAll(false)
    }
  }

  const generateFaq = async () => {
    setIsGeneratingFaq(true)
    setMessage('🔄 Generating FAQ...')

    try {
      const response = await fetch('/api/generate-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editableContent,
          mainKeyword: watch('mainKeyword')
        })
      })

      if (response.ok) {
        const data = await response.json()
        setEditableFaq(data.faq)
        setMessage('✅ FAQ generated successfully!')
        setShowFaqCard(true)
      } else {
        setError('Failed to generate FAQ')
      }
    } catch (error) {
      setError('Failed to generate FAQ')
      console.error('Error generating FAQ:', error)
    } finally {
      setIsGeneratingFaq(false)
    }
  }

  const generateMetaFields = async () => {
    setIsGeneratingMeta(true)
    setMessage('🔄 Generating meta fields...')

    try {
      const response = await fetch('/api/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editableContent,
          faq: editableFaq,
          mainKeyword: watch('mainKeyword')
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedMetaTitle(data.metaTitle)
        setGeneratedMetaDescription(data.metaDescription)
        setMessage('✅ Meta fields generated successfully!')
      } else {
        setError('Failed to generate meta fields')
      }
    } catch (error) {
      setError('Failed to generate meta fields')
      console.error('Error generating meta fields:', error)
    } finally {
      setIsGeneratingMeta(false)
    }
  }

  // Image management
  const addBodyContentImage = (imageData: {url: string, alt: string, source: 'file' | 'pexels', file?: File}) => {
    setBodyContentImages(prev => [...prev, imageData])
  }

  const removeBodyContentImage = (index: number) => {
    setBodyContentImages(prev => prev.filter((_, i) => i !== index))
  }

  const updateBodyContentImage = (index: number, field: 'url' | 'alt', value: string) => {
    setBodyContentImages(prev => prev.map((img, i) => 
      i === index ? { ...img, [field]: value } : img
    ))
  }

  // Save changes
  const saveChanges = async () => {
    try {
      setMessage('💾 Saving changes...')

      const pageData = {
        handle: watch('handle'),
        mainKeyword: watch('mainKeyword'),
        parentPageId: watch('parentPageId'),
        metaTitle: generatedMetaTitle,
        metaDescription: generatedMetaDescription,
        canonical: isCanonical,
        content: editableContent,
        faqContent: editableFaq,
        faqSchema: editableSchema ? JSON.parse(editableSchema) : null,
        keywords: keywords.map(k => ({
          keyword: k.keyword,
          volume: k.volume,
          category: k.category,
          selected: k.selected,
          headingType: k.headingType
        })),
        images: bodyContentImages.map(img => ({
          url: img.url,
          alt: img.alt,
          source: img.source,
          type: 'content'
        })),
        heroSection: {
          h1: heroH1,
          slogan: heroSlogan,
          span: heroSpan,
          buttonUrl: heroButtonUrl,
          buttonText: heroButtonText,
          image1: heroImage1,
          image2: heroImage2,
          alt1: heroAlt1,
          alt2: heroAlt2,
        },
        bannerAds: bannerAds,
      }

      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData)
      })

      if (response.ok) {
        setMessage('✅ Changes saved successfully!')
      } else {
        setError('Failed to save changes')
      }
    } catch (error) {
      setError('Failed to save changes')
      console.error('Error saving changes:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-6 pt-20">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-6 pt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Page</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard/history')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ← Back to History
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-6 pt-20">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Page</h1>
              <p className="text-gray-600">Modify your page content, keywords, and settings</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/dashboard/history')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                ← Back to History
              </button>
              <button
                onClick={saveChanges}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Page Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Page Configuration</h2>
            
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Keyword (H1)
                </label>
                <input
                  {...register('mainKeyword')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                  placeholder="best kitchen knives"
                />
                {errors.mainKeyword && (
                  <p className="mt-1 text-sm text-red-600">{errors.mainKeyword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Handle (URL Slug)
                </label>
                <input
                  {...register('handle')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                  placeholder="my-awesome-page"
                />
                {errors.handle && (
                  <p className="mt-1 text-sm text-red-600">{errors.handle.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Page (Optional)
                </label>
                <ParentPageInput
                  value={watch('parentPageId') || ''}
                  onChange={(value) => setValue('parentPageId', value)}
                  onParentPageCreated={(parentPage) => {
                    console.log('New parent page created:', parentPage)
                  }}
                  placeholder="Enter parent page name (e.g., Kitchen Guides, Product Reviews)"
                />
              </div>
            </form>
          </div>

          {/* Right Column - Keywords Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Keywords Management</h2>
              <button
                type="button"
                onClick={generateAllComponents}
                disabled={isGeneratingAll}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingAll ? 'Generating...' : 'Generate Content'}
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={keywords.map(k => k.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {keywords.map((keyword, index) => (
                    <SortableKeywordItem
                      key={keyword.id}
                      keyword={keyword}
                      index={index}
                      toggleKeyword={toggleKeyword}
                      changeHeadingType={changeHeadingType}
                      removeKeyword={removeKeyword}
                      updateCustomPrompt={updateCustomPrompt}
                    />
                  ))}
                  
                  {/* Add Manual Keyword */}
                  <div className="flex items-center mt-4">
                    {!showManualInput && (
                      <button
                        onClick={() => setShowManualInput(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-900 text-white text-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                        title="Add keyword manually"
                        type="button"
                      >
                        +
                      </button>
                    )}
                    {showManualInput && (
                      <div className="flex items-center space-x-2 w-full">
                        <input
                          type="text"
                          value={manualKeywordInput}
                          onChange={(e) => setManualKeywordInput(e.target.value)}
                          placeholder="Enter keyword (e.g., 'Best Kitchen Knives')"
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                          onKeyPress={(e) => e.key === 'Enter' && addManualKeyword()}
                          autoFocus
                        />
                        <button
                          onClick={addManualKeyword}
                          disabled={!manualKeywordInput.trim()}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          type="button"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowManualInput(false)
                            setManualKeywordInput('')
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 focus:outline-none"
                          title="Cancel"
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Content Sections */}
        {showGeneratedContent && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Main Content</h3>
              <button
                type="button"
                onClick={generateAllComponents}
                disabled={isGeneratingAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingAll ? 'Regenerating...' : 'Regenerate Content'}
              </button>
            </div>
            
            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="w-full h-96 p-4 border border-gray-200 rounded-lg bg-white text-gray-800 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              placeholder="Main content will appear here..."
            />
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">FAQ Section</h3>
            <button
              type="button"
              onClick={generateFaq}
              disabled={isGeneratingFaq}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingFaq ? 'Generating...' : 'Generate FAQ'}
            </button>
          </div>
          
          <textarea
            value={editableFaq}
            onChange={(e) => setEditableFaq(e.target.value)}
            className="w-full h-64 p-4 border border-gray-200 rounded-lg bg-white text-gray-800 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            placeholder="FAQ content will appear here..."
          />
        </div>

        {/* Meta Fields */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Meta Title & Description</h3>
            <button
              type="button"
              onClick={generateMetaFields}
              disabled={isGeneratingMeta}
              className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingMeta ? 'Generating...' : 'Generate Meta Fields'}
            </button>
          </div>

          <div className="space-y-6">
            {/* Meta Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                value={generatedMetaTitle}
                onChange={(e) => setGeneratedMetaTitle(e.target.value)}
                maxLength={60}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                placeholder="Enter meta title..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {generatedMetaTitle.length}/60 characters
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={generatedMetaDescription}
                onChange={(e) => setGeneratedMetaDescription(e.target.value)}
                maxLength={160}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                placeholder="Enter meta description..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {generatedMetaDescription.length}/160 characters
              </p>
            </div>

            {/* Canonical URL */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make this page canonical?
                  </label>
                  <p className="text-xs text-gray-500">
                    Canonical pages tell search engines this is the preferred version. 
                    Only set this for your main/primary pages.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCanonical}
                    onChange={(e) => setIsCanonical(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {isCanonical && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h6 className="text-sm font-medium text-blue-800">Canonical Page</h6>
                      <p className="text-xs text-blue-600 mt-1">
                        This page will be marked as canonical. Search engines will treat this as the preferred version.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Raw HTML:</h5>
                <pre className="text-xs text-gray-600 bg-gray-50 p-3 border border-gray-200 rounded-lg overflow-x-auto">
                  {isCanonical ? `<link rel="canonical" href="${typeof window !== 'undefined' ? window.location.origin : ''}/${watch('mainKeyword')?.toLowerCase().replace(/\s+/g, '-')}" />` : '<!-- No canonical URL set -->'}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Hero Section</h3>
          
          <HeroSection
            mainKeyword={watch('mainKeyword')}
            slogan={heroSlogan}
            span={heroSpan}
            heroImage1={heroImage1}
            heroImage2={heroImage2}
            heroAlt1={heroAlt1}
            heroAlt2={heroAlt2}
            buttonUrl={heroButtonUrl}
            buttonText={heroButtonText}
            isEnabled={true}
            onH1Change={setHeroH1}
            onSloganChange={setHeroSlogan}
            onSpanChange={setHeroSpan}
            onImage1Change={setHeroImage1}
            onImage2Change={setHeroImage2}
            onAlt1Change={setHeroAlt1}
            onAlt2Change={setHeroAlt2}
            onButtonUrlChange={setHeroButtonUrl}
            onButtonTextChange={setHeroButtonText}
            onToggleEnabled={() => {}}
            onGenerateSlogan={() => {
              // TODO: Implement slogan generation
              console.log('Generate slogan clicked')
            }}
            isGeneratingSlogan={isGeneratingSlogan}
          />
        </div>

        {/* Banner Ads */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Banner Ads</h3>
            <button
              type="button"
              onClick={() => setShowBannerAd(!showBannerAd)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showBannerAd ? 'Hide' : 'Show'} Banner Ads
            </button>
          </div>

          {showBannerAd && (
            <div className="space-y-6">
              {bannerAds.map((banner, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={banner.title}
                        onChange={(e) => {
                          const newBanners = [...bannerAds]
                          newBanners[index].title = e.target.value
                          setBannerAds(newBanners)
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <input
                        type="text"
                        value={banner.description}
                        onChange={(e) => {
                          const newBanners = [...bannerAds]
                          newBanners[index].description = e.target.value
                          setBannerAds(newBanners)
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CTA</label>
                      <input
                        type="text"
                        value={banner.cta}
                        onChange={(e) => {
                          const newBanners = [...bannerAds]
                          newBanners[index].cta = e.target.value
                          setBannerAds(newBanners)
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Image Alt Text</label>
                      <input
                        type="text"
                        value={banner.image?.alt || ''}
                        onChange={(e) => {
                          const newBanners = [...bannerAds]
                          if (!newBanners[index].image) newBanners[index].image = {}
                          newBanners[index].image.alt = e.target.value
                          setBannerAds(newBanners)
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {banner.image?.url && (
                        <img
                          src={banner.image.url}
                          alt={banner.image.alt || ''}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                const newBanners = [...bannerAds]
                                if (!newBanners[index].image) newBanners[index].image = {}
                                newBanners[index].image.url = event.target?.result as string
                                newBanners[index].image.alt = watch('mainKeyword')
                                setBannerAds(newBanners)
                              }
                              reader.readAsDataURL(file)
                            }
                          }
                          input.click()
                        }}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        {banner.image?.url ? 'Change' : 'Add'} Image
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const newBanners = bannerAds.filter((_, i) => i !== index)
                        setBannerAds(newBanners)
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  setBannerAds([...bannerAds, {
                    title: '',
                    description: '',
                    cta: '',
                    image: {}
                  }])
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
              >
                + Add Banner Ad
              </button>
            </div>
          )}
        </div>

        {/* Main Content Images */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Main Content Images</h3>
            <div className="text-sm text-gray-600">
              H2 Headings in Main Content: {editableContent ? (editableContent.match(/<h2[^>]*>.*?<\/h2>/g) || []).length : 0}
            </div>
          </div>

          <div className="space-y-6">
            {/* Add Image Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.multiple = true
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || [])
                    files.forEach(file => {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const base64Url = event.target?.result as string
                        const mainKeyword = watch('mainKeyword')
                        addBodyContentImage({
                          url: base64Url,
                          alt: mainKeyword,
                          source: 'file' as const,
                          file: file
                        })
                      }
                      reader.readAsDataURL(file)
                    })
                  }
                  input.click()
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">+</span>
                Add Main Content Images
              </button>
            </div>

            {/* Images Grid */}
            {bodyContentImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {bodyContentImages.map((image, index) => (
                  <div key={index} className="relative group">
                    {/* Image */}
                    <div className="relative">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          console.error('Image failed to load:', image.url)
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeBodyContentImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      
                      {/* Image Number */}
                      <div className="absolute top-1 left-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Alt Text Input */}
                    <input
                      type="text"
                      value={image.alt}
                      onChange={(e) => updateBodyContentImage(index, 'alt', e.target.value)}
                      placeholder={`Alt text (${watch('mainKeyword')})`}
                      className="w-full mt-2 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={saveChanges}
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg shadow-lg"
          >
            💾 Save All Changes
          </button>
        </div>
      </div>
    </div>
  )
} 