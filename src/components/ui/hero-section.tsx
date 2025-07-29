'use client'

import React, { useState } from 'react'
import PexelsSearch from './pexels-search'

interface HeroSectionProps {
  isEnabled: boolean
  mainKeyword: string
  slogan: string
  span: string
  heroImage1: string
  heroImage2: string
  heroAlt1: string
  heroAlt2: string
  buttonUrl: string
  buttonText: string
  onToggleEnabled: (enabled: boolean) => void
  onH1Change: (h1: string) => void
  onSloganChange: (slogan: string) => void
  onSpanChange: (span: string) => void
  onImage1Change: (imageUrl: string) => void
  onImage2Change: (imageUrl: string) => void
  onAlt1Change: (alt: string) => void
  onAlt2Change: (alt: string) => void
  onButtonUrlChange: (url: string) => void
  onButtonTextChange: (text: string) => void
  onGenerateSlogan: () => void
  isGeneratingSlogan: boolean
}

export default function HeroSection({
  isEnabled,
  mainKeyword,
  slogan,
  span,
  heroImage1,
  heroImage2,
  heroAlt1,
  heroAlt2,
  buttonUrl,
  buttonText,
  onToggleEnabled,
  onH1Change,
  onSloganChange,
  onSpanChange,
  onImage1Change,
  onImage2Change,
  onAlt1Change,
  onAlt2Change,
  onButtonUrlChange,
  onButtonTextChange,
  onGenerateSlogan,
  isGeneratingSlogan
}: HeroSectionProps) {

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      // First image goes to left side (image1)
      const firstFile = files[0]
      const reader1 = new FileReader()
      reader1.onload = (e) => {
        const result = e.target?.result as string
        onImage1Change(result)
        // Set default alt text for first image
        if (!heroAlt1) {
          onAlt1Change(mainKeyword)
        }
      }
      reader1.readAsDataURL(firstFile)
      
      // Second image (if exists) goes to right side (image2)
      if (files.length > 1) {
        const secondFile = files[1]
        const reader2 = new FileReader()
        reader2.onload = (e) => {
          const result = e.target?.result as string
          onImage2Change(result)
          // Set default alt text for second image
          if (!heroAlt2) {
            onAlt2Change(mainKeyword)
          }
        }
        reader2.readAsDataURL(secondFile)
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Hero Section Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Hero Section</h2>
            <p className="text-sm text-gray-600">
              {isEnabled ? 'Hero section will be included in your page' : 'Hero section will be skipped'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </div>

      {isEnabled && (
        <>
          {/* H1 Heading Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Heading (H1) <span className="text-gray-500">*</span>
            </label>
            <input
              type="text"
              value={mainKeyword}
              onChange={(e) => onH1Change(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white text-sm"
              placeholder="Enter your main heading..."
            />
            {!mainKeyword && (
              <p className="mt-1 text-xs text-gray-500">
                💡 This should typically match your main keyword for SEO consistency
              </p>
            )}
          </div>

          {/* Span Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Text <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={span}
              onChange={(e) => {
                // Capitalize first letter of all words
                const capitalizedValue = e.target.value
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ')
                onSpanChange(capitalizedValue)
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white text-sm"
              placeholder="e.g., Downtown Toronto, New York, London... (optional)"
            />
          </div>

          {/* Slogan Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Slogan <span className="text-gray-500">(Optional)</span>
              </label>
              <button
                onClick={onGenerateSlogan}
                disabled={isGeneratingSlogan}
                className="px-2 py-1 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isGeneratingSlogan ? 'Generating...' : 'Generate AI'}
              </button>
            </div>
            
            <textarea
              value={slogan}
              onChange={(e) => onSloganChange(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white text-sm"
              placeholder="Enter your slogan or click 'Generate AI' to create one... (optional)"
            />
          </div>

          {/* Button Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call-to-Action Button <span className="text-gray-500">(Optional)</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => onButtonTextChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white text-sm"
                  placeholder="e.g., Book Now, Learn More, Get Started..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Button URL</label>
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => onButtonUrlChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white text-sm"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave both fields empty to hide the button completely
            </p>
          </div>

          {/* Hero Images Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Images <span className="text-gray-500">(Optional)</span>
            </label>
            <p className="text-xs text-gray-600 mb-3">Select 1-2 images. First image will be used for the left side, second image for the right side.</p>
            
            {/* Image Upload Options */}
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                <div className="text-center">
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Upload Images</h6>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="w-full px-2 py-1 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Pexels Search */}
              <div>
                <div className="text-center mb-3">
                  <h6 className="text-sm font-medium text-gray-700">Search Pexels Images</h6>
                  <p className="text-xs text-gray-600">Find professional images for your hero section</p>
                </div>
                <PexelsSearch
                  onImageSelect={(image) => {
                    // If no first image, set as first image
                    if (!heroImage1) {
                      onImage1Change(image.largeUrl || image.url)
                      onAlt1Change(image.alt || mainKeyword)
                    }
                    // If first image exists but no second image, set as second image
                    else if (!heroImage2) {
                      onImage2Change(image.largeUrl || image.url)
                      onAlt2Change(image.alt || mainKeyword)
                    }
                    // If both images exist, replace the second image
                    else {
                      onImage2Change(image.largeUrl || image.url)
                      onAlt2Change(image.alt || mainKeyword)
                    }
                  }}
                  placeholder="Search for hero images..."
                  maxHeight="max-h-32"
                />
              </div>
              
              {/* Image Previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image 1 Preview */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Left Side Image</label>
                  {heroImage1 ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img
                          src={heroImage1}
                          alt="Hero Image 1"
                          className="w-24 h-24 object-cover rounded-md border border-gray-200 aspect-square"
                          onLoad={() => console.log('Hero image 1 loaded successfully')}
                          onError={(e) => {
                            console.error('Hero image 1 failed to load:', heroImage1)
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <button
                          onClick={() => {
                            onImage1Change('')
                            onAlt1Change('')
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                      
                      {/* Alt Text Input for Image 1 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Alt Text
                        </label>
                        <input
                          type="text"
                          value={heroAlt1}
                          onChange={(e) => onAlt1Change(e.target.value)}
                          placeholder={`Alt text (${mainKeyword})`}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-500 text-xs">
                      No image
                    </div>
                  )}
                </div>

                {/* Image 2 Preview */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Right Side Image</label>
                  {heroImage2 ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img
                          src={heroImage2}
                          alt="Hero Image 2"
                          className="w-24 h-24 object-cover rounded-md border border-gray-200 aspect-square"
                          onLoad={() => console.log('Hero image 2 loaded successfully')}
                          onError={(e) => {
                            console.error('Hero image 2 failed to load:', heroImage2)
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <button
                          onClick={() => {
                            onImage2Change('')
                            onAlt2Change('')
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                      
                      {/* Alt Text Input for Image 2 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Alt Text
                        </label>
                        <input
                          type="text"
                          value={heroAlt2}
                          onChange={(e) => onAlt2Change(e.target.value)}
                          placeholder={`Alt text (${mainKeyword})`}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-500 text-xs">
                      No image
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {(mainKeyword || slogan || buttonUrl || heroImage1 || heroImage2) && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              <div className="space-y-4">
                {mainKeyword && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">H1:</span>
                    <h1 className="text-xl font-bold text-gray-900 mt-1">{mainKeyword}</h1>
                  </div>
                )}
                {span && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Secondary Text:</span>
                    <p className="text-gray-700 mt-1">{span}</p>
                  </div>
                )}
                {slogan && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Slogan:</span>
                    <p className="text-gray-700 mt-1">{slogan}</p>
                  </div>
                )}
                {(buttonUrl || buttonText) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Button:</span>
                    <p className="text-gray-700 mt-1">
                      {buttonText || 'Button'} → {buttonUrl || 'No URL'}
                    </p>
                  </div>
                )}
                {(heroImage1 || heroImage2) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Images:</span>
                    <div className="flex gap-2 mt-2">
                      {heroImage1 && (
                        <img src={heroImage1} alt="Preview 1" className="w-16 h-16 object-cover rounded" />
                      )}
                      {heroImage2 && (
                        <img src={heroImage2} alt="Preview 2" className="w-16 h-16 object-cover rounded" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!isEnabled && (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Hero section is disabled</p>
          <p className="text-xs mt-1">Enable the toggle above to configure your hero section</p>
        </div>
      )}
    </div>
  )
} 