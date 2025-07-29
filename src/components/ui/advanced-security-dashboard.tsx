'use client'

import React, { useState, useEffect } from 'react'
import { threatDetector, securityAnalytics } from '@/lib/advanced-security'

interface SecurityStats {
  totalIPs: number
  blockedIPs: number
  suspiciousIPs: number
  averageThreatScore: number
  topThreats: string[]
}

interface AnalyticsData {
  totalEvents: number
  eventsByType: { [key: string]: number }
  eventsBySeverity: { [key: string]: number }
  recentEvents: any[]
  threatTrends: any[]
}

export default function AdvancedSecurityDashboard() {
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Update data
  const updateData = () => {
    setSecurityStats(threatDetector.getSecurityStats())
    setAnalyticsData(securityAnalytics.getAnalytics())
  }

  // Start monitoring
  useEffect(() => {
    if (isMonitoring) {
      updateData()
      const interval = setInterval(updateData, 5000) // Update every 5 seconds
      return () => clearInterval(interval)
    }
  }, [isMonitoring])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(updateData, 10000) // Update every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // Initial data load
  useEffect(() => {
    updateData()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getThreatLevel = (score: number) => {
    if (score >= 80) return { level: 'Critical', color: 'text-red-600', bg: 'bg-red-100' }
    if (score >= 60) return { level: 'High', color: 'text-orange-600', bg: 'bg-orange-100' }
    if (score >= 40) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (score >= 20) return { level: 'Low', color: 'text-blue-600', bg: 'bg-blue-100' }
    return { level: 'Safe', color: 'text-green-600', bg: 'bg-green-100' }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🛡️ Advanced Security Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-4 py-2 rounded text-white ${
              isMonitoring 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded text-white ${
              autoRefresh 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </button>
          
          <button
            onClick={updateData}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Security Statistics */}
      {securityStats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{securityStats.totalIPs}</div>
            <div className="text-sm text-gray-600">Total IPs</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{securityStats.blockedIPs}</div>
            <div className="text-sm text-red-600">Blocked IPs</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{securityStats.suspiciousIPs}</div>
            <div className="text-sm text-orange-600">Suspicious IPs</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{securityStats.averageThreatScore}</div>
            <div className="text-sm text-blue-600">Avg Threat Score</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {securityStats.blockedIPs > 0 ? '🛡️' : '✅'}
            </div>
            <div className="text-sm text-green-600">Protection Active</div>
          </div>
        </div>
      )}

      {/* Top Threats */}
      {securityStats && securityStats.topThreats.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Threats Detected</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {securityStats.topThreats.map((threat, index) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-red-600">⚠️</span>
                  <span className="font-medium text-red-800">{threat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Analytics */}
      {analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Events by Type */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Events by Type</h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.eventsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700 capitalize">
                    {type.replace('_', ' ')}
                  </span>
                  <span className="text-lg font-bold text-blue-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Events by Severity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Events by Severity</h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.eventsBySeverity).map(([severity, count]) => (
                <div key={severity} className={`flex items-center justify-between p-3 rounded-lg ${getSeverityColor(severity)}`}>
                  <span className="font-medium capitalize">
                    {severity}
                  </span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Security Events */}
      {analyticsData && analyticsData.recentEvents.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analyticsData.recentEvents.slice(-10).reverse().map((event, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(event.severity)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">
                      {event.type.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      event.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {event.severity}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {event.details && (
                  <div className="text-sm text-gray-700">
                    <pre className="bg-white bg-opacity-50 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threat Trends Chart */}
      {analyticsData && analyticsData.threatTrends.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Threat Trends (Last 24 Hours)</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-12 gap-1 h-32 items-end">
              {analyticsData.threatTrends.map((trend, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-full bg-blue-200 rounded-t" style={{ 
                    height: `${Math.max(10, (trend.count / Math.max(...analyticsData.threatTrends.map(t => t.count))) * 100)}%` 
                  }}>
                    {trend.critical > 0 && (
                      <div className="w-full bg-red-500 rounded-t" style={{ 
                        height: `${(trend.critical / trend.count) * 100}%` 
                      }}></div>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{trend.hour}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-200 rounded"></div>
                <span>Total Events</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Critical Events</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="mt-8 p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-2">System Status</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Threat Detection:</span>
            <span className="ml-2 text-green-600">✅ Active</span>
          </div>
          <div>
            <span className="font-medium">IP Blocking:</span>
            <span className="ml-2 text-green-600">✅ Active</span>
          </div>
          <div>
            <span className="font-medium">Analytics:</span>
            <span className="ml-2 text-green-600">✅ Active</span>
          </div>
          <div>
            <span className="font-medium">Monitoring:</span>
            <span className={`ml-2 ${isMonitoring ? 'text-green-600' : 'text-red-600'}`}>
              {isMonitoring ? '✅ Active' : '❌ Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 