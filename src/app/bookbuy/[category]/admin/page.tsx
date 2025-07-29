'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/ui/navigation'
import ParentPageInput from '@/components/ui/parent-page-input'
import HeroSection from '@/components/ui/hero-section'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
}

// Category configuration
const CATEGORIES = {
  nail: {
    name: 'Nail Salon',
    description: 'Manage nail salon and beauty service pages',
    color: 'purple',
    icon: '💅',
    keywords: ['nail salon', 'manicure', 'pedicure', 'nail art', 'gel nails', 'acrylic nails']
  },
  beauty: {
    name: 'Beauty',
    description: 'Manage beauty and cosmetic service pages',
    color: 'pink',
    icon: '💄',
    keywords: ['beauty salon', 'makeup', 'skincare', 'hair salon', 'spa', 'facial']
  },
  fitness: {
    name: 'Fitness',
    description: 'Manage fitness and gym service pages',
    color: 'green',
    icon: '💪',
    keywords: ['gym', 'fitness center', 'personal trainer', 'yoga', 'pilates', 'workout']
  },
  restaurant: {
    name: 'Restaurant',
    description: 'Manage restaurant and food service pages',
    color: 'orange',
    icon: '🍽️',
    keywords: ['restaurant', 'cafe', 'pizza', 'sushi', 'fast food', 'fine dining']
  },
  health: {
    name: 'Health',
    description: 'Manage health and medical service pages',
    color: 'blue',
    icon: '🏥',
    keywords: ['doctor', 'dentist', 'pharmacy', 'clinic', 'medical center', 'therapy']
  }
}

