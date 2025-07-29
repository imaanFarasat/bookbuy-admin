'use client'

import React, { useState, useEffect, useRef } from 'react'

interface ParentPage {
  id: string
  name: string
  createdAt: string
}

interface ParentPageInputProps {
  value: string
  onChange: (value: string) => void
  onParentPageCreated?: (parentPage: ParentPage) => void
  placeholder?: string
  className?: string
}

export default function ParentPageInput({ 
  value, 
  onChange, 
  onParentPageCreated,
  placeholder = "Enter parent page name...",
  className = ""
}: ParentPageInputProps) {
  const [suggestions, setSuggestions] = useState<ParentPage[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allParentPages, setAllParentPages] = useState<ParentPage[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'warning' | 'error'>('success')
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)

  // Fetch all parent pages on component mount
  useEffect(() => {
    fetchParentPages()
  }, [])

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchParentPages = async () => {
    try {
      const response = await fetch('/api/parent-pages')
      const data = await response.json()
      if (response.ok) {
        setAllParentPages(data.parentPages || [])
      }
    } catch (error) {
      console.error('Error fetching parent pages:', error)
    }
  }

  const capitalizeWords = (text: string): string => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const capitalizedValue = capitalizeWords(inputValue)
    
    onChange(capitalizedValue)
    setMessage('')

    // Filter suggestions based on input
    if (inputValue.trim()) {
      const filtered = allParentPages.filter(page =>
        page.name.toLowerCase().includes(inputValue.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleInputFocus = () => {
    if (value.trim() && suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleSuggestionClick = (parentPage: ParentPage) => {
    onChange(parentPage.name)
    setShowSuggestions(false)
    setMessage('✅ Selected existing parent page')
    setMessageType('success')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleInputBlur = async () => {
    // Small delay to allow suggestion clicks to register
    setTimeout(async () => {
      if (value.trim() && !showSuggestions) {
        await checkOrCreateParentPage()
      }
    }, 200)
  }

  const checkOrCreateParentPage = async () => {
    if (!value.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/parent-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value.trim() })
      })

      const data = await response.json()
      
      if (response.ok) {
        if (data.exists) {
          setMessage('⚠️ This parent page already exists in database')
          setMessageType('warning')
        } else {
          setMessage('✅ New parent page created and saved to database')
          setMessageType('success')
          // Refresh the parent pages list
          await fetchParentPages()
          // Notify parent component
          if (onParentPageCreated) {
            onParentPageCreated(data.parentPage)
          }
        }
        // Update the input with the properly capitalized name
        onChange(data.parentPage.name)
      } else {
        setMessage(`❌ Error: ${data.error}`)
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error checking/creating parent page:', error)
      setMessage('❌ Failed to process parent page')
      setMessageType('error')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setShowSuggestions(false)
      if (value.trim()) {
        checkOrCreateParentPage()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        disabled={loading}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((parentPage) => (
            <button
              key={parentPage.id}
              type="button"
              onClick={() => handleSuggestionClick(parentPage)}
              className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{parentPage.name}</div>
              <div className="text-xs text-gray-500">
                Added {new Date(parentPage.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className={`mt-2 text-sm ${
          messageType === 'success' ? 'text-green-600' : 
          messageType === 'warning' ? 'text-yellow-600' : 
          'text-red-600'
        }`}>
          {message}
        </div>
      )}

      {/* Helper Text */}
      <div className="mt-1 text-xs text-gray-500">
        💡 Type to search existing parent pages or create a new one. First letters will be auto-capitalized.
      </div>
    </div>
  )
} 