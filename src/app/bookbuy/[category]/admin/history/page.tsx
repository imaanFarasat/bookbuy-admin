'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navigation from '@/components/ui/navigation'

interface Page {
  id: string
  handle: string
  mainKeyword: string
  status: string
  createdAt: string
  updatedAt: string
  metaTitle?: string
  metaDescription?: string
  canonical?: boolean
  category: string
  _count: {
    keywords: number
    images: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

// Category configuration (same as main dashboard)
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

export default function BookbuyCategoryHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const category = params.category as string
  
  const [pages, setPages] = useState<Page[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

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
                  onClick={() => router.push(`/bookbuy/${key}/admin/history`)}
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

  useEffect(() => {
    fetchPages()
  }, [currentPage, statusFilter])

  const fetchPages = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        category: category
      })
      
      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/pages?${params}`)
      const data = await response.json()

      if (data.success) {
        setPages(data.pages)
        setPagination(data.pagination)
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

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPages(pages.filter(page => page.id !== pageId))
        setMessage('Page deleted successfully')
      } else {
        setError('Failed to delete page')
      }
    } catch (error) {
      setError('Failed to delete page')
      console.error('Error deleting page:', error)
    }
  }

  const handleViewPage = (handle: string) => {
    window.open(`/${handle}`, '_blank')
  }

  const handleEditPage = (pageId: string) => {
    router.push(`/bookbuy/${category}/admin/edit/${pageId}`)
  }

  const handleRegeneratePage = (pageId: string) => {
    router.push(`/bookbuy/${category}/admin/regenerate/${pageId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
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
              <h1 className="text-3xl font-bold text-gray-900">{categoryConfig.name} History</h1>
              <p className="text-gray-600">Manage your {categoryConfig.name.toLowerCase()} pages</p>
            </div>
          </div>
          
          {/* Category Navigation */}
          <div className="flex space-x-2 mb-6">
            {Object.entries(CATEGORIES).map(([key, config]) => (
              <button
                key={key}
                onClick={() => router.push(`/bookbuy/${key}/admin/history`)}
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

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <button
            onClick={() => router.push(`/bookbuy/${category}/admin`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            + Create New {categoryConfig.name} Page
          </button>
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

        {/* Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div key={page.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {page.mainKeyword}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    /{page.handle}
                  </p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(page.status)}
                    {page.canonical && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ⭐ Canonical
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {page.metaTitle && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Meta Title</p>
                    <p className="text-sm text-gray-900 truncate">{page.metaTitle}</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>📝 {page._count.keywords} keywords</span>
                  <span>🖼️ {page._count.images} images</span>
                </div>

                <div className="text-xs text-gray-500">
                  Created: {formatDate(page.createdAt)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleViewPage(page.handle)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium"
                >
                  View
                </button>
                <button
                  onClick={() => handleEditPage(page.id)}
                  className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-xs font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRegeneratePage(page.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs font-medium"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => handleDeletePage(page.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          </div>
        )}

        {pages.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{categoryConfig.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No {categoryConfig.name} Pages Yet</h3>
            <p className="text-gray-600 mb-6">Create your first {categoryConfig.name.toLowerCase()} page to get started.</p>
            <button
              onClick={() => router.push(`/bookbuy/${category}/admin`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create First Page
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 