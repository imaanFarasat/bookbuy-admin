'use client'

import React, { useState, useEffect } from 'react'

interface SecurityEvent {
  id: string
  timestamp: string
  type: 'validation_failed' | 'rate_limit_exceeded' | 'malicious_content' | 'xss_attempt' | 'oversized_request'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details?: any
  ip?: string
  userAgent?: string
}

export default function SecurityMonitor() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [stats, setStats] = useState({
    totalEvents: 0,
    criticalEvents: 0,
    highEvents: 0,
    mediumEvents: 0,
    lowEvents: 0
  })

  // Simulate security events (in a real app, these would come from your backend)
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      const mockEvents: SecurityEvent[] = [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'validation_failed',
          severity: 'low',
          message: 'Invalid handle format detected',
          details: { field: 'handle', value: 'invalid@handle' },
          ip: '192.168.1.100'
        },
        {
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toISOString(),
          type: 'xss_attempt',
          severity: 'high',
          message: 'XSS payload detected in content',
          details: { payload: '<script>alert("xss")</script>' },
          ip: '10.0.0.50'
        },
        {
          id: (Date.now() + 2).toString(),
          timestamp: new Date().toISOString(),
          type: 'rate_limit_exceeded',
          severity: 'medium',
          message: 'Rate limit exceeded for OpenAI API',
          details: { endpoint: '/api/generate-content', limit: 20 },
          ip: '172.16.0.25'
        }
      ]

      // Randomly add events
      if (Math.random() > 0.7) {
        const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)]
        setEvents(prev => [randomEvent, ...prev.slice(0, 49)]) // Keep last 50 events
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [isMonitoring])

  // Update stats when events change
  useEffect(() => {
    const newStats = {
      totalEvents: events.length,
      criticalEvents: events.filter(e => e.severity === 'critical').length,
      highEvents: events.filter(e => e.severity === 'high').length,
      mediumEvents: events.filter(e => e.severity === 'medium').length,
      lowEvents: events.filter(e => e.severity === 'low').length
    }
    setStats(newStats)
  }, [events])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'validation_failed': return '⚠️'
      case 'rate_limit_exceeded': return '🚫'
      case 'malicious_content': return '🛡️'
      case 'xss_attempt': return '💉'
      case 'oversized_request': return '📏'
      default: return '🔍'
    }
  }

  const clearEvents = () => {
    setEvents([])
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🛡️ Security Monitor</h2>
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
            onClick={clearEvents}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Events
          </button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{stats.totalEvents}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div>
          <div className="text-sm text-red-600">Critical</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{stats.highEvents}</div>
          <div className="text-sm text-orange-600">High</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.mediumEvents}</div>
          <div className="text-sm text-yellow-600">Medium</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.lowEvents}</div>
          <div className="text-sm text-blue-600">Low</div>
        </div>
      </div>

      {/* Security Events */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Security Events</h3>
        
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🛡️</div>
            <p>No security events detected</p>
            <p className="text-sm">Start monitoring to see security events in real-time</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg border ${getSeverityColor(event.severity)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(event.type)}</span>
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
                
                <div className="text-sm">
                  <div className="mb-1">
                    <strong>Message:</strong> {event.message}
                  </div>
                  
                  {event.ip && (
                    <div className="mb-1">
                      <strong>IP:</strong> {event.ip}
                    </div>
                  )}
                  
                  {event.details && (
                    <div>
                      <strong>Details:</strong>
                      <pre className="mt-1 text-xs bg-white bg-opacity-50 p-2 rounded">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Status */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-2">Security Status</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Monitoring:</span>
            <span className={`ml-2 ${isMonitoring ? 'text-green-600' : 'text-red-600'}`}>
              {isMonitoring ? '✅ Active' : '❌ Inactive'}
            </span>
          </div>
          <div>
            <span className="font-medium">Last Event:</span>
            <span className="ml-2 text-gray-600">
              {events.length > 0 
                ? new Date(events[0].timestamp).toLocaleString()
                : 'None'
              }
            </span>
          </div>
          <div>
            <span className="font-medium">Critical Alerts:</span>
            <span className="ml-2 text-red-600">
              {stats.criticalEvents > 0 ? `⚠️ ${stats.criticalEvents}` : '✅ None'}
            </span>
          </div>
          <div>
            <span className="font-medium">System Status:</span>
            <span className="ml-2 text-green-600">✅ Secure</span>
          </div>
        </div>
      </div>
    </div>
  )
} 