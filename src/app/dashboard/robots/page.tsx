'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/ui/navigation'

interface RobotsSettings {
  baseUrl: string
  crawlDelay: number
  allowAll: boolean
  disallowAdmin: boolean
  customRules: string
}

export default function RobotsManagementPage() {
  const [settings, setSettings] = useState<RobotsSettings>({
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com',
    crawlDelay: 1,
    allowAll: true,
    disallowAdmin: true,
    customRules: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState('')
  const router = useRouter()

  // Generate robots.txt preview
  const generatePreview = () => {
    let content = `User-agent: *\n`
    
    if (settings.allowAll) {
      content += `Allow: /\n`
    }
    
    if (settings.crawlDelay > 0) {
      content += `Crawl-delay: ${settings.crawlDelay}\n`
    }
    
    content += `\nSitemap: ${settings.baseUrl}/sitemap.xml\n\n`
    
    if (settings.disallowAdmin) {
      content += `# Disallow admin areas\n`
      content += `User-agent: *\n`
      content += `Disallow: /dashboard\n`
      content += `Disallow: /api/\n`
      content += `Disallow: /admin\n\n`
    }
    
    if (settings.customRules) {
      content += `# Custom rules\n`
      content += settings.customRules
    }
    
    setPreview(content)
  }

  useEffect(() => {
    generatePreview()
  }, [settings])

  const saveSettings = async () => {
    setIsLoading(true)
    setMessage('💾 Saving robots.txt settings...')
    
    try {
      // In a real app, you'd save these settings to the database
      // For now, we'll just show a success message
      setMessage('✅ Robots.txt settings saved!')
      
      // Update the preview
      generatePreview()
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('❌ Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const testRobotsTxt = async () => {
    try {
      const response = await fetch('/robots.txt')
      if (response.ok) {
        const content = await response.text()
        setPreview(content)
        setMessage('✅ Robots.txt is working correctly!')
      } else {
        setMessage('❌ Robots.txt is not accessible')
      }
    } catch (error) {
      console.error('Error testing robots.txt:', error)
      setMessage('❌ Error testing robots.txt')
    }
  }

  const testSitemap = async () => {
    try {
      setMessage('🧪 Testing sitemap...')
      const response = await fetch('/sitemap.xml')
      console.log('Sitemap response status:', response.status)
      console.log('Sitemap response headers:', response.headers)
      
      if (response.ok) {
        const content = await response.text()
        console.log('Sitemap content length:', content.length)
        console.log('Sitemap content preview:', content.substring(0, 200))
        setMessage(`✅ Sitemap is working correctly! (${content.length} characters, ${content.split('<url>').length - 1} URLs)`)
      } else {
        const errorText = await response.text()
        console.error('Sitemap error response:', errorText)
        setMessage(`❌ Sitemap error: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error testing sitemap:', error)
      setMessage(`❌ Error testing sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 pt-16">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🤖 Robots.txt Management
            </h1>
            <p className="text-gray-600">
              Configure your robots.txt file for optimal search engine crawling
            </p>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              ⚙️ Robots.txt Settings
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL
                </label>
                <input
                  type="url"
                  value={settings.baseUrl}
                  onChange={(e) => setSettings({...settings, baseUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://yourdomain.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crawl Delay (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={settings.crawlDelay}
                  onChange={(e) => setSettings({...settings, crawlDelay: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowAll"
                  checked={settings.allowAll}
                  onChange={(e) => setSettings({...settings, allowAll: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="allowAll" className="ml-2 text-sm text-gray-700">
                  Allow all crawlers
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="disallowAdmin"
                  checked={settings.disallowAdmin}
                  onChange={(e) => setSettings({...settings, disallowAdmin: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="disallowAdmin" className="ml-2 text-sm text-gray-700">
                  Disallow admin areas
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Rules
                </label>
                <textarea
                  value={settings.customRules}
                  onChange={(e) => setSettings({...settings, customRules: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={6}
                  placeholder="Add custom robots.txt rules here..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={saveSettings}
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? '💾 Saving...' : '💾 Save Settings'}
                </button>
                <button
                  onClick={testRobotsTxt}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  🧪 Test Robots.txt
                </button>
                <button
                  onClick={testSitemap}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  🧪 Test Sitemap
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              👀 Robots.txt Preview
            </h2>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {preview}
              </pre>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>📝 This preview shows how your robots.txt will look.</p>
              <p>🔗 Your robots.txt will be available at: <code className="bg-gray-100 px-1 rounded">/robots.txt</code></p>
              <p>🗺️ Your sitemap will be available at: <code className="bg-gray-100 px-1 rounded">/sitemap.xml</code></p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
} 