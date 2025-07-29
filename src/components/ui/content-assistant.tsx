'use client'

import React, { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, PaperAirplaneIcon, DocumentTextIcon, QuestionMarkCircleIcon, CodeBracketIcon } from '@heroicons/react/24/outline'

interface ContentAssistantProps {
  onContentGenerated?: (content: string) => void
  onFAQGenerated?: (faqContent: string) => void
  onSchemaGenerated?: (schema: string) => void
}

interface H2Keyword {
  keyword: string
  instruction: string
}

export default function ContentAssistant({ 
  onContentGenerated, 
  onFAQGenerated, 
  onSchemaGenerated 
}: ContentAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mainTopic, setMainTopic] = useState('')
  const [contentType, setContentType] = useState('comprehensive guide')
  const [h2Keywords, setH2Keywords] = useState<H2Keyword[]>([
    { keyword: '', instruction: '' }
  ])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [generatedFAQ, setGeneratedFAQ] = useState('')
  const [generatedSchema, setGeneratedSchema] = useState('')
  const [activeTab, setActiveTab] = useState<'content' | 'faq' | 'schema'>('content')

  const addH2Keyword = () => {
    setH2Keywords([...h2Keywords, { keyword: '', instruction: '' }])
  }

  const removeH2Keyword = (index: number) => {
    if (h2Keywords.length > 1) {
      setH2Keywords(h2Keywords.filter((_, i) => i !== index))
    }
  }

  const updateH2Keyword = (index: number, field: 'keyword' | 'instruction', value: string) => {
    const updated = [...h2Keywords]
    updated[index][field] = value
    setH2Keywords(updated)
  }

  const generateContent = async () => {
    if (!mainTopic || h2Keywords.some(k => !k.keyword)) {
      alert('Please fill in the main topic and all H2 keywords')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/assistant/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mainTopic,
          h2Keywords: h2Keywords.map(k => k.keyword),
          customInstructions: h2Keywords.map(k => k.instruction).filter(i => i.trim()),
          contentType
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedContent(data.content)
        onContentGenerated?.(data.content)
        setActiveTab('content')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error generating content:', error)
      alert('Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateFAQ = async () => {
    if (!generatedContent) {
      alert('Please generate content first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/assistant/generate-faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: generatedContent,
          mainKeyword: mainTopic,
          questionCount: 20
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedFAQ(data.faqContent)
        onFAQGenerated?.(data.faqContent)
        setActiveTab('faq')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error generating FAQ:', error)
      alert('Failed to generate FAQ')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSchema = async () => {
    if (!generatedFAQ) {
      alert('Please generate FAQ first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/assistant/generate-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faqContent: generatedFAQ,
          mainKeyword: mainTopic
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedSchema(data.schema)
        onSchemaGenerated?.(data.schema)
        setActiveTab('schema')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error generating schema:', error)
      alert('Failed to generate schema')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Content Assistant</h3>
        </div>
        {isOpen ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {isOpen && (
        <div className="border-t border-gray-200 p-4">
          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Topic
              </label>
              <input
                type="text"
                value={mainTopic}
                onChange={(e) => setMainTopic(e.target.value)}
                placeholder="e.g., Nail Salon Near Me, Amethyst, SEO Tips"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="comprehensive guide">Comprehensive Guide</option>
                <option value="how-to tutorial">How-To Tutorial</option>
                <option value="product list">Product List</option>
                <option value="service directory">Service Directory</option>
                <option value="comparison guide">Comparison Guide</option>
                <option value="educational article">Educational Article</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                H2 Keywords & Instructions
              </label>
              <div className="space-y-3">
                {h2Keywords.map((h2, index) => (
                  <div key={index} className="flex space-x-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={h2.keyword}
                        onChange={(e) => updateH2Keyword(index, 'keyword', e.target.value)}
                        placeholder="H2 keyword"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={h2.instruction}
                        onChange={(e) => updateH2Keyword(index, 'instruction', e.target.value)}
                        placeholder="Custom instruction (optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => removeH2Keyword(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addH2Keyword}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add H2 Keyword
                </button>
              </div>
            </div>

            <button
              onClick={generateContent}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Generate Content'}</span>
            </button>
          </div>

          {/* Results Tabs */}
          {(generatedContent || generatedFAQ || generatedSchema) && (
            <div className="mt-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {generatedContent && (
                    <button
                      onClick={() => setActiveTab('content')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'content'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Generated Content
                    </button>
                  )}
                  {generatedFAQ && (
                    <button
                      onClick={() => setActiveTab('faq')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'faq'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      FAQ
                    </button>
                  )}
                  {generatedSchema && (
                    <button
                      onClick={() => setActiveTab('schema')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'schema'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Schema
                    </button>
                  )}
                </nav>
              </div>

              <div className="mt-4">
                {activeTab === 'content' && generatedContent && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Generated Content</h4>
                      <button
                        onClick={() => copyToClipboard(generatedContent)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">{generatedContent}</pre>
                    </div>
                    <button
                      onClick={generateFAQ}
                      disabled={isGenerating}
                      className="mt-3 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <QuestionMarkCircleIcon className="w-4 h-4" />
                      <span>{isGenerating ? 'Generating...' : 'Generate FAQ'}</span>
                    </button>
                  </div>
                )}

                {activeTab === 'faq' && generatedFAQ && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Generated FAQ</h4>
                      <button
                        onClick={() => copyToClipboard(generatedFAQ)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">{generatedFAQ}</pre>
                    </div>
                    <button
                      onClick={generateSchema}
                      disabled={isGenerating}
                      className="mt-3 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <CodeBracketIcon className="w-4 h-4" />
                      <span>{isGenerating ? 'Generating...' : 'Generate Schema'}</span>
                    </button>
                  </div>
                )}

                {activeTab === 'schema' && generatedSchema && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Generated Schema</h4>
                      <button
                        onClick={() => copyToClipboard(generatedSchema)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">{generatedSchema}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 