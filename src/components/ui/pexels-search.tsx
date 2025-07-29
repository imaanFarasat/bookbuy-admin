import React, { useState } from 'react'

interface PexelsImage {
  id: number
  url: string
  alt: string
  photographer: string
  width: number
  height: number
  originalUrl: string
  largeUrl: string
  thumbnailUrl: string
}

interface PexelsSearchProps {
  onImageSelect: (image: PexelsImage) => void
  placeholder?: string
  className?: string
  maxHeight?: string
  mainKeyword?: string // Add main keyword prop
}

export default function PexelsSearch({ 
  onImageSelect, 
  placeholder = "Search for images...",
  className = "",
  maxHeight = "max-h-48",
  mainKeyword = ""
}: PexelsSearchProps) {
  const [query, setQuery] = useState('')
  const [images, setImages] = useState<PexelsImage[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [message, setMessage] = useState('')
  const [displayedImages, setDisplayedImages] = useState<PexelsImage[]>([])

  const searchPexelsImages = async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) {
      setMessage('❌ Please enter a search term')
      return
    }

    setIsSearching(true)
    setMessage('🔍 Searching for images...')

    try {
      const response = await fetch(`/api/search-images?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&per_page=12`)
      const result = await response.json()

      if (response.ok) {
        if (pageNum === 1) {
          setImages(result.images)
          setDisplayedImages(result.images.slice(0, 5))
        } else {
          setImages(prev => [...prev, ...result.images])
          setDisplayedImages(prev => [...prev, ...result.images.slice(0, 5)])
        }
        setHasMore(result.hasMore)
        setPage(pageNum)
        setMessage(`✅ Found ${result.total} images for "${searchQuery}"`)
      } else {
        setMessage(`❌ Error: ${result.error || 'Failed to search images'}`)
      }
    } catch (error) {
      console.error('Error searching Pexels:', error)
      setMessage('❌ Failed to search images. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = () => {
    if (query.trim()) {
      searchPexelsImages(query.trim(), 1)
    } else {
      setMessage('❌ Please enter a search term')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const loadMore = () => {
    if (hasMore && !isSearching) {
      searchPexelsImages(query, page + 1)
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !isSearching) {
      searchPexelsImages(query, page + 1)
    }
  }

  const showMoreImages = () => {
    const currentCount = displayedImages.length
    const nextBatch = images.slice(currentCount, currentCount + 5)
    if (nextBatch.length > 0) {
      setDisplayedImages(prev => [...prev, ...nextBatch])
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`text-sm ${message.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </div>
      )}

      {/* Loading Indicator */}
      {isSearching && (
        <div className="text-center py-2">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Searching...</span>
        </div>
      )}

             {/* Results Grid */}
       {images.length > 0 && (
         <div>
           <div className="grid grid-cols-5 gap-3">
             {displayedImages.map((image) => (
               <div
                 key={image.id}
                 className="relative group cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-all duration-200 aspect-square"
                 onClick={() => {
                   // Always use main keyword as alt text if provided
                   const imageWithMainKeywordAlt = {
                     ...image,
                     alt: mainKeyword || image.alt
                   }
                   onImageSelect(imageWithMainKeywordAlt)
                 }}
               >
                 <div className="w-full aspect-square">
                   <img
                     src={image.largeUrl || image.url}
                     alt={image.alt}
                     className="w-full h-full object-cover rounded-lg"
                     onLoad={() => console.log('Pexels image loaded:', image.url)}
                     onError={(e) => {
                       console.error('Pexels image failed to load:', image.url)
                       e.currentTarget.style.display = 'none'
                     }}
                   />
                 </div>
                 {/* Hover overlay with better visibility */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                   <div className="absolute bottom-1 left-1 right-1">
                     <div className="text-white text-xs font-medium truncate">
                       {image.alt.length > 15 ? `${image.alt.substring(0, 15)}...` : image.alt}
                     </div>
                     <div className="text-white/80 text-xs">
                       by {image.photographer}
                     </div>
                   </div>
                 </div>
                 {/* Select indicator */}
                 <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                   ✓
                 </div>
               </div>
             ))}
           </div>
           
           {/* Load More Buttons */}
           <div className="space-y-2">
             {/* Show More from Current Results */}
             {displayedImages.length < images.length && (
               <button
                 type="button"
                 onClick={showMoreImages}
                 className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
               >
                 Show More Images ({images.length - displayedImages.length} remaining)
               </button>
             )}
             
             {/* Load More from API */}
             {hasMore && (
               <button
                 type="button"
                 onClick={handleLoadMore}
                 disabled={isSearching}
                 className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
               >
                 {isSearching ? 'Loading...' : 'Load More from API'}
               </button>
             )}
           </div>
         </div>
       )}
    </div>
  )
} 