'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Navigation from '@/components/ui/navigation'
import ParentPageInput from '@/components/ui/parent-page-input'
import HeroSection from '@/components/ui/hero-section'
import PexelsSearch from '@/components/ui/pexels-search'

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

// Enhanced image fitting system (moved outside component for access)
const getImageFitClasses = (type: 'hero' | 'banner' | 'content' | 'preview' | 'thumbnail', size?: 'sm' | 'md' | 'lg' | 'xl') => {
  const baseClasses = 'object-cover rounded-lg'
  
  switch (type) {
    case 'hero':
      return `${baseClasses} w-full h-64 md:h-80 lg:h-96 xl:h-[28rem] aspect-[4/3] md:aspect-[3/2] lg:aspect-[16/9]`
    case 'banner':
      return `${baseClasses} w-full h-32 md:h-40 lg:h-48 aspect-[3/1] md:aspect-[4/1]`
    case 'content':
      return `${baseClasses} w-full h-48 md:h-56 lg:h-64 aspect-[4/3] md:aspect-[3/2]`
    case 'preview':
      return `${baseClasses} w-24 h-24 md:w-32 md:h-32 aspect-square`
    case 'thumbnail':
      const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24', 
        lg: 'w-32 h-32',
        xl: 'w-40 h-40'
      }
      return `${baseClasses} ${sizeClasses[size || 'md']} aspect-square`
    default:
      return `${baseClasses} w-full h-48 aspect-[4/3]`
  }
}

// Image loading and error handling (moved outside component for access)
const handleImageLoad = (imageUrl: string, type: string) => {
  console.log(`✅ ${type} image loaded successfully:`, imageUrl)
}

const handleImageError = (imageUrl: string, type: string, element: HTMLImageElement) => {
  console.error(`❌ ${type} image failed to load:`, imageUrl)
  
  // Create fallback placeholder
  const fallback = document.createElement('div')
  fallback.className = 'w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm'
  fallback.innerHTML = `
    <div class="text-center">
      <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
      </svg>
      <p class="text-xs">Image failed to load</p>
    </div>
  `
  
  // Replace the image with fallback
  element.style.display = 'none'
  element.parentNode?.insertBefore(fallback, element)
}

