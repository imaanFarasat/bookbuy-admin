'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Page {
  id: string
  handle: string
  mainKeyword: string
  metaTitle?: string
}

interface InternalLink {
  id: string
  mainPageId: string
  relatedPageId: string
  anchorText: string
  sortOrder: number
}

export default function InternalLinkingPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPage, setSelectedPage] = useState<string>('')
  const [internalLinks, setInternalLinks] = useState<InternalLink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  // Load all pages
  useEffect(() => {
    const loadPages = async () => {
      try {
        const response = await fetch('/api/pages')
        if (response.ok) {
          const data = await response.json()
          setPages(data.pages)
        }
      } catch (error) {
        console.error('Error loading pages:', error)
        setMessage('❌ Failed to load pages')
      }
    }
    loadPages()
  }, [])

  // Load internal links for selected page
  const loadInternalLinks = async (pageId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/pages/${pageId}/internal-links`)
      if (response.ok) {
        const data = await response.json()
        setInternalLinks(data.internalLinks || [])
      } else {
        setInternalLinks([])
      }
    } catch (error) {
      console.error('Error loading internal links:', error)
      setInternalLinks([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle page selection
  const handlePageSelect = (pageId: string) => {
    setSelectedPage(pageId)
    loadInternalLinks(pageId)
  }

  // Add new internal link
  const addInternalLink = () => {
    const newLink: InternalLink = {
      id: `temp-${Date.now()}`,
      mainPageId: selectedPage,
      relatedPageId: '',
      anchorText: '',
      sortOrder: internalLinks.length
    }
    setInternalLinks([...internalLinks, newLink])
  }

  // Update internal link
  const updateInternalLink = (index: number, field: keyof InternalLink, value: string | number) => {
    const updated = [...internalLinks]
    updated[index] = { ...updated[index], [field]: value }
    setInternalLinks(updated)
  }

  // Remove internal link
  const removeInternalLink = (index: number) => {
    setInternalLinks(internalLinks.filter((_, i) => i !== index))
  }

  // Save internal links
  const saveInternalLinks = async () => {
    if (!selectedPage) {
      setMessage('❌ Please select a page first')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/pages/${selectedPage}/internal-links`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalLinks })
      })

      if (response.ok) {
        setMessage('✅ Internal links saved successfully')
      } else {
        setMessage('❌ Failed to save internal links')
      }
    } catch (error) {
      console.error('Error saving internal links:', error)
      setMessage('❌ Failed to save internal links')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🔗 Internal Linking Manager
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/dashboard/robots')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Robots.txt
            </button>
            <button
              onClick={() => router.push('/dashboard/history')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Page History
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-md mb-6 ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Page Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Page</h2>
            
            <div className="space-y-3">
              {pages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => handlePageSelect(page.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPage === page.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-medium text-gray-900">{page.mainKeyword}</h3>
                  <p className="text-sm text-gray-500">/{page.handle}</p>
                  {page.metaTitle && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{page.metaTitle}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Internal Links */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            {selectedPage ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Internal Links
                  </h2>
                  <button
                    onClick={addInternalLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + Add Link
                  </button>
                </div>

                {internalLinks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No internal links yet.</p>
                    <p className="text-sm">Click "Add Link" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {internalLinks.map((link, index) => (
                      <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-medium text-gray-900">Link {index + 1}</h3>
                          <button
                            onClick={() => removeInternalLink(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            × Remove
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Anchor Text *
                            </label>
                            <input
                              type="text"
                              value={link.anchorText}
                              onChange={(e) => updateInternalLink(index, 'anchorText', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Click here to learn more"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Link To Page *
                            </label>
                            <select
                              value={link.relatedPageId}
                              onChange={(e) => updateInternalLink(index, 'relatedPageId', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="">Select a page</option>
                              {pages
                                .filter(page => page.id !== selectedPage)
                                .map(page => (
                                  <option key={page.id} value={page.id}>
                                    {page.mainKeyword} (/{page.handle})
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <button
                    onClick={saveInternalLinks}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Internal Links'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Select a page from the left to manage its internal links.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 