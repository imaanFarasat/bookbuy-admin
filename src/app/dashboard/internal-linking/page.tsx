'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/ui/navigation'

interface Page {
  id: string
  handle: string
  mainKeyword: string
  status: string
  createdAt: string
  metaTitle?: string
  metaDescription?: string
  heroImage1?: string
  content?: string
  _count: {
    keywords: number
    images: number
  }
}

interface InternalLink {
  id: string
  mainPageId: string
  relatedPageId: string
  sortOrder: number
  mainPage: Page
  relatedPage: Page
}

export default function InternalLinkingPage() {
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [relatedPages, setRelatedPages] = useState<Page[]>([])
  const [internalLinks, setInternalLinks] = useState<InternalLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pages')
      const data = await response.json()

      if (data.success) {
        setPages(data.pages)
      } else {
        setError(data.error || 'Failed to fetch pages')
      }
    } catch (error) {
      setError('Failed to fetch pages')
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInternalLinks = async (pageId: string) => {
    try {
      const response = await fetch(`/api/internal-links?pageId=${pageId}`)
      const data = await response.json()

      if (data.success) {
        setInternalLinks(data.links)
        setRelatedPages(data.links.map((link: InternalLink) => link.relatedPage))
      } else {
        setRelatedPages([])
      }
    } catch (error) {
      console.error('Error fetching internal links:', error)
      setRelatedPages([])
    }
  }

  const handlePageSelect = (page: Page) => {
    setSelectedPage(page)
    fetchInternalLinks(page.id)
  }

  const addRelatedPage = (relatedPage: Page) => {
    if (!selectedPage) return

    // Check if already added
    if (relatedPages.find(p => p.id === relatedPage.id)) {
      setMessage('❌ This page is already added as a related page')
      return
    }

    setRelatedPages(prev => [...prev, relatedPage])
    setMessage('✅ Related page added successfully')
  }

  const removeRelatedPage = (pageId: string) => {
    setRelatedPages(prev => prev.filter(p => p.id !== pageId))
    setMessage('✅ Related page removed successfully')
  }

  const saveInternalLinks = async () => {
    if (!selectedPage) return

    try {
      setLoading(true)
      setError(null)
      
      const requestData = {
        mainPageId: selectedPage.id,
        relatedPageIds: relatedPages.map(p => p.id)
      }
      
      console.log('Saving internal links:', requestData)
      
      const response = await fetch('/api/internal-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const responseData = await response.json()
      console.log('API response:', responseData)

      if (response.ok && responseData.success) {
        setMessage('✅ Internal links saved successfully!')
        fetchInternalLinks(selectedPage.id)
      } else {
        const errorMessage = responseData.error || responseData.details || 'Failed to save internal links'
        setError(`Failed to save internal links: ${errorMessage}`)
        console.error('API error:', responseData)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to save internal links: ${errorMessage}`)
      console.error('Error saving internal links:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-yellow-100 text-yellow-800', text: 'Draft' },
      published: { color: 'bg-green-100 text-green-800', text: 'Published' },
      archived: { color: 'bg-gray-100 text-gray-800', text: 'Archived' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  if (loading && pages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 pt-20">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Internal Linking</h1>
          <p className="text-gray-600">Assign related pages to create internal links and improve SEO</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Available Pages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Pages</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPage?.id === page.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePageSelect(page)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {page.mainKeyword}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        /{page.handle}
                      </p>
                      {getStatusBadge(page.status)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(page.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Selected Page & Related Pages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            {selectedPage ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Related Pages for: {selectedPage.mainKeyword}
                </h2>

                {/* Add Related Pages */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add Related Pages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {pages
                      .filter(page => page.id !== selectedPage.id)
                      .map((page) => (
                        <button
                          key={page.id}
                          onClick={() => addRelatedPage(page)}
                          className="p-3 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{page.mainKeyword}</div>
                          <div className="text-sm text-gray-500">/{page.handle}</div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Current Related Pages */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Current Related Pages ({relatedPages.length})
                  </h3>
                  
                  {relatedPages.length === 0 ? (
                    <p className="text-gray-500 text-sm">No related pages assigned yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {relatedPages.map((page, index) => (
                        <div key={page.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{page.mainKeyword}</div>
                            <div className="text-sm text-gray-500">/{page.handle}</div>
                          </div>
                          <button
                            onClick={() => removeRelatedPage(page.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <button
                  onClick={saveInternalLinks}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Internal Links'}
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>Select a page from the left to manage its related pages</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {selectedPage && relatedPages.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Preview: Related Pages Section</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 id="related-pages" className="h2-related-page text-2xl font-bold mb-4">Related Pages</h2>
              <hr className="mb-5" />
              
              <div className="mt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedPages.map((page, index) => (
                    <div key={page.id} className="tm-carousel-item">
                      <figure className="effect-honey mb-4">
                        <img 
                          src={page.heroImage1 || '/img/about-01.jpg'} 
                          alt={page.mainKeyword}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <figcaption>
                          <ul className="tm-social">
                            <li><a href={`/${page.handle}`} className="tm-social-link">View Page</a></li>
                          </ul>
                        </figcaption>
                      </figure>
                      <div className="tm-about-text">
                        <h3 className="mb-3 tm-text-primary tm-about-title">
                          <a href={`/${page.handle}`} className="text-blue-600 hover:text-blue-800">
                            {page.mainKeyword}
                          </a>
                        </h3>
                        <p className="text-gray-600">
                          {page.metaDescription?.substring(0, 100) || 'Related page content...'}
                        </p>
                        <h4 className="tm-text-secondary tm-about-subtitle">
                          <a href={`/${page.handle}`} className="text-gray-500 hover:text-gray-700">
                            Read More →
                          </a>
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 