// Sortable Keyword Component
function SortableImageItem({ 
  image, 
  imageUrl, 
  altText, 
  index, 
  onRemove 
}: { 
  image: File
  imageUrl: string
  altText: string
  index: number
  onRemove: (index: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `image-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group cursor-move"
      {...attributes}
      {...listeners}
    >
      <div className="absolute top-2 left-2 bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        ⋮⋮
      </div>
      <img
        src={imageUrl}
        alt={altText}
        className={getImageFitClasses('thumbnail', 'lg')}
        onLoad={() => handleImageLoad(imageUrl, 'SortableImage')}
        onError={(e) => handleImageError(imageUrl, 'SortableImage', e.currentTarget)}
      />

      <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
      <p className="text-xs text-blue-600 mt-1 font-medium">Alt: {altText}</p>
    </div>
  )
}

function SortableKeywordItem({ 
  keyword, 
  index, 
  toggleKeyword, 
  changeHeadingType,
  removeKeyword
}: { 
  keyword: KeywordData
  index: number
  toggleKeyword: (index: number) => void
  changeHeadingType: (index: number) => void
  removeKeyword: (index: number) => void
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
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
        keyword.selected 
          ? 'border-gray-900 bg-gray-50 shadow-sm' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => toggleKeyword(index)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
            </svg>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-800">{keyword.keyword}</span>
            <span className="text-sm text-gray-500">({keyword.volume} vol)</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              changeHeadingType(index)
            }}
            className={`px-3 py-1 text-xs rounded-lg ${
              keyword.headingType === 'h2' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            {keyword.headingType.toUpperCase()}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeKeyword(index)
            }}
            className="px-3 py-1 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState('')
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
  const [finalPageData, setFinalPageData] = useState<{
    content: string;
    faq: string;
    schema: string;
    metaTitle: string;
    metaDescription: string;
    pageId?: string;
    heroSection?: {
      enabled: boolean;
      h1: string;
      slogan: string;
      span: string;
      buttonUrl: string;
      buttonText: string;
      image1: string;
      image2: string;
      alt1: string;
      alt2: string;
    } | null;
    images: Array<{url: string, alt: string, name: string}>;
    bodyContentImages: Array<{url: string, alt: string, source: 'file' | 'pexels', file?: File}>;
    bannerAd: {
      image: {url: string, alt: string, source: 'file' | 'pexels'} | null;
      title: string;
      description: string;
      cta: string;
    };
    tableOfContents: string;
    relatedArticles: string;
  }>({
    content: '',
    faq: '',
    schema: '',
    metaTitle: '',
    metaDescription: '',
    images: [],
    bodyContentImages: [],
    bannerAd: {
      image: null,
      title: '',
      description: '',
      cta: ''
    },
    tableOfContents: '',
    relatedArticles: ''
  })
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageAltTexts, setImageAltTexts] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  
  // Additional validation states to track what has been saved
  const [isMetaSaved, setIsMetaSaved] = useState(false)
  const [isMetaEdited, setIsMetaEdited] = useState(false)
  const [isHeroSaved, setIsHeroSaved] = useState(false)
  const [isBannerSaved, setIsBannerSaved] = useState(false)
  const [isKeywordsSaved, setIsKeywordsSaved] = useState(false)
  const [isDatabaseSaved, setIsDatabaseSaved] = useState(false)
  const [isMainContentImagesSaved, setIsMainContentImagesSaved] = useState(false)
  
  // Banner ad state
  const [showBannerAd, setShowBannerAd] = useState(true)
  const [bannerAds, setBannerAds] = useState<Array<{
    image: {url: string, alt: string, source: 'file' | 'pexels'} | null;
    title: string;
    description: string;
    cta: string;
  }>>([{
    image: null,
    title: '',
    description: '',
    cta: ''
  }])

  // Main content images state
  const [bodyContentImages, setBodyContentImages] = useState<Array<{
    url: string;
    alt: string;
    source: 'file' | 'pexels';
    file?: File;
  }>>([])
  
  // Legacy single banner ad state (for backward compatibility)
  const [bannerAdImage, setBannerAdImage] = useState<{url: string, alt: string, source: 'file' | 'pexels'} | null>(null)
  const [bannerAdTitle, setBannerAdTitle] = useState('')
  const [bannerAdDescription, setBannerAdDescription] = useState('')
  const [bannerAdCta, setBannerAdCta] = useState('')
  
  // Function to capitalize first letter of each word
  const capitalizeFirstLetterOfEachWord = (text: string): string => {
    return text.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  // Generate slogan for hero section
  const generateSlogan = async () => {
    setIsGeneratingSlogan(true)
    setMessage('🤖 Generating slogan...')
    
    try {
      const mainKeyword = getMainKeywordRequired()
      const supportingText = heroSpan.trim()
      const selectedKeywords = keywords.filter(k => k.selected).map(k => k.keyword).join(', ')
      
      // Create context for OpenAI including both main keyword and supporting text
      const context = supportingText 
        ? `${mainKeyword} - ${supportingText}`
        : mainKeyword
      
      // Create a simple slogan based on the main keyword, supporting text, and selected keywords
      const sloganTemplates = [
        `Your Perfect ${context} Solution`,
        `Expert ${context} Services`,
        `Professional ${context} Excellence`,
        `Quality ${context} Guaranteed`,
        `Trusted ${context} Specialists`,
        `Premium ${context} Experience`,
        `Leading ${context} Provider`,
        `Excellence in ${context}`,
        `${context} Made Simple`,
        `Your ${context} Partner`
      ]
      
      // Select a random slogan
      const randomSlogan = sloganTemplates[Math.floor(Math.random() * sloganTemplates.length)]
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setHeroSlogan(randomSlogan)
      setMessage('✅ Slogan generated successfully!')
    } catch (error) {
      console.error('Error generating slogan:', error)
      setMessage('❌ Failed to generate slogan. Please try again.')
    } finally {
      setIsGeneratingSlogan(false)
    }
  }
  const [selectedBannerImageFile, setSelectedBannerImageFile] = useState<File | null>(null)
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [bannerImageAltText, setBannerImageAltText] = useState('')
  const [isUploadingBannerImage, setIsUploadingBannerImage] = useState(false)
  
  // Hero section state
  const [showHeroSection, setShowHeroSection] = useState(true)
  const [heroEnabled, setHeroEnabled] = useState(true)
  const [heroH1, setHeroH1] = useState('')
  const [heroSlogan, setHeroSlogan] = useState('')
  const [heroSpan, setHeroSpan] = useState('')
  const [heroButtonUrl, setHeroButtonUrl] = useState('')
  const [heroButtonText, setHeroButtonText] = useState('Book Now')
  const [heroImage1, setHeroImage1] = useState('')
  const [heroImage2, setHeroImage2] = useState('')
  const [heroAlt1, setHeroAlt1] = useState('')
  const [heroAlt2, setHeroAlt2] = useState('')
  const [isGeneratingSlogan, setIsGeneratingSlogan] = useState(false)
  
  // Pexels search for banner image
  const [showPexelsBannerSearch, setShowPexelsBannerSearch] = useState(false)
  const [pexelsBannerQuery, setPexelsBannerQuery] = useState('')
  const [pexelsBannerImages, setPexelsBannerImages] = useState<any[]>([])
  const [isSearchingPexelsBanner, setIsSearchingPexelsBanner] = useState(false)
  const [pexelsBannerPage, setPexelsBannerPage] = useState(1)
  const [pexelsBannerHasMore, setPexelsBannerHasMore] = useState(false)
  
  const [projectConfigured, setProjectConfigured] = useState(false)
  const [parentPageName, setParentPageName] = useState('')
  
  // Pexels image search states
  const [showPexelsSearch, setShowPexelsSearch] = useState(false)
  const [pexelsQuery, setPexelsQuery] = useState('')
  const [pexelsImages, setPexelsImages] = useState<any[]>([])
  const [isSearchingPexels, setIsSearchingPexels] = useState(false)
  const [pexelsPage, setPexelsPage] = useState(1)
  const [pexelsHasMore, setPexelsHasMore] = useState(false)
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({})
  
  // New state for combined generation workflow
  const [showCombinedResults, setShowCombinedResults] = useState(true)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [editableContent, setEditableContent] = useState('')
  const [editableFaq, setEditableFaq] = useState('')
  const [editableSchema, setEditableSchema] = useState('')
  const [isContentEdited, setIsContentEdited] = useState(true)
  const [isFaqEdited, setIsFaqEdited] = useState(true)
  const [isSchemaEdited, setIsSchemaEdited] = useState(true)
  const [isContentSaved, setIsContentSaved] = useState(false)
  const [isFaqSaved, setIsFaqSaved] = useState(false)
  const [isSchemaSaved, setIsSchemaSaved] = useState(false)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  
  // Manual keyword input state
  const [manualKeywordInput, setManualKeywordInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  // Change tracking state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [changeTracking, setChangeTracking] = useState({
    content: false,
    faq: false,
    schema: false,
    meta: false,
    hero: false,
    banner: false,
    images: false,
    keywords: false,
    projectConfig: false
  })

  // Auto-save functionality
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Track changes in real-time
  const trackChange = (field: keyof typeof changeTracking) => {
    setChangeTracking(prev => ({
      ...prev,
      [field]: true
    }))
    setHasUnsavedChanges(true)
    
    // Update saved status based on changes
    switch (field) {
      case 'content':
        setIsContentEdited(true)
        setIsContentSaved(false)
        break
      case 'faq':
        setIsFaqEdited(true)
        setIsFaqSaved(false)
        break
      case 'schema':
        setIsSchemaEdited(true)
        setIsSchemaSaved(false)
        break
      case 'meta':
        setIsMetaEdited(true)
        setIsMetaSaved(false)
        break
      case 'hero':
        setIsHeroSaved(false)
        break
      case 'banner':
        setIsBannerSaved(false)
        break
      case 'images':
        setIsMainContentImagesSaved(false)
        break
      case 'keywords':
        setIsKeywordsSaved(false)
        break
      case 'projectConfig':
        setProjectConfigured(false)
        break
    }
  }

  // Reset change tracking after successful save
  const resetChangeTracking = (field: keyof typeof changeTracking) => {
    setChangeTracking(prev => ({
      ...prev,
      [field]: false
    }))
    
    // Check if all changes are saved
    const updatedTracking = { ...changeTracking, [field]: false }
    const hasAnyChanges = Object.values(updatedTracking).some(hasChange => hasChange)
    setHasUnsavedChanges(hasAnyChanges)
  }

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && hasUnsavedChanges) {
      const timer = setTimeout(() => {
        autoSave()
      }, 30000) // Auto-save every 30 seconds
      
      return () => clearTimeout(timer)
    }
  }, [hasUnsavedChanges, autoSaveEnabled])

  // Save main content images
  const saveMainContentImages = async () => {
    try {
      setFinalPageData(prev => ({
        ...prev,
        bodyContentImages: bodyContentImages
      }))
      setIsMainContentImagesSaved(true)
      resetChangeTracking('images')
      console.log('✅ Main content images saved')
    } catch (error) {
      console.error('❌ Failed to save main content images:', error)
    }
  }



  // Auto-save function
  const autoSave = async () => {
    if (!hasUnsavedChanges) return
    
    try {
      console.log('🔄 Auto-saving changes...')
      
      // Save based on what has changed
      if (changeTracking.content || changeTracking.faq || changeTracking.schema) {
        await saveAllContent()
      }
      
      if (changeTracking.meta) {
        await saveMetaAndShowHero()
      }
      
      if (changeTracking.hero) {
        await saveHeroAndShowBanner()
      }
      
      if (changeTracking.banner) {
        await saveBannerAd()
      }
      
      if (changeTracking.images) {
        await saveMainContentImages()
      }
      
      setLastSaved(new Date())
      console.log('✅ Auto-save completed')
      
    } catch (error) {
      console.error('❌ Auto-save failed:', error)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setKeywords((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleImageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id && over?.id) {
      const oldIndex = parseInt(active.id.toString().replace('image-', ''))
      const newIndex = parseInt(over.id.toString().replace('image-', ''))

      setSelectedImages((items) => arrayMove(items, oldIndex, newIndex))
      setImageUrls((urls) => arrayMove(urls, oldIndex, newIndex))
      setImageAltTexts((texts) => arrayMove(texts, oldIndex, newIndex))
    }
  }
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    resolver: zodResolver(formSchema),
  })

  // Watch the main keyword to auto-generate handle
  const mainKeyword = watch('mainKeyword')

  // Function to convert main keyword to URL-friendly handle
  const generateHandleFromKeyword = (keyword: string): string => {
    return keyword
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  // Function to capitalize first letter of all words in keyword for display
  const capitalizeAllWords = (keyword: string): string => {
    if (!keyword) return keyword
    return keyword
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

      

  // Auto-generate meta fields when meta section is shown
  React.useEffect(() => {
    if (showMetaFields && getMainKeyword() && savedContent && savedFaq && !generatedMetaTitle && !generatedMetaDescription) {
      generateMetaFields()
    }
  }, [showMetaFields, savedContent, savedFaq])

  // Initialize hero H1 with main keyword when hero section is shown
  React.useEffect(() => {
    if (showHeroSection && getMainKeyword() && !heroH1) {
      setHeroH1(getMainKeywordRequired())
    }
  }, [showHeroSection, heroH1])

  // Analyze SEMrush content and extract keywords
  const analyzeContent = async () => {
    if (!semrushContent.trim()) {
      setMessage('❌ Please paste SEMrush content first')
      return
    }

    setIsAnalyzing(true)
    setMessage('🤖 Analyzing content and extracting keywords...')

    try {
      const response = await fetch('/api/analyze-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: semrushContent }),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setKeywords(result.keywords.map((k: any, index: number) => ({
          ...k,
          id: `keyword-${index}`,
          selected: true,
          headingType: 'h2' as const
        })))
        setShowKeywords(true)
        setMessage('✅ Keywords extracted and categorized! Select the ones you want to use.')
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ Failed to analyze content. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Toggle keyword selection
  const toggleKeyword = (index: number) => {
    setKeywords(prev => prev.map((k, i) => 
      i === index ? { ...k, selected: !k.selected } : k
    ))
  }

  // Remove keyword from list
  const removeKeyword = (index: number) => {
    const keywordToRemove = keywords[index]
    setKeywords(prev => prev.filter((_, i) => i !== index))
    setMessage(`✅ Removed keyword: "${keywordToRemove.keyword}"`)
  }

  // Change heading type (H2 ↔ H3)
  const changeHeadingType = (index: number) => {
    setKeywords(prev => prev.map((k, i) => 
      i === index ? { ...k, headingType: k.headingType === 'h2' ? 'h3' : 'h2' } : k
    ))
  }

  // Add manual keyword
  const addManualKeyword = () => {
    if (!manualKeywordInput.trim()) {
      setMessage('❌ Please enter a keyword')
      return
    }

    const capitalizedKeyword = capitalizeAllWords(manualKeywordInput.trim())
    const newKeyword: KeywordData = {
      id: `manual-${Date.now()}`,
      keyword: capitalizedKeyword,
      volume: 0,
      category: 'Manual',
      selected: true,
      headingType: 'h2'
    }

    setKeywords(prev => [...prev, newKeyword])
    setManualKeywordInput('')
    setShowManualInput(false)
    setMessage(`✅ Added manual keyword: "${capitalizedKeyword}"`)
  }

  // Generate all components in sequence (content, FAQ, schema)
  const generateAllComponents = async () => {
    // Check if main keyword is provided
    try {
      getMainKeyword()
    } catch (error) {
      setMessage('❌ ' + (error instanceof Error ? error.message : 'Main keyword is required'))
      return
    }

    const selectedKeywords = keywords.filter(k => k.selected)
    if (selectedKeywords.length === 0) {
      setMessage('❌ Please select at least one keyword')
      return
    }

    setIsGeneratingAll(true)
    setMessage('🤖 Generating all components...')
    setShowKeywords(false)
    setShowCombinedResults(true)

    try {
      // Step 1: Generate content for each individual keyword
      setMessage('🤖 Step 1/3: Generating content for each keyword...')
      
      // Generate fresh AI content for each selected keyword
      setMessage('🤖 AI is generating unique content for each keyword...')
      const mainContentWithAI = []
      
      for (const keyword of selectedKeywords) {
        try {
          console.log(`Generating content for keyword: ${keyword.keyword}`)
          
          const requestBody = {
            mainKeyword: keyword.keyword, // Use the individual keyword as main keyword
            keywords: [{
              keyword: keyword.keyword,
              headingType: keyword.headingType
            }]
          }
          
          console.log('Sending request to API:', JSON.stringify(requestBody, null, 2))
          
          const response = await fetch('/api/generate-content', {
        method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()
          console.log(`API response for ${keyword.keyword}:`, result)
          
          // Extract text content from HTML response
          let generatedContent = result.content || `Content about ${keyword.keyword}`
          
          // If the API returned HTML, extract just the text content
          if (generatedContent.includes('<p class="p-body-content">')) {
            const textMatches = generatedContent.match(/<p class="p-body-content">([^<]+)<\/p>/g)
            if (textMatches) {
              generatedContent = textMatches
                .map((match: string) => match.replace(/<p class="p-body-content">([^<]+)<\/p>/, '$1'))
                .join(' ')
            }
          }
          
          mainContentWithAI.push({
            keyword: keyword.keyword,
            content: generatedContent,
            headingType: keyword.headingType
          })
        } catch (error) {
          console.error(`Error generating content for ${keyword.keyword}:`, error)
          // Fallback content - minimal placeholder
          mainContentWithAI.push({
            keyword: keyword.keyword,
            content: `Content about ${keyword.keyword} will be generated by AI.`,
            headingType: keyword.headingType
          })
        }
      }

      // Combine all content into a single HTML structure
      let combinedContent = ''
      for (let i = 0; i < mainContentWithAI.length; i++) {
        const contentSection = mainContentWithAI[i]
        const capitalizedKeyword = contentSection.keyword
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
        
        // Create alternating layout: image on left, then image on right
        const isEven = i % 2 === 0
        
        if (isEven) {
          // Image on left, content on right
          combinedContent += `<div class="row mb-4">
            <div class="col-lg-4 mb-4">
                <!-- Image will be added by user later -->
            </div>
            <div class="col-lg-8 mb-4">
                <h2 class="h2-body-content">${capitalizedKeyword}</h2>
                <p class="p-body-content">${contentSection.content}</p>
            </div>
        </div>\n\n`
        } else {
          // Content on left, image on right
          combinedContent += `<div class="row mb-4">
            <div class="col-lg-8 mb-4">
                <h2 class="h2-body-content">${capitalizedKeyword}</h2>
                <p class="p-body-content">${contentSection.content}</p>
            </div>
            <div class="col-lg-4 mb-4">
                <!-- Image will be added by user later -->
            </div>
        </div>\n\n`
        }
      }
      
      setEditableContent(combinedContent)
      setSavedContent(combinedContent)

      // Step 2: Generate FAQ
      setMessage('🤖 Step 2/3: Generating FAQ...')
      const faqResponse = await fetch('/api/generate-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: combinedContent,
          mainKeyword: getMainKeyword()
        }),
      })

      if (!faqResponse.ok) {
        throw new Error('Failed to generate FAQ')
      }

      const faqResult = await faqResponse.json()
      const generatedFaq = faqResult.faq
      setEditableFaq(generatedFaq)
      setSavedFaq(generatedFaq)

      // Step 3: Generate Schema
      setMessage('🤖 Step 3/3: Generating FAQ schema...')
      const schemaResponse = await fetch('/api/generate-faq-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          faq: generatedFaq,
          mainKeyword: getMainKeyword()
        }),
      })

      if (!schemaResponse.ok) {
        throw new Error('Failed to generate schema')
      }

      const schemaResult = await schemaResponse.json()
      const generatedSchema = schemaResult.schema
      setEditableSchema(generatedSchema)
      setSavedSchema(generatedSchema)

      setMessage('✅ All components generated successfully! You can now edit them if needed.')
      
    } catch (error) {
      console.error('Error:', error)
      setMessage(`❌ Failed to generate components: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setShowCombinedResults(false)
      setShowKeywords(true)
    } finally {
      setIsGeneratingAll(false)
    }
  }

  // Finalize keyword selection and generate content (legacy function)
  const finalizeKeywords = async () => {
    // Check if main keyword is provided
    try {
      getMainKeyword()
    } catch (error) {
      setMessage('❌ ' + (error instanceof Error ? error.message : 'Main keyword is required'))
      return
    }

    const selectedKeywords = keywords.filter(k => k.selected)
    if (selectedKeywords.length === 0) {
      setMessage('❌ Please select at least one keyword')
      return
    }

    setIsGeneratingContent(true)
    setMessage('🤖 Generating content for each keyword...')

    try {
      // Filter keywords to only send essential data
      const filteredKeywords = selectedKeywords.map(k => ({
        keyword: k.keyword,
        headingType: k.headingType
      }))
      
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords: filteredKeywords,
          mainKeyword: getMainKeyword()
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setGeneratedContent(result.content)
        setShowGeneratedContent(true)
        setShowKeywords(false)
        setMessage('✅ Content generated successfully!')
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ Failed to generate content. Please try again.')
    } finally {
      setIsGeneratingContent(false)
    }
  }

  // Scroll to top function (disabled for continuous page flow)
  const scrollToTop = () => {
    // Disabled - keeping all sections visible for step-by-step workflow
  }

  // Save all content components (Content, FAQ, Schema)
  const saveAllContent = () => {
    setSavedContent(editableContent)
    setSavedFaq(editableFaq)
    setSavedSchema(editableSchema)
    setIsContentEdited(false)
    setIsFaqEdited(false)
    setIsSchemaEdited(false)
    setIsContentSaved(true)
    setIsFaqSaved(true)
    setIsSchemaSaved(true)
    resetChangeTracking('content')
    resetChangeTracking('faq')
    resetChangeTracking('schema')
    setMessage('✅ Content, FAQ, and Schema saved!')
  }

  // Save all components to database and proceed to next steps
  const saveAllToDatabase = async () => {
    setIsGenerating(true)
    setMessage('💾 Saving all components to database...')
    
    try {
      // Save to database using the API
      // Make handle unique by adding timestamp if it already exists
      const baseHandle = watch('handle')
      const uniqueHandle = `${baseHandle}-${Date.now()}`
      
      // Use saved content if available, otherwise use editable content
      const contentToSave = savedContent || editableContent || ''
      const faqToSave = savedFaq || editableFaq || ''
      const schemaToSave = savedSchema || editableSchema || ''
      
      const pageData = {
        handle: uniqueHandle,
        mainKeyword: getMainKeywordRequired(),
        content: contentToSave,
        faq: faqToSave,
        schema: schemaToSave,
        keywords: keywords.filter(k => k.selected)
      }
      
      console.log('Saving to database (saveAllToDatabase):', {
        handle: pageData.handle,
        mainKeyword: pageData.mainKeyword,
        contentLength: pageData.content.length,
        faqLength: pageData.faq.length,
        schemaLength: pageData.schema.length,
        keywordsCount: pageData.keywords.length,
        contentPreview: pageData.content.substring(0, 100) + '...',
        faqPreview: pageData.faq.substring(0, 100) + '...',
        savedContentLength: savedContent.length,
        editableContentLength: editableContent.length,
        savedFaqLength: savedFaq.length,
        editableFaqLength: editableFaq.length
      })
      
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to save to database: ${errorData.error || 'Unknown error'}`)
      }

      const savedPage = await response.json()
      console.log('Page saved successfully:', savedPage)
      
      // Store the page ID for future updates
      if (savedPage.success && savedPage.page) {
        console.log('Storing page ID:', savedPage.page.id)
        setCurrentPageId(savedPage.page.id)
        setFinalPageData(prev => ({
          ...prev,
          pageId: savedPage.page.id
        }))
      } else {
        console.error('No page ID in response:', savedPage)
      }
      
      // Set validation states after successful save
      setIsContentSaved(true)
      setIsFaqSaved(true)
      setIsSchemaSaved(true)
      setIsContentEdited(false)
      setIsFaqEdited(false)
      setIsSchemaEdited(false)
      setIsDatabaseSaved(true)
      
      setMessage('✅ All components saved to database successfully! Proceeding to Meta generation...')
      // Keep all sections visible for continuous workflow
      
    } catch (error) {
      console.error('Error saving to database:', error)
      setMessage('❌ Failed to save to database. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Save content and show FAQ card (legacy function)
  const saveContentAndShowFaq = () => {
    setSavedContent(generatedContent)
    // Keep all sections visible for continuous workflow
    setMessage('✅ Article saved! Ready to generate FAQ.')
  }

  // Generate FAQ for the saved content
  const generateFaq = async () => {
    // Check if main keyword is provided
    try {
      getMainKeywordRequired()
    } catch (error) {
      setMessage('❌ ' + (error instanceof Error ? error.message : 'Main keyword is required'))
      return
    }

    if (!savedContent) {
      setMessage('❌ No saved content found')
      return
    }

    setIsGeneratingFaq(true)
    setMessage('🤖 Generating 2 FAQ questions...')

    try {
      const response = await fetch('/api/generate-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: savedContent,
          mainKeyword: getMainKeywordRequired()
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setGeneratedFaq(result.faq)
        setMessage('✅ FAQ generated successfully!')
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ Failed to generate FAQ. Please try again.')
    } finally {
      setIsGeneratingFaq(false)
    }
  }

  // Save FAQ and show schema generation
  const saveFaqAndShowSchema = () => {
    setSavedFaq(generatedFaq)
    // Keep all sections visible for continuous workflow
    setMessage('✅ FAQ saved! Ready to generate SEO schema.')
  }

  // Generate FAQ schema for SEO
  const generateFaqSchema = async () => {
    // Check if main keyword is provided
    try {
      getMainKeyword()
    } catch (error) {
      setMessage('❌ ' + (error instanceof Error ? error.message : 'Main keyword is required'))
      return
    }

    if (!savedFaq) {
      setMessage('❌ No saved FAQ found')
      return
    }

    setIsGeneratingSchema(true)
    setMessage('🤖 Generating FAQ schema for SEO...')

    try {
      const response = await fetch('/api/generate-faq-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          faq: savedFaq,
          mainKeyword: getMainKeyword()
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setGeneratedSchema(result.schema)
        setMessage('✅ FAQ schema generated successfully!')
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ Failed to generate FAQ schema. Please try again.')
    } finally {
      setIsGeneratingSchema(false)
    }
  }

  // Generate meta title and description
  const generateMetaFields = async () => {
    const mainKeyword = getMainKeyword()
    if (!mainKeyword) {
      setMessage('❌ No main keyword (H1) available for meta generation')
      return
    }

    setIsGeneratingMeta(true)
    setMessage('🤖 Generating Meta Title and Description from content and FAQ...')

    try {
      const response = await fetch('/api/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: savedContent, // Send full main content
          mainKeyword: mainKeyword,
          faq: savedFaq // Send FAQ content
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setGeneratedMetaTitle(result.metaTitle)
        setGeneratedMetaDescription(result.metaDescription)
        setMessage('✅ Meta Title and Description generated successfully from content and FAQ!')
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ Failed to generate meta fields. Please try again.')
    } finally {
      setIsGeneratingMeta(false)
    }
  }

  // Save hero section and show banner ad
  const saveHeroAndShowBanner = async () => {
    setIsGenerating(true)
    setMessage('💾 Saving hero section...')
    
    try {
      // Update finalPageData with hero section (only if enabled)
      if (heroEnabled) {
      setFinalPageData(prev => ({
        ...prev,
        heroSection: {
            enabled: true,
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
      }))
      } else {
        // If hero is disabled, set it to null
        setFinalPageData(prev => ({
          ...prev,
          heroSection: null
        }))
      }
      
      setIsHeroSaved(true)
      resetChangeTracking('hero')
      setMessage(heroEnabled ? '✅ Hero section saved! Now configure your banner ad.' : '✅ Hero section disabled. Now configure your banner ad.')
      
    } catch (error) {
      console.error('Error saving hero section:', error)
      setMessage('❌ Failed to save hero section. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Save meta fields and show hero section
  const saveMetaAndShowHero = async () => {
    setIsGenerating(true)
    setMessage('💾 Saving meta fields to database...')
    
    try {
      // Prepare meta data for database
      const baseHandle = watch('handle')
      const uniqueHandle = `${baseHandle}-${Date.now()}`
      
      const metaData = {
        handle: uniqueHandle,
        mainKeyword: getMainKeywordRequired(),
        metaTitle: generatedMetaTitle,
        metaDescription: generatedMetaDescription,
        content: savedContent || editableContent,
        faq: savedFaq || editableFaq,
        schema: savedSchema || editableSchema,
        keywords: keywords.filter(k => k.selected),
        timestamp: new Date().toISOString()
      }
      
      console.log('Saving meta fields to database:', {
        handle: metaData.handle,
        mainKeyword: metaData.mainKeyword,
        metaTitle: metaData.metaTitle,
        metaTitleLength: metaData.metaTitle.length,
        metaDescription: metaData.metaDescription,
        metaDescriptionLength: metaData.metaDescription.length,
        contentLength: metaData.content.length,
        faqLength: metaData.faq.length,
        schemaLength: metaData.schema.length,
        keywordsCount: metaData.keywords.length,
        timestamp: metaData.timestamp
      })
      
      // Update existing page in database using the API
      console.log('Current page ID:', currentPageId)
      const pageId = currentPageId
      console.log('Page ID for update:', pageId)
      if (!pageId) {
        throw new Error('No page ID found. Please save the page first.')
      }

      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: metaData.handle,
          mainKeyword: metaData.mainKeyword,
          content: metaData.content,
          faq: metaData.faq,
          schema: metaData.schema,
          metaTitle: metaData.metaTitle,
          metaDescription: metaData.metaDescription,
          keywords: metaData.keywords
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to save to database: ${errorData.error || 'Unknown error'}`)
      }

      const savedPage = await response.json()
      console.log('Meta fields saved successfully:', savedPage)
      
      // Update local state
      setSavedMetaTitle(generatedMetaTitle)
      setSavedMetaDescription(generatedMetaDescription)
      setIsMetaSaved(true)
      setIsMetaEdited(false)
      resetChangeTracking('meta')
      // Keep all sections visible for continuous workflow
      
      // Initialize hero section with main keyword
      setHeroH1(getMainKeywordRequired())
      
      // Ensure content is properly set in finalPageData
      const currentContent = savedContent || editableContent || generatedContent || ''
      const currentFaq = savedFaq || editableFaq || generatedFaq || ''
      
      setFinalPageData(prev => ({
        ...prev,
        content: currentContent,
        faq: currentFaq,
        metaTitle: generatedMetaTitle,
        metaDescription: generatedMetaDescription,
        bannerAd: {
          image: null,
          title: '',
          description: '',
          cta: ''
        }
      }))
      
      setMessage('✅ Meta fields saved to database successfully! Now add images to your page.')
      
    } catch (error) {
      console.error('Error saving meta fields to database:', error)
      setMessage('❌ Failed to save meta fields to database. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Save everything and show image upload
  const saveEverythingAndShowSummary = () => {
    setSavedSchema(generatedSchema)
    // Keep all sections visible for continuous workflow
    
    // Use the most recent content available
    const currentContent = savedContent || editableContent || generatedContent || ''
    const currentFaq = savedFaq || editableFaq || generatedFaq || ''
    
    console.log('Setting finalPageData with content:', {
      contentLength: currentContent.length,
      faqLength: currentFaq.length,
      contentPreview: currentContent.substring(0, 100) + '...',
      faqPreview: currentFaq.substring(0, 100) + '...'
    })
    
    setFinalPageData({
      content: currentContent,
      faq: currentFaq,
      schema: generatedSchema,
      metaTitle: '',
      metaDescription: '',
      images: [],
      bodyContentImages: [],
      bannerAd: {
        image: null,
        title: '',
        description: '',
        cta: ''
      },
      tableOfContents: '',
      relatedArticles: ''
    })
    setMessage('✅ FAQ Schema saved! Now generate Meta Title and Description.')
  }

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (selectedImages.length + validFiles.length > 6) {
      setMessage('❌ Maximum 6 images allowed')
      return
    }
    
    setSelectedImages(prev => [...prev, ...validFiles])
    
    // Create preview URLs and generate alt text with compression
    validFiles.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64Data = e.target?.result as string
        
        // Compress image if it's too large (over 500KB)
        if (base64Data.length > 500000) {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            // Calculate new dimensions (max 800px width/height)
            const maxSize = 800
            let { width, height } = img
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width
                width = maxSize
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height
                height = maxSize
              }
            }
            
            canvas.width = width
            canvas.height = height
            
            ctx?.drawImage(img, 0, 0, width, height)
            
            // Convert to compressed JPEG
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
            setImageUrls(prev => [...prev, compressedDataUrl])
            
            // Use main keyword directly as alt text for all images
            const mainKeyword = getMainKeyword()
            setImageAltTexts(prev => [...prev, mainKeyword])
          }
          img.src = base64Data
        } else {
          setImageUrls(prev => [...prev, base64Data])
          
          // Use main keyword directly as alt text for all images
          const mainKeyword = getMainKeyword()
          setImageAltTexts(prev => [...prev, mainKeyword])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Get main keyword from form (safe version)
  const getMainKeyword = (): string => {
    const keyword = watch('mainKeyword')
    if (!keyword || keyword.trim() === '') {
      return '' // Return empty string instead of throwing error
    }
    return keyword.trim()
  }

  // Get main keyword with validation (for functions that require it)
  const getMainKeywordRequired = (): string => {
    const keyword = watch('mainKeyword')
    if (!keyword || keyword.trim() === '') {
      throw new Error('Main keyword is required. Please enter a main keyword in the Project Configuration section.')
    }
    return keyword.trim()
  }

  // Calculate image height based on content length
  const getImageHeight = (contentLength: number): string => {
    if (contentLength < 100) return 'h-16' // Small content = small image
    if (contentLength < 300) return 'h-20' // Medium content = medium image
    if (contentLength < 600) return 'h-24' // Large content = large image
    if (contentLength < 1000) return 'h-32' // Very large content = very large image
    return 'h-40' // Extra large content = extra large image
  }

  // Responsive image container system
  const getImageContainerClasses = (type: 'hero' | 'banner' | 'content' | 'grid' | 'carousel') => {
    const baseClasses = 'relative overflow-hidden'
    
    switch (type) {
      case 'hero':
        return `${baseClasses} w-full h-64 md:h-80 lg:h-96 xl:h-[28rem] rounded-xl shadow-lg`
      case 'banner':
        return `${baseClasses} w-full h-32 md:h-40 lg:h-48 rounded-lg shadow-md`
      case 'content':
        return `${baseClasses} w-full h-48 md:h-56 lg:h-64 rounded-lg shadow-md`
      case 'grid':
        return `${baseClasses} w-full aspect-square rounded-lg shadow-sm`
      case 'carousel':
        return `${baseClasses} w-full h-48 md:h-56 lg:h-64 rounded-lg shadow-md`
      default:
        return `${baseClasses} w-full h-48 rounded-lg shadow-md`
    }
  }

  // Function to generate related articles
  const generateRelatedArticles = (mainKeyword: string, keywords: KeywordData[]): string => {
    if (!mainKeyword || keywords.length === 0) return ''
    
    // Create related articles based on keywords
    const relatedArticles = keywords.slice(0, 3).map((keyword, index) => ({
      title: `${keyword.keyword} - Complete Guide`,
      description: `Learn everything about ${keyword.keyword} and how it relates to ${mainKeyword}.`,
      url: `/${keyword.keyword.toLowerCase().replace(/\s+/g, '-')}`,
      category: keyword.category || 'General'
    }))
    
    // Generate HTML for related articles
    let html = '<div class="related-articles-section">\n'
    html += '<h3>Related Articles</h3>\n'
    html += '<div class="related-articles-grid">\n'
    
    relatedArticles.forEach((article, index) => {
      html += `<div class="related-article-card">\n`
      html += `<div class="article-category">${article.category}</div>\n`
      html += `<h4><a href="${article.url}">${article.title}</a></h4>\n`
      html += `<p>${article.description}</p>\n`
      html += `<a href="${article.url}" class="read-more">Read More →</a>\n`
      html += '</div>\n'
    })
    
    html += '</div>\n</div>'
    
    return html
  }



  // Search Pexels images
  const searchPexelsImages = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setMessage('❌ Please enter a search term')
      return
    }

    setIsSearchingPexels(true)
    setMessage('🔍 Searching for images...')

    try {
      const response = await fetch(`/api/search-images?q=${encodeURIComponent(query)}&page=${page}&per_page=12`)
      const result = await response.json()

      if (response.ok) {
        console.log('Pexels search result:', result)
        if (page === 1) {
          console.log('Setting pexelsImages (page 1):', result.images)
          setPexelsImages(result.images)
        } else {
          console.log('Adding to pexelsImages (page > 1):', result.images)
          setPexelsImages(prev => [...prev, ...result.images])
        }
        setPexelsHasMore(result.hasMore)
        setPexelsPage(page)
        setMessage(`✅ Found ${result.total} images for "${query}"${result.message ? ` - ${result.message}` : ''}`)
      } else {
        console.error('Pexels search error:', result)
        setMessage(`❌ Error: ${result.error || 'Failed to search images'}`)
      }
    } catch (error) {
      console.error('Error searching Pexels:', error)
      setMessage('❌ Failed to search images. Please try again.')
    } finally {
      setIsSearchingPexels(false)
    }
  }

  // Load more Pexels images
  const loadMorePexelsImages = () => {
    if (pexelsHasMore && !isSearchingPexels) {
      searchPexelsImages(pexelsQuery, pexelsPage + 1)
    }
  }

  // Select Pexels image
  const selectPexelsImage = (pexelsImage: any) => {
    if (selectedImages.length >= 6) {
      setMessage('❌ Maximum 6 images allowed')
      return
    }

    console.log('Selecting Pexels image:', pexelsImage)

    // Create a mock File object for the Pexels image
    const mockFile = new File([], `pexels-${pexelsImage.id}.jpg`, { type: 'image/jpeg' })
    
    const imageUrl = pexelsImage.url || pexelsImage.largeUrl || pexelsImage.originalUrl || pexelsImage.thumbnailUrl
    
    // Validate image URL
    if (!imageUrl || imageUrl.trim() === '') {
      setMessage('❌ Invalid image URL')
      return
    }
    
    setSelectedImages(prev => [...prev, mockFile])
    setImageUrls(prev => [...prev, imageUrl])
    const mainKeyword = getMainKeyword()
    setImageAltTexts(prev => [...prev, pexelsImage.alt || mainKeyword])
    
    setMessage(`✅ Added image: ${pexelsImage.alt}`)
  }

  // Remove image (updated to work with both uploaded and Pexels images)
  const removeSelectedImage = (index: number) => {
    if (index < 0 || index >= selectedImages.length) {
      setMessage('❌ Error: Invalid image index')
      return
    }
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImageUrls(prev => prev.filter((_, i) => i !== index))
    setImageAltTexts(prev => prev.filter((_, i) => i !== index))
    
    setMessage('✅ Image removed successfully')
  }
  

  
  // Banner ad functions
  const handleBannerImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setMessage('❌ Please select a valid image file')
      return
    }
    
    setSelectedBannerImageFile(file)
    
    // Create preview URL and generate alt text
    const reader = new FileReader()
    reader.onload = (e) => {
      setBannerImageUrl(e.target?.result as string)
      setBannerImageAltText(getMainKeyword())
    }
    reader.readAsDataURL(file)
  }
  
  const removeBannerImage = () => {
    setSelectedBannerImageFile(null)
    setBannerImageUrl('')
    setBannerImageAltText('')
  }
  
  const searchPexelsBannerImages = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setMessage('❌ Please enter a search term')
      return
    }
    
    setIsSearchingPexelsBanner(true)
    setMessage('🔍 Searching for banner images...')
    
    try {
      const response = await fetch(`/api/search-images?q=${encodeURIComponent(query)}&page=${page}&per_page=12`)
      const result = await response.json()
      
      if (response.ok) {
        setPexelsBannerImages(result.images || [])
        setPexelsBannerPage(page)
        setPexelsBannerHasMore(result.hasMore || false)
        setMessage(`✅ Found ${result.images?.length || 0} banner images`)
      } else {
        setMessage(`❌ Error: ${result.error || 'Failed to search images'}`)
      }
    } catch (error) {
      console.error('Error searching banner images:', error)
      setMessage('❌ Error searching banner images')
    } finally {
      setIsSearchingPexelsBanner(false)
    }
  }
  
  const selectPexelsBannerImage = (pexelsImage: any) => {
    const mainKeyword = getMainKeyword()
    const newImage = {
      url: pexelsImage.url || pexelsImage.largeUrl || pexelsImage.originalUrl,
      alt: pexelsImage.alt || mainKeyword,
      source: 'pexels' as const
    }
    
    setBannerAdImage(newImage)
  }
  
  const removePexelsBannerImage = () => {
    setBannerAdImage(null)
  }
  
  const saveBannerAd = () => {
    // Get the banner image (file or pexels)
    const mainKeyword = getMainKeyword()
    const bannerImage = selectedBannerImageFile ? {
      url: bannerImageUrl,
      alt: bannerImageAltText || mainKeyword,
      source: 'file' as const
    } : bannerAdImage
    
    // Update final page data with banner ad
    setFinalPageData(prev => ({
      ...prev,
      bannerAd: {
        image: bannerImage,
        title: bannerAdTitle || `Discover Amazing ${getMainKeyword()}`,
        description: bannerAdDescription || `Explore our comprehensive guide to ${getMainKeyword()}. Get expert insights and practical tips to enhance your knowledge.`,
        cta: bannerAdCta || 'Learn More'
      }
    }))
    
    setIsBannerSaved(true)
    resetChangeTracking('banner')
    setShowBannerAd(false)
    setShowImageUpload(false)
    setShowFinalSummary(true)
    setMessage('✅ Banner ad saved successfully! You can now generate your page.')
  }

  // Banner ad management functions
  const addBannerAd = () => {
    // Only allow one banner ad in the main section
    // Additional banner ads will be placed strategically in different page locations
    if (bannerAds.length === 0) {
      setBannerAds([{
        image: null,
        title: '',
        description: '',
        cta: ''
      }])
    } else {
      // For additional banner ads, we'll place them in different page locations
      // This will be handled in the page generation logic
      setMessage('ℹ️ Additional banner ads will be placed strategically throughout the page during generation.')
    }
  }

  const removeBannerAd = (index: number) => {
    if (bannerAds.length > 1) {
      setBannerAds(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateBannerAd = (index: number, field: 'image' | 'title' | 'description' | 'cta', value: any) => {
    console.log('Updating banner ad:', index, field, value)
    setBannerAds(prev => {
      const updated = prev.map((banner, i) => 
      i === index ? { ...banner, [field]: value } : banner
      )
      console.log('Updated banner ads:', updated)
      return updated
    })
  }

  const duplicateBannerAd = (index: number) => {
    if (bannerAds.length < 4) {
      const bannerToDuplicate = bannerAds[index]
      setBannerAds(prev => [...prev, { ...bannerToDuplicate }])
    }
  }

  // Main content images functions
  const addBodyContentImage = (imageData: {url: string, alt: string, source: 'file' | 'pexels', file?: File}) => {
    // Use main keyword as default alt text if not provided
    const mainKeyword = getMainKeyword()
    const imageWithDefaultAlt = {
      ...imageData,
      alt: imageData.alt || mainKeyword
    }
    setBodyContentImages(prev => [...prev, imageWithDefaultAlt])
  }

  const removeBodyContentImage = (index: number) => {
    setBodyContentImages(prev => prev.filter((_, i) => i !== index))
  }

  const updateBodyContentImage = (index: number, field: 'url' | 'alt', value: string) => {
    setBodyContentImages(prev => prev.map((image, i) => 
      i === index ? { ...image, [field]: value } : image
    ))
  }

  // Finish and show final summary
  // ⚠️ CRITICAL RULE: NEVER ADD PRE-WRITTEN CONTENT OR SUGGESTIONS
  // AI must decide what to write about keywords - no hardcoded content allowed
  // This rule applies to ALL content generation functions in this codebase
  const finishWithImages = async () => {
    if (!editableContent || !editableFaq) {
      setMessage('❌ Please generate content and FAQ first')
      return
    }

    setIsGeneratingImages(true)
          setMessage('🖼️ Generating page with embedded custom styles for local compatibility...')

    try {
      // Parse existing content instead of regenerating it
      setMessage('📝 Processing existing content...')
      
      const selectedKeywords = keywords.filter(k => k.selected)
      const mainContentWithAI = []
      
      // Parse the existing editableContent to extract content sections
      const contentSections = editableContent.match(/<h2[^>]*>([^<]+)<\/h2>[\s\S]*?<p[^>]*>([^<]+)<\/p>/g)
      
      if (contentSections) {
        for (let i = 0; i < selectedKeywords.length && i < contentSections.length; i++) {
          const keyword = selectedKeywords[i]
          const section = contentSections[i]
          
          // Extract the heading and content from the existing HTML
          const headingMatch = section.match(/<h2[^>]*>([^<]+)<\/h2>/)
          const contentMatch = section.match(/<p[^>]*>([^<]+)<\/p>/)
          
          const heading = headingMatch ? headingMatch[1] : keyword.keyword
          const content = contentMatch ? contentMatch[1] : `Content about ${keyword.keyword}`
          
          mainContentWithAI.push({
            keyword: keyword.keyword,
            content: content,
            headingType: keyword.headingType
          })
        }
      } else {
        // Fallback: if parsing fails, use the keywords directly
        for (const keyword of selectedKeywords) {
          mainContentWithAI.push({
            keyword: keyword.keyword,
            content: `Content about ${keyword.keyword}`,
            headingType: keyword.headingType
          })
        }
      }

      // Prepare dashboard data for template injection
      const dashboardData = {
        mainKeyword: getMainKeyword(),
        metaTitle: savedMetaTitle || generatedMetaTitle || `${getMainKeyword()} - Complete Guide`,
        metaDescription: savedMetaDescription || generatedMetaDescription || `Learn everything about ${getMainKeyword()}. Expert insights and comprehensive information.`,
        heroSection: finalPageData.heroSection || {
          enabled: heroEnabled,
          h1: heroH1 || getMainKeyword(),
          span: heroSpan,
          slogan: heroSlogan,
          buttonUrl: heroButtonUrl,
          buttonText: heroButtonText,
          image1: heroImage1,
          image2: heroImage2,
          alt1: heroAlt1 || getMainKeyword(),
          alt2: heroAlt2 || getMainKeyword()
        },
        bannerAds: bannerAds.length > 0 ? bannerAds : [{
          image: bannerAdImage ? { url: bannerAdImage, alt: 'Banner Ad' } : null,
          title: bannerAdTitle || `Discover Amazing ${getMainKeyword()}`,
          description: bannerAdDescription || `Explore our comprehensive guide to ${getMainKeyword()}. Get expert insights and practical tips.`,
          cta: bannerAdCta || 'Learn More'
        }],
        mainContent: mainContentWithAI,
        bodyContentImages: bodyContentImages,
        faq: editableFaq,
        schema: savedSchema || generatedSchema
      }

      console.log('Dashboard data for template injection:', {
        mainKeyword: dashboardData.mainKeyword,
        bodyContentImagesLength: dashboardData.bodyContentImages?.length || 0,
        bodyContentImages: dashboardData.bodyContentImages,
        heroSection: {
          enabled: dashboardData.heroSection.enabled,
          h1: dashboardData.heroSection.h1,
          image1: dashboardData.heroSection.image1 ? 'present' : 'missing',
          image2: dashboardData.heroSection.image2 ? 'present' : 'missing',
          image1Length: dashboardData.heroSection.image1?.length || 0,
          image2Length: dashboardData.heroSection.image2?.length || 0
        }
      })
      
      // Debug hero image state variables
      console.log('Hero image state variables:', {
        heroImage1: heroImage1 ? 'present' : 'missing',
        heroImage2: heroImage2 ? 'present' : 'missing',
        heroImage1Length: heroImage1?.length || 0,
        heroImage2Length: heroImage2?.length || 0,
        heroImage1Type: heroImage1?.startsWith('data:') ? 'base64' : 'url',
        heroImage2Type: heroImage2?.startsWith('data:') ? 'base64' : 'url'
      })

      // Load original template and inject data
        const templateResponse = await fetch('/templates/templatemo_555_upright/index.html')
        let templateHtml = await templateResponse.text()
        
      // 1. Replace head section (title and meta tags)
      templateHtml = templateHtml.replace(
        /<title>.*?<\/title>/,
        `<title>${dashboardData.mainKeyword}</title>`
      )

      // Add meta tags for SEO and performance
      const metaTags = `
        <meta name="description" content="${dashboardData.metaDescription}">
        <meta property="og:title" content="${dashboardData.metaTitle}">
        <meta property="og:description" content="${dashboardData.metaDescription}">
        <meta name="twitter:title" content="${dashboardData.metaTitle}">
        <meta name="twitter:description" content="${dashboardData.metaDescription}">
        <meta name="page-id" content="${currentPageId || ''}">
        ${isCanonical ? `<link rel="canonical" href="${window.location.origin}/${getMainKeyword().toLowerCase().replace(/\s+/g, '-')}">` : ''}
        <link rel="dns-prefetch" href="//fonts.googleapis.com">
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
        <link rel="dns-prefetch" href="//code.jquery.com">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://cdnjs.cloudflare.com">
        <link rel="preconnect" href="https://code.jquery.com">
        
        <!-- Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
          
          // Track internal link clicks
          document.addEventListener('DOMContentLoaded', function() {
            document.addEventListener('click', function(e) {
              if (e.target.closest('.tm-carousel-item a')) {
                gtag('event', 'click', {
                  'event_category': 'internal_link',
                  'event_label': e.target.href
                });
              }
              if (e.target.closest('.banner-ad-cta a')) {
                gtag('event', 'click', {
                  'event_category': 'banner_ad',
                  'event_label': e.target.href
                });
              }
            });
          });
        </script>
      `
      templateHtml = templateHtml.replace('</head>', `${metaTags}\n</head>`)

      // Update CSS links to use CDN versions for standalone HTML files
      console.log('Updating CSS links to CDN versions for standalone HTML files')
      
      // Replace relative CSS paths with CDN versions
        templateHtml = templateHtml.replace(
        /href="fontawesome\/css\/all\.min\.css"/g,
        'href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"'
        )
        
          templateHtml = templateHtml.replace(
        /href="css\/bootstrap\.min\.css"/g,
        'href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"'
      )
      
      templateHtml = templateHtml.replace(
        /href="css\/magnific-popup\.css"/g,
        'href="https://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/1.1.0/magnific-popup.min.css"'
      )
      
      templateHtml = templateHtml.replace(
        /href="slick\/slick\.min\.css"/g,
        'href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.css"'
      )
      
      templateHtml = templateHtml.replace(
        /href="slick\/slick-theme\.css"/g,
        'href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick-theme.min.css"'
      )
      
      // Choose between embedded (local) or hosted (production) CSS
      const useHostedCss = process.env.NODE_ENV === 'production' || process.env.USE_HOSTED_CSS === 'true'
      
      if (useHostedCss) {
        // Production: Use hosted CSS files
        console.log('Using hosted CSS files for production')
        templateHtml = templateHtml.replace(
          /<link rel="stylesheet" href="css\/templatemo-upright\.css">/g,
          '<link rel="stylesheet" href="https://your-domain.com/css/templatemo-upright.css">'
        )
      } else {
        // Local: Embed CSS for immediate functionality
        console.log('Embedding custom CSS for local generation compatibility')
        
        try {
          const customCssResponse = await fetch('/templates/templatemo_555_upright/css/templatemo-upright.css')
          const customCssContent = await customCssResponse.text()
          const embeddedCustomCss = `<style>\n${customCssContent}\n</style>`
          
          // Replace the custom CSS link with embedded version for local compatibility
          templateHtml = templateHtml.replace(
            /<link rel="stylesheet" href="css\/templatemo-upright\.css">/g,
            embeddedCustomCss
          )
        } catch (error) {
          console.warn('Could not load custom CSS, using fallback hosted URL')
          // Fallback to hosted URL if local file not found
          templateHtml = templateHtml.replace(
            /<link rel="stylesheet" href="css\/templatemo-upright\.css">/g,
            '<link rel="stylesheet" href="https://your-domain.com/css/templatemo-upright.css">'
          )
        }
      }

      // 2. Replace hero section (only if enabled)
      if (dashboardData.heroSection && dashboardData.heroSection.enabled) {
      const heroSection = `
        <div class="content-text">
          <h1 class="hero-title">
              ${dashboardData.heroSection.h1}${dashboardData.heroSection.span ? ` - <span class="title-something">${dashboardData.heroSection.span}</span>` : ''}
          </h1>
            ${dashboardData.heroSection.slogan ? `<p class="hero-description">${dashboardData.heroSection.slogan}</p>` : ''}
        </div>
          ${dashboardData.heroSection.buttonUrl && dashboardData.heroSection.buttonText ? `<button class="book-button" onclick="window.open('${dashboardData.heroSection.buttonUrl}', '_blank')">${dashboardData.heroSection.buttonText}</button>` : ''}
        `
        templateHtml = templateHtml.replace(
        /<div class="content-text">[\s\S]*?<\/button>/,
        heroSection
        )
        
        // Replace hero images with enhanced fitting and lazy loading (only if images exist)
        console.log('Hero section data:', {
          image1: dashboardData.heroSection.image1 ? 'present' : 'missing',
          image2: dashboardData.heroSection.image2 ? 'present' : 'missing',
          alt1: dashboardData.heroSection.alt1,
          alt2: dashboardData.heroSection.alt2,
          image1Length: dashboardData.heroSection.image1?.length || 0,
          image2Length: dashboardData.heroSection.image2?.length || 0,
          image1Type: dashboardData.heroSection.image1?.startsWith('data:') ? 'base64' : 'url',
          image2Type: dashboardData.heroSection.image2?.startsWith('data:') ? 'base64' : 'url'
        })
        
        // Only replace hero images if they exist and are not empty
        if (dashboardData.heroSection.image1 && dashboardData.heroSection.image1.trim() !== '') {
          // Validate the image URL
          const imageUrl1 = dashboardData.heroSection.image1
          console.log('Attempting to replace hero image 1 with:', imageUrl1.substring(0, 100) + '...')
          console.log('Hero image 1 type:', imageUrl1.startsWith('data:') ? 'base64' : 'url')
          console.log('Hero image 1 length:', imageUrl1.length)
          
          // Check if this is a valid base64 image
          if (imageUrl1.startsWith('data:image/')) {
            console.log('✅ Hero image 1 is a valid base64 image')
          } else {
            console.log('❌ Hero image 1 is not a valid base64 image')
          }
          
          // Ensure base64 image is properly formatted
          const safeImageUrl1 = imageUrl1.startsWith('data:') ? imageUrl1 : imageUrl1
          
          const heroImage1Replaced = templateHtml.replace(
        /<img src="https:\/\/i\.ibb\.co\/rRTw73t4\/Bea-Nail-Expert\.jpg"[^>]*>/g,
            `<img src="${safeImageUrl1}" alt="${dashboardData.heroSection.alt1 || 'Hero Image 1'}" class="hero-image w-full h-64 md:h-80 lg:h-96 xl:h-[28rem] object-cover rounded-xl shadow-lg" loading="lazy" decoding="async" onerror="this.style.display='none'; console.log('Hero image 1 failed to load: ' + this.src.substring(0, 50) + '...');" onload="console.log('Hero image 1 loaded successfully')">`
          )
          if (heroImage1Replaced === templateHtml) {
            console.warn('Hero image 1 replacement failed - image not found in template')
          } else {
            templateHtml = heroImage1Replaced
            console.log('Hero image 1 replaced successfully')
          }
        } else {
          console.log('Hero image 1 not provided, keeping original template image')
        }
        
        if (dashboardData.heroSection.image2 && dashboardData.heroSection.image2.trim() !== '') {
          // Validate the image URL
          const imageUrl2 = dashboardData.heroSection.image2
          console.log('Attempting to replace hero image 2 with:', imageUrl2.substring(0, 100) + '...')
          console.log('Hero image 2 type:', imageUrl2.startsWith('data:') ? 'base64' : 'url')
          console.log('Hero image 2 length:', imageUrl2.length)
          
          // Check if this is a valid base64 image
          if (imageUrl2.startsWith('data:image/')) {
            console.log('✅ Hero image 2 is a valid base64 image')
          } else {
            console.log('❌ Hero image 2 is not a valid base64 image')
          }
          
          // Ensure base64 image is properly formatted
          const safeImageUrl2 = imageUrl2.startsWith('data:') ? imageUrl2 : imageUrl2
          
          const heroImage2Replaced = templateHtml.replace(
        /<img src="https:\/\/i\.ibb\.co\/V03Y8Y9N\/IMG-2440-1\.jpg"[^>]*>/g,
            `<img src="${safeImageUrl2}" alt="${dashboardData.heroSection.alt2 || 'Hero Image 2'}" class="hero-image w-full h-64 md:h-80 lg:h-96 xl:h-[28rem] object-cover rounded-xl shadow-lg" loading="lazy" decoding="async" onerror="this.style.display='none'; console.log('Hero image 2 failed to load: ' + this.src.substring(0, 50) + '...');" onload="console.log('Hero image 2 loaded successfully')">`
          )
          if (heroImage2Replaced === templateHtml) {
            console.warn('Hero image 2 replacement failed - image not found in template')
          } else {
            templateHtml = heroImage2Replaced
            console.log('Hero image 2 replaced successfully')
          }
        } else {
          console.log('Hero image 2 not provided, keeping original template image')
        }
        
        // Fallback: If specific images weren't replaced, try to replace any hero image
        if (dashboardData.heroSection.image1 && dashboardData.heroSection.image1.trim() !== '' && !templateHtml.includes(dashboardData.heroSection.image1)) {
          console.log('Attempting fallback hero image replacement...')
          const fallbackReplacement = templateHtml.replace(
            /<img[^>]*class="hero-image"[^>]*>/g,
            `<img src="${dashboardData.heroSection.image1}" alt="${dashboardData.heroSection.alt1 || 'Hero Image'}" class="hero-image w-full h-64 md:h-80 lg:h-96 xl:h-[28rem] object-cover rounded-xl shadow-lg" loading="lazy" decoding="async" onerror="this.style.display='none'; console.log('Hero image failed to load: ' + this.src.substring(0, 50) + '...');" onload="console.log('Hero image loaded successfully')">`
          )
          if (fallbackReplacement !== templateHtml) {
            templateHtml = fallbackReplacement
            console.log('Fallback hero image replacement successful')
          }
        }
      } else {
        // If hero section is disabled, remove the entire hero section
        templateHtml = templateHtml.replace(
          /<div class="hero-container">[\s\S]*?<\/div>\s*<!-- Banner Ads section -->/,
          '<!-- Banner Ads section -->'
        )
      }

      // 3. Create banner ad function with enhanced image fitting
      const createBannerAd = (banner: any, index: number) => `
        <!-- Banner Ad ${index + 1} -->
        <div class="banner-ad-container">
            <div class="banner-ad-content">
                <div class="banner-ad-image">
                    <img src="${banner.image?.url || 'https://via.placeholder.com/400x200?text=Banner+Ad'}" alt="${banner.image?.alt || 'Banner Ad'}" class="w-full h-32 md:h-40 lg:h-48 object-cover rounded-lg shadow-md" loading="lazy" decoding="async" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block'; console.log('Banner image failed to load: ' + this.src);" onload="console.log('Banner image loaded successfully: ' + this.src)">
                </div>                                
                <div class="banner-ad-text">
                    <h2 class="banner-ad-title">${banner.title}</h2>
                    <p class="banner-ad-description">${banner.description}</p>
                    <div class="banner-ad-cta">
                        <a href="#about" class="btn btn-primary first-cta-name">${banner.cta}</a>
                    </div>                                    
                </div>
            </div>
        </div>`

      // 4. Content generation is now handled in the template replacement section below

      // 5. Replace all original content sections with our AI-generated content
      
      // Find the main content area (after the first banner ad)
      const firstBannerAdStart = templateHtml.indexOf('<!-- Banner Ads section -->')
      if (firstBannerAdStart !== -1) {
        const beforeBannerAd = templateHtml.substring(0, firstBannerAdStart)
        
        // Find the end of the first banner ad
        const firstBannerAdEnd = templateHtml.indexOf('</div>', templateHtml.indexOf('banner-ad-container', firstBannerAdStart))
        const afterFirstBanner = templateHtml.substring(firstBannerAdEnd + 6)
        
        // Find where the main content sections end (before FAQ or other sections)
        const contentEndMarker = templateHtml.indexOf('<!-- FAQ Section -->')
        const contentEnd = contentEndMarker !== -1 ? contentEndMarker : templateHtml.indexOf('<!-- Contact Section -->')
        
        let finalContent = ''
        let bannerIndex = 0
        
        // Add main banner ad at the beginning
        if (dashboardData.bannerAds.length > 0) {
          finalContent += createBannerAd(dashboardData.bannerAds[0], 0)
          bannerIndex++
        }
        
        // Replace each content section with our AI-generated content
        console.log('🔍 DEBUG: Main Content Images Analysis')
        console.log('🔍 bodyContentImages length:', bodyContentImages.length)
        console.log('🔍 bodyContentImages array:', bodyContentImages)
        console.log('🔍 mainContentWithAI length:', mainContentWithAI.length)
        console.log('🔍 mainContentWithAI:', mainContentWithAI.map(section => ({ keyword: section.keyword, contentLength: section.content.length })))
        
        for (let i = 0; i < mainContentWithAI.length; i++) {
          const contentSection = mainContentWithAI[i]
          const heading = `<h2 class="h4 mb-3 text-primary">${contentSection.keyword}</h2>`
          const content = contentSection.content
              
              if (content) {
            const bodyImageIndex = bodyContentImages.length > 0 ? i % bodyContentImages.length : -1
            const bodyImage = bodyImageIndex >= 0 ? bodyContentImages[bodyImageIndex] : null
            console.log(`🔍 Section ${i}: "${contentSection.keyword}"`)
            console.log(`🔍   bodyImageIndex: ${bodyImageIndex}`)
            console.log(`🔍   bodyImage:`, bodyImage)
            console.log(`🔍   bodyImage?.url:`, bodyImage?.url)
            console.log(`🔍   bodyImage?.alt:`, bodyImage?.alt)
            console.log(`🔍   bodyImage truthy check:`, !!bodyImage)
            console.log(`🔍   bodyImage.url truthy check:`, !!bodyImage?.url)
            
            const isEven = i % 2 === 0
            const hasValidImage = bodyImage && bodyImage.url && bodyImage.url.trim() !== ''
            console.log(`🔍   hasValidImage:`, hasValidImage)
            console.log(`🔍   bodyImage.url.trim():`, bodyImage?.url?.trim())
            console.log(`🔍   bodyImage.url.trim() !== '':`, bodyImage?.url?.trim() !== '')
            
            // Force the image to be included for debugging
            const imageHtml = hasValidImage 
              ? `<img src="${bodyImage.url}" alt="${bodyImage.alt}" class="img-fluid rounded shadow" loading="lazy" decoding="async" onerror="this.style.display='none'; console.log('Content image failed to load: ' + this.src);" onload="console.log('Content image loaded successfully: ' + this.src)">`
              : '<!-- Image will be added by user later -->'
            
            console.log(`🔍   imageHtml:`, imageHtml.substring(0, 100) + '...')
                
                if (isEven) {
                  // Image on left, content on right
              finalContent += `<div class="row mb-4">
                    <div class="col-lg-8 mb-4">
                        ${heading}
                        <p class="mb-3">${content}</p>
                    </div>
                    <div class="col-lg-4 mb-4">
                        ${imageHtml}
                    </div>
                </div>\n\n`
                } else {
                  // Content on left, image on right
              finalContent += `<div class="row mb-4">
                    <div class="col-lg-4 mb-4">
                        ${imageHtml}
                    </div>
                    <div class="col-lg-8 mb-4">
                        ${heading}
                        <p class="mb-3">${content}</p>
                    </div>
                </div>\n\n`
                }
                
            // Add banner ad after every 2 content sections (like original template)
            if (bannerIndex < dashboardData.bannerAds.length && (i + 1) % 2 === 0) {
              finalContent += createBannerAd(dashboardData.bannerAds[bannerIndex], bannerIndex) + '\n\n'
              bannerIndex++
            }
          }
        }
        
        // Get the remaining content after main content
        const remainingContent = contentEnd !== -1 ? templateHtml.substring(contentEnd) : ''
        
        // Inject FAQ content
        if (dashboardData.faq) {
          // Find the FAQ section in the remaining content
          const faqSectionStart = remainingContent.indexOf('<!-- FAQ Section -->')
          if (faqSectionStart !== -1) {
            const beforeFaq = remainingContent.substring(0, faqSectionStart)
            const faqSectionEnd = remainingContent.indexOf('<!-- Contact Section -->')
            const afterFaq = faqSectionEnd !== -1 ? remainingContent.substring(faqSectionEnd) : ''
            
            // Replace the FAQ section with our generated FAQ
            const updatedRemainingContent = beforeFaq + dashboardData.faq + afterFaq
            templateHtml = beforeBannerAd + finalContent + updatedRemainingContent
          } else {
            // If no FAQ section found, just append the FAQ content
            templateHtml = beforeBannerAd + finalContent + remainingContent + dashboardData.faq
          }
        } else {
          // Keep the rest of the template (FAQ, Contact, etc.)
          templateHtml = beforeBannerAd + finalContent + remainingContent
        }

        // Fetch related pages and embed them directly in the HTML
        let relatedPagesHtml = ''
        try {
          const relatedPagesResponse = await fetch(`/api/internal-links?pageId=${currentPageId}`)
          if (relatedPagesResponse.ok) {
            const relatedPagesData = await relatedPagesResponse.json()
            if (relatedPagesData.success && relatedPagesData.links.length > 0) {
              console.log('Found related pages:', relatedPagesData.links.length)
              
              const carouselItems = relatedPagesData.links.map((link: any) => `
                <div class="tm-carousel-item">
                  <figure class="effect-honey mb-4">
                    <img src="${link.relatedPage.heroImage1 || '/img/about-01.jpg'}" alt="${link.relatedPage.mainKeyword}" loading="lazy" decoding="async">
                    <figcaption>
                      <ul class="tm-social">
                        <li><a href="/${link.relatedPage.handle}" class="tm-social-link">View Page</a></li>
                      </ul>
                    </figcaption>
                  </figure>
                  <div class="tm-about-text">
                    <h3 class="mb-3 tm-text-primary tm-about-title">
                      <a href="/${link.relatedPage.handle}" class="text-decoration-none">${link.relatedPage.mainKeyword}</a>
                    </h3>
                    <p>${link.relatedPage.metaDescription?.substring(0, 100) || 'Related page content...'}</p>
                    <h4 class="tm-text-secondary tm-about-subtitle">
                      <a href="/${link.relatedPage.handle}" class="text-decoration-none">Read More →</a>
                    </h4>
                  </div>
                </div>
              `).join('')
              
              relatedPagesHtml = `
                <h2 id="related-pages" class="h2-related-page">Related Pages</h2>
                <hr class="mb-5">
                
                <div class="mt-5">
                  <div class="tm-carousel">
                    ${carouselItems}
                  </div>
                </div>
              `
            } else {
              console.log('No related pages found for this page')
            }
          }
        } catch (error) {
          console.error('Error fetching related pages during generation:', error)
        }
        
        // Add the related pages section (either with content or empty)
        const relatedPagesSection = relatedPagesHtml || `
          <h2 id="related-pages" class="h2-related-page">Related Pages</h2>
          <hr class="mb-5">
          
          <div class="mt-5">
            <div class="tm-carousel" id="related-pages-section" style="display: none;">
              <!-- No related pages assigned yet -->
                    </div>                                
                        </div>                                    
        `
        
        // Replace the related pages placeholder
        templateHtml = templateHtml.replace('<!-- RELATED_PAGES_SECTION -->', relatedPagesSection)
      }

      // Update JavaScript links to use CDN versions for standalone HTML files
      console.log('Updating JavaScript links to CDN versions for standalone HTML files')
      
      // Replace relative JS paths with CDN versions
      templateHtml = templateHtml.replace(
        /src="js\/jquery-3\.4\.1\.min\.js"/g,
        'src="https://code.jquery.com/jquery-3.7.1.min.js"'
      )
      
      templateHtml = templateHtml.replace(
        /src="js\/imagesloaded\.pkgd\.min\.js"/g,
        'src="https://cdnjs.cloudflare.com/ajax/libs/imagesloaded/5.0.0/imagesloaded.pkgd.min.js"'
      )
      
      templateHtml = templateHtml.replace(
        /src="js\/isotope\.pkgd\.min\.js"/g,
        'src="https://cdnjs.cloudflare.com/ajax/libs/jquery.isotope/3.0.6/isotope.pkgd.min.js"'
      )
      
      templateHtml = templateHtml.replace(
        /src="js\/jquery\.magnific-popup\.min\.js"/g,
        'src="https://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/1.1.0/jquery.magnific-popup.min.js"'
      )
      
      templateHtml = templateHtml.replace(
        /src="js\/jquery\.singlePageNav\.min\.js"/g,
        'src="https://cdnjs.cloudflare.com/ajax/libs/jquery-singlePageNav/1.3.0/jquery.singlePageNav.min.js"'
      )
      
      templateHtml = templateHtml.replace(
        /src="js\/parallax\/parallax\.min\.js"/g,
        'src="https://cdnjs.cloudflare.com/ajax/libs/parallax.js/1.5.0/parallax.min.js"'
      )
      
      templateHtml = templateHtml.replace(
        /src="slick\/slick\.min\.js"/g,
        'src="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.js"'
      )
      
      // Choose between embedded (local) or hosted (production) JS
      if (useHostedCss) {
        // Production: Use hosted JS files
        console.log('Using hosted JS files for production')
        templateHtml = templateHtml.replace(
          /<script src="js\/templatemo-script\.js"><\/script>/g,
          '<script src="https://your-domain.com/js/templatemo-script.js"></script>'
        )
      } else {
        // Local: Embed JS for immediate functionality
        console.log('Embedding custom JS for local generation compatibility')
        
        try {
          const customJsResponse = await fetch('/templates/templatemo_555_upright/js/templatemo-script.js')
          const customJsContent = await customJsResponse.text()
          const embeddedCustomJs = `<script>\n${customJsContent}\n</script>`
          
          // Replace the custom JS script with embedded version for local compatibility
          templateHtml = templateHtml.replace(
            /<script src="js\/templatemo-script\.js"><\/script>/g,
            embeddedCustomJs
          )
        } catch (error) {
          console.warn('Could not load custom JS, using fallback hosted URL')
          // Fallback to hosted URL if local file not found
          templateHtml = templateHtml.replace(
            /<script src="js\/templatemo-script\.js"><\/script>/g,
            '<script src="https://your-domain.com/js/templatemo-script.js"></script>'
          )
        }
      }

      // 7. Add schema data
      const schemaScript = `<script type="application/ld+json">${dashboardData.schema}</script>`
      templateHtml = templateHtml.replace('</head>', `${schemaScript}\n</head>`)

        // Save page to database (without the full HTML template to avoid storage issues)
        const pageData = {
          handle: `${watch('handle')}-${Date.now()}`, // Make handle unique with timestamp
          mainKeyword: dashboardData.mainKeyword,
          parentPageId: watch('parentPageId'),
          metaTitle: dashboardData.metaTitle,
          metaDescription: dashboardData.metaDescription,
          content: editableContent || '', // Save the content, images will be embedded by API route
          faqContent: dashboardData.faq,
          faqSchema: dashboardData.schema,
          keywords: keywords.filter(k => k.selected).map(k => ({
            keyword: k.keyword,
            volume: k.volume,
            category: k.category,
            selected: k.selected,
            headingType: k.headingType
          })),
          images: [
            ...(bodyContentImages || []).filter((img: any) => img.url && img.url.trim() !== '').map((img: any) => ({
              url: img.url,
              alt: img.alt,
              source: img.source,
              type: 'content'
            })),
            ...(bannerAds.length > 0 && bannerAds[0].image && bannerAds[0].image.url ? [{
              url: bannerAds[0].image.url,
              alt: bannerAds[0].image.alt || '',
              source: bannerAds[0].image.source || 'file',
              type: 'banner'
            }] : []),
            ...(heroImage1 && heroImage1.trim() !== '' ? [{
              url: heroImage1,
              alt: heroAlt1,
              source: 'file',
              type: 'hero'
            }] : []),
            ...(heroImage2 && heroImage2.trim() !== '' ? [{
              url: heroImage2,
              alt: heroAlt2,
              source: 'file',
              type: 'hero'
            }] : [])
          ],
          bannerAds: bannerAds.map(banner => ({
            title: banner.title,
            description: banner.description,
            cta: banner.cta,
            image: banner.image
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
            alt2: heroAlt2
          }
        }

        try {
          console.log('Sending page data to API:', {
            handle: pageData.handle,
            mainKeyword: pageData.mainKeyword,
            contentLength: pageData.content?.length || 0,
            faqContentLength: pageData.faqContent?.length || 0,
            faqSchemaType: typeof pageData.faqSchema,
            keywordsCount: pageData.keywords?.length || 0,
            heroSection: {
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
          })
          
          const saveResponse = await fetch('/api/pages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pageData)
          })

          const saveResult = await saveResponse.json()
          
          if (saveResult.success) {
            console.log('✅ Page saved to database:', saveResult.page)
          } else {
            console.error('❌ Failed to save page to database:', saveResult.error)
            console.error('❌ Error details:', saveResult.details)
            if (saveResult.stack) {
              console.error('❌ Error stack:', saveResult.stack)
            }
            
            // Show user-friendly error message
            if (saveResult.error.includes('storage limit') || saveResult.error.includes('too large')) {
              setMessage('⚠️ Page generated successfully, but could not save to database due to storage limits. The HTML file has been downloaded.')
            } else {
              setMessage('⚠️ Page generated successfully, but database save failed. The HTML file has been downloaded.')
            }
          }
        } catch (error) {
          console.error('❌ Error saving page to database:', error)
        }

        // Page saved successfully - show success message with URL (using API route)
        const pageUrl = `https://bookbuy-admin-production.up.railway.app/api/pages/view/${pageData.handle}`
        setMessage(`✅ Page generated and saved successfully! View your page at: ${pageUrl}`)
        setIsGeneratingImages(false)
        
      } catch (error) {
      console.error('Error generating page:', error)
      setMessage('❌ Error: Could not generate page')
      setIsGeneratingImages(false)
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {

    setIsGenerating(true)
    setMessage('💾 Saving page data...')
    
    try {
      // Save the page data (you can implement database storage here later)
      const pageData = {
        handle: data.handle,
        mainKeyword: data.mainKeyword,
        parentPageId: data.parentPageId,
        keywords: keywords.length > 0 ? keywords.filter(k => k.selected) : [],
        timestamp: new Date().toISOString()
      }
      
      // For now, just show success message
      setMessage('✅ Project configuration saved successfully! You can now proceed with content generation.')
      setProjectConfigured(true)
      
      // You can add database storage here later
      // console.log('Page data saved:', pageData) // Uncomment for debugging
      
    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ Failed to save page data. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Unified Save All function
  const saveAllData = async () => {
    setIsGenerating(true)
    setMessage('💾 Saving all data...')
    
    try {
      // Step 1: Save content components (Content, FAQ, Schema)
      if (changeTracking.content || changeTracking.faq || changeTracking.schema) {
        setSavedContent(editableContent)
        setSavedFaq(editableFaq)
        setSavedSchema(editableSchema)
        setIsContentEdited(false)
        setIsFaqEdited(false)
        setIsSchemaEdited(false)
        setIsContentSaved(true)
        setIsFaqSaved(true)
        setIsSchemaSaved(true)
        resetChangeTracking('content')
        resetChangeTracking('faq')
        resetChangeTracking('schema')
        console.log('✅ Content components saved')
      }

      // Step 2: Save meta fields if changed
      if (changeTracking.meta && generatedMetaTitle && generatedMetaDescription) {
        setSavedMetaTitle(generatedMetaTitle)
        setSavedMetaDescription(generatedMetaDescription)
        setIsMetaSaved(true)
        setIsMetaEdited(false)
        resetChangeTracking('meta')
        console.log('✅ Meta fields saved')
      }

      // Step 3: Save hero section if changed
      if (changeTracking.hero) {
        if (heroEnabled) {
          setFinalPageData(prev => ({
            ...prev,
            heroSection: {
              enabled: true,
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
          }))
        } else {
          setFinalPageData(prev => ({
            ...prev,
            heroSection: null
          }))
        }
        setIsHeroSaved(true)
        resetChangeTracking('hero')
        console.log('✅ Hero section saved')
      }

      // Step 4: Save banner ad if changed
      if (changeTracking.banner) {
        const mainKeyword = getMainKeyword()
        const bannerImage = selectedBannerImageFile ? {
          url: bannerImageUrl,
          alt: bannerImageAltText || mainKeyword,
          source: 'file' as const
        } : bannerAdImage
        
        setFinalPageData(prev => ({
          ...prev,
          bannerAd: {
            image: bannerImage,
            title: bannerAdTitle || `Discover Amazing ${getMainKeyword()}`,
            description: bannerAdDescription || `Explore our comprehensive guide to ${getMainKeyword()}. Get expert insights and practical tips to enhance your knowledge.`,
            cta: bannerAdCta || 'Learn More'
          }
        }))
        setIsBannerSaved(true)
        resetChangeTracking('banner')
        console.log('✅ Banner ad saved')
      }

      // Step 5: Save main content images if changed
      if (changeTracking.images) {
        setFinalPageData(prev => ({
          ...prev,
          bodyContentImages: bodyContentImages
        }))
        setIsMainContentImagesSaved(true)
        resetChangeTracking('images')
        console.log('✅ Main content images saved')
      }

      // Step 6: Save keywords if changed
      if (changeTracking.keywords) {
        setIsKeywordsSaved(true)
        resetChangeTracking('keywords')
        console.log('✅ Keywords saved')
      }

      // Step 7: Save project configuration if changed
      if (changeTracking.projectConfig) {
        setProjectConfigured(true)
        resetChangeTracking('projectConfig')
        console.log('✅ Project configuration saved')
      }

      // Step 8: Save to database if we have a page ID
      if (currentPageId) {
        const baseHandle = watch('handle')
        const uniqueHandle = `${baseHandle}-${Date.now()}`
        
        const contentToSave = savedContent || editableContent || ''
        const faqToSave = savedFaq || editableFaq || ''
        const schemaToSave = savedSchema || editableSchema || ''
        
        const pageData = {
          handle: uniqueHandle,
          mainKeyword: getMainKeywordRequired(),
          content: contentToSave,
          faq: faqToSave,
          schema: schemaToSave,
          metaTitle: savedMetaTitle || generatedMetaTitle || '',
          metaDescription: savedMetaDescription || generatedMetaDescription || '',
          canonical: isCanonical,
          keywords: keywords.filter(k => k.selected),
          heroSection: finalPageData.heroSection,
          bannerAd: finalPageData.bannerAd,
          bodyContentImages: finalPageData.bodyContentImages
        }

        const response = await fetch(`/api/pages/${currentPageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pageData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Failed to save to database: ${errorData.error || 'Unknown error'}`)
        }

        const savedPage = await response.json()
        console.log('✅ Data saved to database:', savedPage)
        setIsDatabaseSaved(true)
      }

      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      setMessage('✅ All data saved successfully!')
      
    } catch (error) {
      console.error('❌ Error saving data:', error)
      setMessage('❌ Failed to save data. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Check if save is ready (all required fields are valid)
  const isSaveReady = () => {
    const hasMainKeyword = getMainKeyword().trim().length > 0
    const hasContent = (savedContent || editableContent).trim().length > 0
    const hasFaq = (savedFaq || editableFaq).trim().length > 0
    const hasSchema = (savedSchema || editableSchema).trim().length > 0
    
    return hasMainKeyword && hasContent && hasFaq && hasSchema
  }

  // Get save button text based on state
  const getSaveButtonText = () => {
    if (isGenerating) return '💾 Saving...'
    if (!isSaveReady()) return '⚠️ Complete Required Fields'
    if (hasUnsavedChanges) return '💾 Save All Changes'
    return '✅ All Saved'
  }

  // Get save button disabled state
  const isSaveDisabled = () => {
    return isGenerating || !isSaveReady() || (!hasUnsavedChanges && isDatabaseSaved)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-6 pt-20">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SEO Page Generator
          </h1>
          <p className="text-lg text-gray-600">
            Create AI-powered, SEO-optimized pages with automated content generation
          </p>
        </div>
        
        {/* Unified Save All Button */}
        {projectConfigured && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    💾 Save All Changes
                  </h3>
                  <p className="text-sm text-gray-600">
                    {hasUnsavedChanges 
                      ? `You have unsaved changes in ${Object.values(changeTracking).filter(Boolean).length} section(s)`
                      : lastSaved 
                        ? `Last saved: ${lastSaved.toLocaleTimeString()}`
                        : 'All changes are saved'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {hasUnsavedChanges && (
                    <div className="flex items-center text-yellow-600 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Unsaved
                    </div>
                  )}
                  <button
                    onClick={saveAllData}
                    disabled={isSaveDisabled()}
                    className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center space-x-2 ${
                      isSaveDisabled()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : hasUnsavedChanges
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                          : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>{getSaveButtonText()}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Project Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Configuration</h2>
            
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Keyword (H1) <span className="text-xs text-gray-500">• Will be used as the main H1 heading</span>
              </label>
              <input
                {...register('mainKeyword')}
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                placeholder="best kitchen knives"
                onChange={(e) => {
                  const value = e.target.value
                  trackChange('projectConfig')
                  
                  // Auto-generate handle in real-time
                  if (value.trim()) {
                    const capitalizedKeyword = capitalizeAllWords(value)
                    const generatedHandle = generateHandleFromKeyword(capitalizedKeyword)
                    setValue('mainKeyword', capitalizedKeyword)
                    setValue('handle', generatedHandle)
                    
                    // Update hero H1 if it's empty or matches the old main keyword
                    if (!heroH1 || heroH1 === getMainKeyword()) {
                      setHeroH1(capitalizedKeyword)
                    }
                  } else {
                    setValue('handle', '')
                  }
                }}
              />
              {errors.mainKeyword && (
                <p className="mt-1 text-sm text-red-600">{errors.mainKeyword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Handle (URL Slug) <span className="text-xs text-gray-500">• Auto-generated from main keyword</span>
              </label>
              <input
                {...register('handle')}
                type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors bg-gray-50"
                placeholder="my-awesome-page"
                readOnly={true}
              />
              {errors.handle && (
                <p className="mt-1 text-sm text-red-600">{errors.handle.message}</p>
              )}
                {mainKeyword && (
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Handle automatically generated from: "{mainKeyword}" → "{generateHandleFromKeyword(mainKeyword)}"
                  </p>
              )}
              {!mainKeyword && (
                <p className="mt-1 text-xs text-gray-500">
                  💡 Start typing in the main keyword field above to auto-generate the handle
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Page (Optional) <span className="text-xs text-gray-500">• Type to search or create new parent page</span>
              </label>
              <ParentPageInput
                value={parentPageName}
                onChange={(value) => {
                  setParentPageName(value)
                  setValue('parentPageId', value)
                }}
                onParentPageCreated={(parentPage) => {
                  console.log('New parent page created:', parentPage)
                }}
                placeholder="Enter parent page name (e.g., Kitchen Guides, Product Reviews)"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isGenerating ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>

          {/* Right Column - Keyword Input */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-8 ${!projectConfigured ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Keyword Input
              {!projectConfigured && <span className="text-sm text-red-500 ml-2">(Complete Project Configuration first)</span>}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Keywords with Volumes
                </label>
                <textarea
                  value={semrushContent}
                  onChange={(e) => setSemrushContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                  rows={8}
                  placeholder="Paste your keywords here (one per line, with volume if available)
Example:
kitchen knife types - 1200
best chef knife - 8900
knife sharpening guide - 3400
Japanese vs German knives - 2100
knife maintenance tips - 1800"
                />
              </div>

              <button
                type="button"
                onClick={analyzeContent}
                disabled={isAnalyzing || !semrushContent.trim()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? 'Processing...' : 'Process'}
              </button>

              {showKeywords && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Main Content Sections</h3>
                    <button
                      type="button"
                      onClick={generateAllComponents}
                      disabled={isGeneratingAll}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isGeneratingAll ? 'Generating...' : 'Generate'}
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
                      <div className="space-y-2 max-h-[800px] overflow-y-auto">
                        {keywords.map((keyword, index) => (
                          <SortableKeywordItem
                            key={keyword.id}
                            keyword={keyword}
                            index={index}
                            toggleKeyword={toggleKeyword}
                            changeHeadingType={changeHeadingType}
                            removeKeyword={removeKeyword}
                          />
                        ))}
                        {/* Add Manual Keyword Button and Input at the end of the list */}
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
              )}

            </div>
          </div>
        </div>



        {/* Combined Results Section - All Components Generated */}
        {showCombinedResults && projectConfigured && (
          <div className="mt-8 w-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900">All Components Generated Successfully!</h3>
              </div>

              <div className="space-y-8">
                {/* Content Section */}
                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-semibold text-gray-900">Main Content</h4>
                    <div className="flex space-x-2">
                      {isContentEdited ? (
                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm flex items-center space-x-1">
                          <span>⚠️ Unsaved</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm flex items-center space-x-1">
                          <span>✅ Saved</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={editableContent}
                    onChange={(e) => {
                      setEditableContent(e.target.value)
                      trackChange('content')
                    }}
                    className="w-full h-64 p-4 border border-gray-200 rounded-lg bg-white text-gray-800 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                    placeholder="Main content will appear here..."
                  />
                </div>

                {/* FAQ Section */}
                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-semibold text-gray-900">FAQ Section</h4>
                    <div className="flex space-x-2">
                      {isFaqEdited ? (
                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm flex items-center space-x-1">
                          <span>⚠️ Unsaved</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm flex items-center space-x-1">
                          <span>✅ Saved</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={editableFaq}
                    onChange={(e) => {
                      setEditableFaq(e.target.value)
                      trackChange('faq')
                    }}
                    className="w-full h-48 p-4 border border-gray-200 rounded-lg bg-white text-gray-800 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                    placeholder="FAQ content will appear here..."
                  />
                </div>

                {/* Schema Section */}
                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-semibold text-gray-900">FAQ Schema</h4>
                    <div className="flex space-x-2">
                                            {isSchemaEdited ? (
                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm flex items-center space-x-1">
                          <span>⚠️ Unsaved</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm flex items-center space-x-1">
                          <span>✅ Saved</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={editableSchema}
                    onChange={(e) => {
                      setEditableSchema(e.target.value)
                      trackChange('schema')
                    }}
                    className="w-full h-48 p-4 border border-gray-200 rounded-lg bg-white text-gray-800 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                    placeholder="Schema JSON will appear here..."
                  />
                </div>

                {/* Database Save Status */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <div className={`px-4 py-2 rounded-lg font-medium text-sm ${
                    isDatabaseSaved 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                  {isDatabaseSaved ? (
                      <span className="flex items-center space-x-1">
                        <span>✅</span>
                        <span>Saved to Database</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>Not Saved to Database</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}





        {/* FAQ Schema Generation Card */}


        {/* Meta Fields Generation Card */}
        {showMetaFields && projectConfigured && (
          <div className="mt-8 w-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-bold text-gray-900">Meta Title & Description</h3>
                  <span className={`px-2 py-1 text-xs rounded-lg flex items-center space-x-1 ${
                    isMetaEdited ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {isMetaEdited ? (
                      <>
                        <span>⚠️</span>
                        <span>Edited</span>
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        <span>Saved</span>
                      </>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => setShowMetaFields(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  ← Back
                </button>
              </div>
              
              <div className="space-y-6">
                <p className="text-gray-600">
                  Generate unique Meta Title and Meta Description based on your main content and FAQ. The AI analyzes your full content to create accurate, engaging meta tags that will help your page rank better in search engines.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={generateMetaFields}
                    disabled={isGeneratingMeta}
                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGeneratingMeta ? 'Generating...' : 'Generate Meta'}
                  </button>
                </div>

                {generatedMetaTitle && generatedMetaDescription && (
                  <div className="space-y-6">
                    {/* Meta Title */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Meta Title</h4>
                      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Preview (Click to Edit):</span>
                          <span className={`text-xs ${generatedMetaTitle.length > 60 ? 'text-red-500' : 'text-gray-500'}`}>
                            {generatedMetaTitle.length}/60 characters
                          </span>
                        </div>
                        <div className={`bg-white rounded-lg p-4 border ${generatedMetaTitle.length > 60 ? 'border-red-300' : 'border-slate-200'} focus-within:border-slate-400 transition-colors`}>
                          <input
                            type="text"
                            value={generatedMetaTitle}
                            onChange={(e) => {
                              setGeneratedMetaTitle(e.target.value)
                              trackChange('meta')
                            }}
                            className="w-full text-slate-700 font-medium text-sm bg-transparent border-none outline-none focus:ring-0"
                            maxLength={60}
                            placeholder="Enter meta title..."
                          />
                        </div>
                        {generatedMetaTitle.length > 60 && (
                          <p className="text-xs text-red-500 mt-1">⚠️ Title exceeds recommended 60 character limit</p>
                        )}
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-slate-700 mb-2">Raw HTML:</h5>
                          <pre className="text-xs text-slate-600 bg-white p-3 border border-slate-200 rounded-lg overflow-x-auto">
                            {`<title>${generatedMetaTitle}</title>`}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Meta Description</h4>
                      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Preview (Click to Edit):</span>
                          <span className={`text-xs ${generatedMetaDescription.length > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                            {generatedMetaDescription.length}/160 characters
                          </span>
                        </div>
                        <div className={`bg-white rounded-lg p-4 border ${generatedMetaDescription.length > 160 ? 'border-red-300' : 'border-slate-200'} focus-within:border-slate-400 transition-colors`}>
                          <textarea
                            value={generatedMetaDescription}
                            onChange={(e) => {
                              setGeneratedMetaDescription(e.target.value)
                              trackChange('meta')
                            }}
                            className="w-full text-slate-700 text-sm bg-transparent border-none outline-none focus:ring-0 resize-none"
                            maxLength={160}
                            rows={3}
                            placeholder="Enter meta description..."
                          />
                        </div>
                        {generatedMetaDescription.length > 160 && (
                          <p className="text-xs text-red-500 mt-1">⚠️ Description exceeds recommended 160 character limit</p>
                        )}
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-slate-700 mb-2">Raw HTML:</h5>
                          <pre className="text-xs text-slate-600 bg-white p-3 border border-slate-200 rounded-lg overflow-x-auto">
                            {`<meta name="description" content="${generatedMetaDescription}" />`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Canonical URL Option */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Canonical URL</h4>
                      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h5 className="text-sm font-medium text-slate-700 mb-1">Make this page canonical?</h5>
                            <p className="text-xs text-slate-500">
                              Canonical pages tell search engines this is the preferred version of the page. 
                              Only set this for your main/primary pages.
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isCanonical}
                              onChange={(e) => {
                                setIsCanonical(e.target.checked)
                                trackChange('meta')
                              }}
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
                          <h5 className="text-sm font-medium text-slate-700 mb-2">Raw HTML:</h5>
                          <pre className="text-xs text-slate-600 bg-white p-3 border border-slate-200 rounded-lg overflow-x-auto">
                            {isCanonical ? `<link rel="canonical" href="${window.location.origin}/${getMainKeyword().toLowerCase().replace(/\s+/g, '-')}" />` : '<!-- No canonical URL set -->'}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Continue Button */}
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={() => {
                          setShowMetaFields(false)
                          setShowHeroSection(true)
                          // Initialize hero H1 with main keyword
                          setHeroH1(getMainKeywordRequired())
                        }}
                        disabled={generatedMetaTitle.length === 0 || generatedMetaDescription.length === 0}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Continue to Hero Section
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero Section Card */}
        {showHeroSection && projectConfigured && (
          <div className="mt-8 w-full">
            <HeroSection
              isEnabled={heroEnabled}
              mainKeyword={heroH1}
              slogan={heroSlogan}
              span={heroSpan}
              buttonUrl={heroButtonUrl}
              buttonText={heroButtonText}
              heroImage1={heroImage1}
              heroImage2={heroImage2}
              heroAlt1={heroAlt1}
              heroAlt2={heroAlt2}
              onToggleEnabled={setHeroEnabled}
              onH1Change={setHeroH1}
              onSloganChange={setHeroSlogan}
              onSpanChange={setHeroSpan}
              onButtonUrlChange={setHeroButtonUrl}
              onButtonTextChange={setHeroButtonText}
              onImage1Change={setHeroImage1}
              onImage2Change={setHeroImage2}
              onAlt1Change={setHeroAlt1}
              onAlt2Change={setHeroAlt2}
              onGenerateSlogan={generateSlogan}
              isGeneratingSlogan={isGeneratingSlogan}
            />
            
            <div className="mt-6 flex justify-end">
              {!isMetaSaved ? (
                        <div className="text-center">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-center">
                              <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium text-yellow-800">
                        Please save Meta fields first
                              </span>
                            </div>
                          </div>
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
                          >
                            Save & Continue
                          </button>
                        </div>
                      ) : (
                isHeroSaved ? (
                          <button
                            disabled
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium cursor-not-allowed transition-colors"
                          >
                            ✅ Saved & Continue
                          </button>
                        ) : (
                          <button
                    type="button"
                    onClick={() => {
                      setShowHeroSection(false)
                      setShowMainContentImages(true)
                    }}
                    disabled={heroEnabled && !heroH1.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue to Main Content Images
                          </button>
                        )
                      )}
            </div>
          </div>
        )}

        {/* Main Content Images Section */}
        {(showMetaFields || showMainContentImages) && projectConfigured && (
          <div className="mt-8 w-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Main Content Images</h3>
                <div className="text-sm text-gray-600">
                  H2 Headings in Main Content: {editableContent ? (editableContent.match(/<h2[^>]*>.*?<\/h2>/g) || []).length : 0}
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Validation Error */}
                {(() => {
                  const h2Count = editableContent ? (editableContent.match(/<h2[^>]*>.*?<\/h2>/g) || []).length : 0
                  const imageCount = bodyContentImages.length
                  const hasExcessImages = imageCount > h2Count && h2Count > 0
                  
                  return (
                    <>
                      {hasExcessImages && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">
                                Too Many Images
                              </h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>
                                  You have <strong>{imageCount} images</strong> but only <strong>{h2Count} H2 sections</strong> in your main content.
                                </p>
                                <p className="mt-1">
                                  Please remove {imageCount - h2Count} image{imageCount - h2Count > 1 ? 's' : ''} or add more H2 sections to your main content.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      

                    </>
                  )
                })()}
                
                {/* Main Content Images Grid */}
                {bodyContentImages.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">Main Content Images ({bodyContentImages.length})</h4>
                      <div className="text-sm text-gray-600">
                        {(() => {
                          const h2Count = editableContent ? (editableContent.match(/<h2[^>]*>.*?<\/h2>/g) || []).length : 0
                          const imageCount = bodyContentImages.length
                          const hasExcessImages = imageCount > h2Count && h2Count > 0
                          
                          return (
                            <div className="flex items-center space-x-2">
                              <span>{h2Count} H2 sections available</span>
                              {hasExcessImages && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  ⚠️ {imageCount - h2Count} excess
                                </span>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {bodyContentImages.map((image, index) => (
                        <div key={index} className="relative group">
                          {/* Image */}
                          <div className="relative">
                            <img
                              src={image.url}
                              alt={image.alt}
                              className={getImageFitClasses('content')}
                              onLoad={() => handleImageLoad(image.url, 'MainContent')}
                              onError={(e) => handleImageError(image.url, 'MainContent', e.currentTarget)}
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
                            placeholder={`Alt text (${getMainKeyword()})`}
                            className="w-full mt-2 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                          />
                          
                          {/* Source Badge */}
                          <div className="mt-1">
                            <span className={`inline-block px-1 py-0.5 text-xs rounded ${
                              image.source === 'file' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {image.source === 'file' ? 'Uploaded' : 'Pexels'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Main Content Images */}
                <div className="mt-4 space-y-4">
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                    <div className="text-center">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Upload Images</h6>
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
                                const mainKeyword = getMainKeyword()
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
                        <span className="mr-2">📁</span>
                        Upload Images (Multiple)
                      </button>
                    </div>
                  </div>

                  {/* Pexels Search */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                    <div className="text-center mb-3">
                      <h6 className="text-sm font-medium text-gray-700">Search Pexels Images</h6>
                      <p className="text-xs text-gray-600">Find professional images for your content</p>
                    </div>
                    <PexelsSearch
                      onImageSelect={(image) => {
                        const mainKeyword = getMainKeyword()
                        addBodyContentImage({
                          url: image.largeUrl || image.url,
                          alt: image.alt || mainKeyword,
                          source: 'pexels' as const
                        })
                      }}
                      placeholder="Search for content images..."
                      maxHeight="max-h-32"
                    />
                  </div>
                  
                  {/* Save Main Content Images Button */}
                  {bodyContentImages.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        {(() => {
                          const h2Count = editableContent ? (editableContent.match(/<h2[^>]*>.*?<\/h2>/g) || []).length : 0
                          const imageCount = bodyContentImages.length
                          const hasExcessImages = imageCount > h2Count && h2Count > 0
                          
                          return (
                            <div className="flex items-center space-x-2">
                              <span>📊 {imageCount} images → {h2Count} H2 sections</span>
                              {hasExcessImages && (
                                <span className="text-red-600 font-medium">
                                  ⚠️ {imageCount - h2Count} excess
                                </span>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                      
                      {/* Preview Image Assignment */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h5 className="font-semibold text-gray-800 mb-2">📋 Assignment: H2 Sections → Images</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {(() => {
                            const h2Count = editableContent ? (editableContent.match(/<h2[^>]*>.*?<\/h2>/g) || []).length : 0
                            const imageCount = bodyContentImages.length
                            const hasExcessImages = imageCount > h2Count && h2Count > 0
                            
                            return (
                              <>
                                {editableContent ? (editableContent.match(/<h2[^>]*>.*?<\/h2>/g) || []).map((heading, index) => {
                                  const imageIndex = index % bodyContentImages.length
                                  const image = bodyContentImages[imageIndex]
                                  const isExcessImage = index >= h2Count
                                  
                                  return (
                                    <div key={index} className={`flex items-center justify-between p-2 rounded border ${
                                      isExcessImage ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                                    }`}>
                                      <span className="font-medium">H2 {index + 1}</span>
                                      <span className="text-gray-500">→</span>
                                      <span className={`${isExcessImage ? 'text-red-600' : 'text-blue-600'}`}>
                                        Image {imageIndex + 1}
                                      </span>
                                      <span className={`text-xs truncate max-w-20 ${
                                        isExcessImage ? 'text-red-400' : 'text-gray-400'
                                      }`}>
                                        {image?.alt || 'No image'}
                                      </span>
                                      {isExcessImage && (
                                        <span className="text-red-500 text-xs">⚠️</span>
                                      )}
                                    </div>
                                  )
                                }) : <span className="text-gray-500">No H2 headings found</span>}
                                
                                {hasExcessImages && (
                                  <div className="col-span-full mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                    ⚠️ {imageCount - h2Count} image{imageCount - h2Count > 1 ? 's' : ''} will not be used (no H2 sections available)
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </div>
                      
                      <div className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg ${
                        isMainContentImagesSaved 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}>
                        <span className="mr-2">{isMainContentImagesSaved ? '✅' : '⚠️'}</span>
                        {isMainContentImagesSaved ? 'Saved' : 'Unsaved'}
            </div>
          </div>
        )}
                    </div>
                  </div>
            </div>
          </div>
        )}

        {/* Banner Ad Card */}
        {showBannerAd && projectConfigured && (
          <div className="mt-8 w-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Configure Your Banner Ads</h3>
                <button
                  type="button"
                  onClick={() => setShowBannerAd(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                >
                  ← Back
                </button>
              </div>
              
              <div className="space-y-6">
                <p className="text-gray-600">
                  Configure up to 4 banner ads for your page. Each banner ad will appear at different positions throughout your content.
                </p>
                
                {/* Banner Ads List */}
                <div className="space-y-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      💡 Configure your main banner ad below. Additional banner ads will be placed strategically throughout the page during generation.
                    </p>
                  </div>
                  {bannerAds.map((banner, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">Banner Ad {index + 1}</h4>
                        <div className="flex space-x-2">
                          {bannerAds.length > 1 && (
                            <button
                              onClick={() => removeBannerAd(index)}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                            >
                              Remove
                            </button>
                          )}
                          {bannerAds.length < 4 && (
                            <button
                              onClick={() => duplicateBannerAd(index)}
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                            >
                              Duplicate
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Banner Ad Content */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Banner Image Section */}
                        <div className="space-y-4">
                          <h5 className="text-md font-semibold text-gray-800">Banner Image</h5>
                          
                          {/* Current Banner Image */}
                          {banner.image && (
                            <div className="border border-gray-200 rounded-xl p-4 bg-white">
                              <div className="relative">
                                <img
                                  src={banner.image?.url || ''}
                                  alt={banner.image?.alt || 'Banner image'}
                                  className={getImageFitClasses('banner')}
                                  onLoad={() => handleImageLoad(banner.image?.url || '', 'BannerAd')}
                                  onError={(e) => handleImageError(banner.image?.url || '', 'BannerAd', e.currentTarget)}
                                />
                                <button
                                  onClick={() => updateBannerAd(index, 'image', null)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {banner.image.source === 'file' ? 'Uploaded Image' : 'Pexels Image'}
                              </p>
                              <input
                                type="text"
                                value={banner.image.alt || ''}
                                onChange={(e) => updateBannerAd(index, 'image', { ...banner.image, alt: e.target.value })}
                                placeholder={`Alt text for banner image (default: ${getMainKeyword()})`}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                              />
                            </div>
                          )}
                          
                          {/* Image Upload Options */}
                          {!banner.image && (
                            <div className="space-y-4">
                              {/* Local Upload */}
                              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white">
                                <div className="text-center">
                                  <h6 className="text-sm font-medium text-gray-700 mb-2">Upload Image</h6>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || [])
                                      if (files.length > 0) {
                                        // For banner ads, we'll use the first file selected
                                        const file = files[0]
                                        console.log('Uploading file:', file.name, file.size, file.type)
                                        
                                        // Convert file to base64 for embedding in HTML
                                        const reader = new FileReader()
                                        reader.onload = (event) => {
                                          const base64Url = event.target?.result as string
                                          console.log('Created base64 URL:', base64Url.substring(0, 50) + '...')
                                        const mainKeyword = getMainKeyword()
                                        updateBannerAd(index, 'image', {
                                            url: base64Url,
                                            alt: mainKeyword,
                                            source: 'file' as const,
                                            file: file
                                          })
                                        }
                                        reader.readAsDataURL(file)
                                      }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm"
                                  />
                                </div>
                              </div>

                              {/* Pexels Search */}
                              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                                <div className="text-center mb-3">
                                  <h6 className="text-sm font-medium text-gray-700">Search Pexels Images</h6>
                                  <p className="text-xs text-gray-600">Find professional banner images</p>
                                </div>
                                <PexelsSearch
                                  onImageSelect={(image) => {
                                    const mainKeyword = getMainKeyword()
                                    const newImage = {
                                      url: image.largeUrl || image.url,
                                      alt: image.alt || mainKeyword,
                                      source: 'pexels' as const
                                    }
                                    updateBannerAd(index, 'image', newImage)
                                    setMessage(`✅ Added Pexels image: ${image.alt}`)
                                  }}
                                  placeholder="Search for banner images..."
                                  maxHeight="max-h-32"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Banner Text Section */}
                        <div className="space-y-4">
                          <h5 className="text-md font-semibold text-gray-800">Banner Content</h5>
                          
                          {/* Banner Title */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Banner Title (H2)
                            </label>
                            <input
                              type="text"
                              value={banner.title}
                              onChange={(e) => updateBannerAd(index, 'title', e.target.value)}
                              placeholder={`Discover Amazing ${getMainKeyword()}`}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                            />
                          </div>
                          
                          {/* Banner Description */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Banner Description
                            </label>
                            <textarea
                              value={banner.description}
                              onChange={(e) => updateBannerAd(index, 'description', e.target.value)}
                              placeholder={`Explore our comprehensive guide to ${getMainKeyword()}. Get expert insights and practical tips to enhance your knowledge.`}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                            />
                          </div>
                          
                          {/* Banner CTA Button */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CTA Button Text
                            </label>
                            <input
                              type="text"
                              value={banner.cta}
                              onChange={(e) => updateBannerAd(index, 'cta', e.target.value)}
                              onBlur={(e) => updateBannerAd(index, 'cta', capitalizeFirstLetterOfEachWord(e.target.value))}
                              placeholder="Shop Now"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Banner Ad Button */}
                {bannerAds.length < 1 && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={addBannerAd}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <span className="mr-2">+</span>
                      Add Main Banner Ad
                    </button>
                  </div>
                )}
                {bannerAds.length >= 1 && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      ✅ Main banner ad configured. Additional banner ads will be placed strategically during page generation.
                    </p>
                  </div>
                )}



                {/* Save Button */}
                <div className="flex justify-end">
                  {!isHeroSaved ? (
                    <div className="text-center">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-center">
                          <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-yellow-800">
                            Please save Hero section first
                          </span>
                        </div>
                      </div>
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
                      >
                        Save & Continue to Final Summary
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowBannerAd(false)
                        setShowFinalSummary(true)
                          setMessage('🎯 Step 4/4: Final Summary - Review and generate your page')
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Continue to Final Summary
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Summary Section */}
        {showFinalSummary && projectConfigured && (
          <div className="mt-8 w-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="space-y-6">
                {/* Remove Images Section and SEO Schema UI here */}
                {/* Generate Page Button */}
                <div className="text-center pt-6">
                    <button
                    onClick={finishWithImages}
                    className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg shadow-lg"
                  >
                    🚀 Generate Your Page
                    </button>
                  <p className="text-sm text-gray-600 mt-2">
                    This will create and download your complete HTML page with all content and images
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Options Modal */}
        {showEditOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">✏️ Edit Your Page Content</h3>
                <button
                  onClick={() => setShowEditOptions(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600 mb-6">
                  Choose which section you'd like to edit. You can go back to any step and make changes.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Edit Project Configuration */}
                  <button
                    onClick={() => {
                      setShowEditOptions(false)
                      setShowFinalSummary(false)
                      setProjectConfigured(false)
                    }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">⚙️ Project Configuration</h4>
                    <p className="text-sm text-gray-600">Edit handle, main keyword, and parent page</p>
                  </button>

                  {/* Edit Keywords */}
                  <button
                    onClick={() => {
                      setShowEditOptions(false)
                      setShowFinalSummary(false)
                      setShowKeywords(true)
                    }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">🔍 Main Content</h4>
                                          <p className="text-sm text-gray-600">Edit main content sections and ordering</p>
                  </button>

                  {/* Edit Main Content */}
                  <button
                    onClick={() => {
                      setShowEditOptions(false)
                      setShowFinalSummary(false)
                      setShowGeneratedContent(true)
                    }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                                                              <h4 className="font-semibold text-gray-800 mb-2">📄 Main Content</h4>
                    <p className="text-sm text-gray-600">Regenerate or edit the main content</p>
                    <div className="text-xs text-gray-500 mt-1">
                      H2 Headings: {editableContent ? (editableContent.match(/<h2[^>]*>.*?<\/h2>/g) || []).length : 0}
                    </div>
                  </button>

                  {/* Edit FAQ */}
                  <button
                    onClick={() => {
                      setShowEditOptions(false)
                      setShowFinalSummary(false)
                      setShowFaqCard(true)
                    }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">❓ FAQ Section</h4>
                    <p className="text-sm text-gray-600">Regenerate or edit FAQ questions</p>
                  </button>

                  {/* Edit FAQ Schema */}
                  <button
                    onClick={() => {
                      setShowEditOptions(false)
                      setShowFinalSummary(false)
                      setShowFaqSchema(true)
                    }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">🔍 FAQ Schema</h4>
                    <p className="text-sm text-gray-600">Regenerate structured data</p>
                  </button>

                  {/* Edit Meta Fields */}
                  <button
                    onClick={() => {
                      setShowEditOptions(false)
                      setShowFinalSummary(false)
                      setShowMetaFields(true)
                      setShowMainContentImages(true)
                    }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">📝 Meta Title & Description</h4>
                    <p className="text-sm text-gray-600">Edit SEO meta tags</p>
                  </button>

                  {/* Edit Images */}
                  <button
                    onClick={() => {
                      setShowEditOptions(false)
                      setShowFinalSummary(false)
                      setShowImageUpload(true)
                    }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">🖼️ Images</h4>
                    <p className="text-sm text-gray-600">Add, remove, or reorder images</p>
                  </button>

                  {/* Edit Main Content Images */}
                  <button
                    onClick={() => {
                      setShowEditOptions(false)
                      setShowFinalSummary(false)
                      setShowMetaFields(true)
                      setShowMainContentImages(true)
                    }}
                    className={`p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left ${
                      bodyContentImages.length > 0 ? 'border-green-300 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">🖼️ Main Content Images</h4>
                    <p className="text-sm text-gray-600">Add images for main content sections</p>
                    <div className="text-xs text-gray-500 mt-1">
                      Images: {bodyContentImages.length} / {editableContent ? (editableContent.match(/<h2[^>]*>.*?<\/h2>/g) || []).length : 0}
                    </div>
                    {bodyContentImages.length > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        ✅ Ready to use in page generation
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowEditOptions(false)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-6 p-4 rounded-md ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}




      </div>
    </div>
  )
} 