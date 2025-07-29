'use client'

import React, { useState, useEffect } from 'react'

interface RateLimitData {
  openAI: {
    count: number
    remaining: number
    limit: number
    resetTime: number
    windowMs: number
  }
  user: {
    count: number
    remaining: number
    limit: number
    resetTime: number
    windowMs: number
  }
  api: {
    count: number
    remaining: number
    limit: number
    resetTime: number
    windowMs: number
  }
}

export default function RateLimitStatus() {
  const [rateLimitData, setRateLimitData] = useState<RateLimitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRateLimitStatus()
    // Refresh every 30 seconds
    const interval = setInterval(fetchRateLimitStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchRateLimitStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rate-limit-status')
      if (response.ok) {
        const data = await response.json()
        setRateLimitData(data)
        setError(null)
      } else {
        setError('Failed to fetch rate limit status')
      }
    } catch (err) {
      setError('Error fetching rate limit status')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeRemaining = (resetTime: number) => {
    const now = Date.now()
    const remaining = Math.max(0, resetTime - now)
    const seconds = Math.ceil(remaining / 1000)
    return `${seconds}s`
  }

  const getUsagePercentage = (count: number, limit: number) => {
    return Math.min(100, (count / limit) * 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading && !rateLimitData) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  if (!rateLimitData) return null

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Rate Limit Status</h3>
      
      <div className="space-y-3">
        {/* OpenAI Rate Limit */}
        <div className="border-l-4 border-blue-500 pl-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">OpenAI API</span>
            <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(rateLimitData.openAI.count, rateLimitData.openAI.limit))}`}>
              {rateLimitData.openAI.count}/{rateLimitData.openAI.limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className={`h-2 rounded-full ${getUsagePercentage(rateLimitData.openAI.count, rateLimitData.openAI.limit) >= 90 ? 'bg-red-500' : getUsagePercentage(rateLimitData.openAI.count, rateLimitData.openAI.limit) >= 75 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${getUsagePercentage(rateLimitData.openAI.count, rateLimitData.openAI.limit)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Resets in {formatTimeRemaining(rateLimitData.openAI.resetTime)}
          </p>
        </div>

        {/* User Rate Limit */}
        <div className="border-l-4 border-green-500 pl-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">User Actions</span>
            <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(rateLimitData.user.count, rateLimitData.user.limit))}`}>
              {rateLimitData.user.count}/{rateLimitData.user.limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className={`h-2 rounded-full ${getUsagePercentage(rateLimitData.user.count, rateLimitData.user.limit) >= 90 ? 'bg-red-500' : getUsagePercentage(rateLimitData.user.count, rateLimitData.user.limit) >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${getUsagePercentage(rateLimitData.user.count, rateLimitData.user.limit)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Resets in {formatTimeRemaining(rateLimitData.user.resetTime)}
          </p>
        </div>

        {/* API Rate Limit */}
        <div className="border-l-4 border-purple-500 pl-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">General API</span>
            <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(rateLimitData.api.count, rateLimitData.api.limit))}`}>
              {rateLimitData.api.count}/{rateLimitData.api.limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className={`h-2 rounded-full ${getUsagePercentage(rateLimitData.api.count, rateLimitData.api.limit) >= 90 ? 'bg-red-500' : getUsagePercentage(rateLimitData.api.count, rateLimitData.api.limit) >= 75 ? 'bg-yellow-500' : 'bg-purple-500'}`}
              style={{ width: `${getUsagePercentage(rateLimitData.api.count, rateLimitData.api.limit)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Resets in {formatTimeRemaining(rateLimitData.api.resetTime)}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Limits reset every minute. OpenAI: 20 requests, User: 50 actions, API: 200 requests.
        </p>
      </div>
    </div>
  )
} 