export default function BookbuyCategoryAdmin() {
  const params = useParams()
  const router = useRouter()
  const category = params.category as string
  
  // Check if category is valid
  if (!CATEGORIES[category as keyof typeof CATEGORIES]) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-6 pt-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Invalid Category</h1>
            <p className="text-gray-600 mb-6">The category "{category}" is not supported.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {Object.entries(CATEGORIES).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => router.push(`/bookbuy/${key}/admin`)}
                  className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-2">{config.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{config.name}</h3>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const categoryConfig = CATEGORIES[category as keyof typeof CATEGORIES]

  // Form state
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    resolver: zodResolver(formSchema)
  })

  // Page state
  const [projectConfigured, setProjectConfigured] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Content state
  const [editableContent, setEditableContent] = useState('')
  const [editableFaq, setEditableFaq] = useState('')
  const [editableSchema, setEditableSchema] = useState('')
  const [semrushContent, setSemrushContent] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [keywords, setKeywords] = useState<KeywordData[]>([])
  const [showKeywords, setShowKeywords] = useState(true)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [showGeneratedContent, setShowGeneratedContent] = useState(true)
  const [savedContent, setSavedContent] = useState('')
  const [showFaqCard, setShowFaqCard] = useState(true)
  const [isGeneratingFaq, setIsGeneratingFaq] = useState(false)
  const [generatedFaq, setGeneratedFaq] = useState('')
  const [savedFaq, setSavedFaq] = useState('')
  const [showFaqSchema, setShowFaqSchema] = useState(true)
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false)
  const [generatedSchema, setGeneratedSchema] = useState('')
  const [savedSchema, setSavedSchema] = useState('')
  const [showMetaFields, setShowMetaFields] = useState(true)
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false)
  const [generatedMetaTitle, setGeneratedMetaTitle] = useState('')
  const [generatedMetaDescription, setGeneratedMetaDescription] = useState('')
  const [savedMetaTitle, setSavedMetaTitle] = useState('')
  const [savedMetaDescription, setSavedMetaDescription] = useState('')
  const [isCanonical, setIsCanonical] = useState(true)
  const [showMainContentImages, setShowMainContentImages] = useState(true)
  const [showFinalSummary, setShowFinalSummary] = useState(true)
  const [showEditOptions, setShowEditOptions] = useState(false)

  // Hero section state
  const [heroEnabled, setHeroEnabled] = useState(true)
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

  // Change tracking
  const [changeTracking, setChangeTracking] = useState({
    projectConfig: false,
    keywords: false,
    content: false,
    faq: false,
    schema: false,
    meta: false,
    hero: false,
    banner: false,
    images: false
  })

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Auto-save effect
  useEffect(() => {
    if (showMetaFields && getMainKeyword() && savedContent && savedFaq && !generatedMetaTitle && !generatedMetaDescription) {
      generateMetaFields()
    }
  }, [showMetaFields, savedContent, savedFaq])

  // Utility functions
  const getMainKeyword = (): string => {
    return watch('mainKeyword') || ''
  }

  const getMainKeywordRequired = (): string => {
    const keyword = getMainKeyword()
    if (!keyword.trim()) {
      throw new Error('Main keyword is required')
    }
    return keyword.trim()
  }

  const trackChange = (field: keyof typeof changeTracking) => {
    setChangeTracking(prev => ({ ...prev, [field]: true }))
    setHasUnsavedChanges(true)
  }

  const resetChangeTracking = (field: keyof typeof changeTracking) => {
    setChangeTracking(prev => ({ ...prev, [field]: false }))
  }

  const generateMetaFields = async () => {
    if (!getMainKeyword() || !savedContent || !savedFaq) {
      setMessage('❌ Please generate content and FAQ first')
      return
    }

    setIsGeneratingMeta(true)
    setMessage('🤖 Generating Meta Title and Description...')

    try {
      const response = await fetch('/api/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainKeyword: getMainKeyword(),
          content: savedContent,
          faq: savedFaq,
          category: category
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedMetaTitle(data.metaTitle)
        setGeneratedMetaDescription(data.metaDescription)
        setMessage('✅ Meta Title and Description generated successfully!')
      } else {
        setMessage('❌ Failed to generate meta fields')
      }
    } catch (error) {
      setMessage('❌ Error generating meta fields')
    } finally {
      setIsGeneratingMeta(false)
    }
  }

  const generateSlogan = async () => {
    if (!getMainKeyword()) {
      setMessage('❌ Please enter a main keyword first')
      return
    }

    setIsGeneratingSlogan(true)
    setMessage('🤖 Generating slogan...')

    try {
      const response = await fetch('/api/generate-slogan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainKeyword: getMainKeyword(),
          category: category
        })
      })

      if (response.ok) {
        const data = await response.json()
        setHeroSlogan(data.slogan)
        setMessage('✅ Slogan generated successfully!')
      } else {
        setMessage('❌ Failed to generate slogan')
      }
    } catch (error) {
      setMessage('❌ Error generating slogan')
    } finally {
      setIsGeneratingSlogan(false)
    }
  }

  const saveAllData = async () => {
    setIsGenerating(true)
    setMessage('💾 Saving all data...')

    try {
      // Save to database with category
      const pageData = {
        handle: watch('handle'),
        mainKeyword: getMainKeywordRequired(),
        category: category,
        content: savedContent || editableContent || '',
        faqContent: savedFaq || editableFaq || '',
        faqSchema: savedSchema || editableSchema || '',
        metaTitle: savedMetaTitle || generatedMetaTitle || '',
        metaDescription: savedMetaDescription || generatedMetaDescription || '',
        canonical: isCanonical,
        keywords: keywords.filter(k => k.selected),
        heroSection: {
          enabled: heroEnabled,
          h1: heroH1,
          slogan: heroSlogan,
          span: heroSpan,
          buttonUrl: heroButtonUrl,
          buttonText: heroButtonText,
          image1: heroImage1,
          image2: heroImage2,
          alt1: heroAlt1,
          alt2: heroAlt2
        }
      }

      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData)
      })

      if (response.ok) {
        const savedPage = await response.json()
        setMessage('✅ All data saved successfully!')
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        resetChangeTracking('projectConfig')
        resetChangeTracking('keywords')
        resetChangeTracking('content')
        resetChangeTracking('faq')
        resetChangeTracking('schema')
        resetChangeTracking('meta')
        resetChangeTracking('hero')
      } else {
        setMessage('❌ Failed to save data')
      }
    } catch (error) {
      setMessage('❌ Error saving data')
    } finally {
      setIsGenerating(false)
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setProjectConfigured(true)
    setMessage('✅ Project configured! Now generate keywords and content.')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-6 pt-20">
        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`text-4xl ${categoryConfig.color === 'purple' ? 'text-purple-600' : 
              categoryConfig.color === 'pink' ? 'text-pink-600' :
              categoryConfig.color === 'green' ? 'text-green-600' :
              categoryConfig.color === 'orange' ? 'text-orange-600' :
              'text-blue-600'}`}>
              {categoryConfig.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{categoryConfig.name} Dashboard</h1>
              <p className="text-gray-600">{categoryConfig.description}</p>
            </div>
          </div>
          
          {/* Category Navigation */}
          <div className="flex space-x-2 mb-6">
            {Object.entries(CATEGORIES).map(([key, config]) => (
              <button
                key={key}
                onClick={() => router.push(`/bookbuy/${key}/admin`)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  key === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {config.icon} {config.name}
              </button>
            ))}
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        {/* Project Configuration */}
        {!projectConfigured && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Configure {categoryConfig.name} Project</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Keyword
                </label>
                <input
                  {...register('mainKeyword')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter ${categoryConfig.name.toLowerCase()} keyword...`}
                />
                {errors.mainKeyword && (
                  <p className="mt-1 text-sm text-red-600">{errors.mainKeyword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Handle
                </label>
                <input
                  {...register('handle')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter URL handle..."
                />
                {errors.handle && (
                  <p className="mt-1 text-sm text-red-600">{errors.handle.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Configure Project
              </button>
            </form>
          </div>
        )}

        {/* Main Dashboard Content */}
        {projectConfigured && (
          <div className="space-y-8">
            {/* Save Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{categoryConfig.name} Page Generator</h2>
                <p className="text-gray-600">Create optimized pages for {categoryConfig.name.toLowerCase()} services</p>
              </div>
              
              <button
                onClick={saveAllData}
                disabled={isGenerating || !hasUnsavedChanges}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isGenerating ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save All Changes' : '✅ All Saved'}
              </button>
            </div>

            {/* Category-specific suggestions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 {categoryConfig.name} Suggestions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Popular Keywords:</h4>
                  <div className="flex flex-wrap gap-2">
                    {categoryConfig.keywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Tips:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Focus on local SEO for {categoryConfig.name.toLowerCase()} services</li>
                    <li>• Include service-specific keywords</li>
                    <li>• Add location-based content</li>
                    <li>• Use high-quality images</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Rest of dashboard content would go here - same as main dashboard */}
            <div className="text-center py-12">
              <p className="text-gray-600">Dashboard content will be implemented here with category-specific features</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 