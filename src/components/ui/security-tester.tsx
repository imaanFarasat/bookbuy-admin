'use client'

import React, { useState } from 'react'
import { SecurityTestUtils } from '@/lib/security-tests'

interface TestResult {
  success: boolean
  response: any
}

export default function SecurityTester() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedTest, setSelectedTest] = useState('xss')
  const [customPayload, setCustomPayload] = useState('')

  const testPayloads = SecurityTestUtils.generateTestPayloads()

  const runSecurityTest = async (payload: string, testType: string) => {
    setIsRunning(true)
    try {
      const result = await SecurityTestUtils.testAPIEndpoint('/api/security-test', {
        testType,
        payload
      })
      
      setTestResults(prev => [...prev, {
        success: result.success,
        response: {
          testType,
          payload,
          ...result.response
        }
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        success: false,
        response: {
          testType,
          payload,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }])
    } finally {
      setIsRunning(false)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    const allTests: Array<{ payload: string; type: string }> = []
    
    // Add XSS tests
    testPayloads.xss.forEach(payload => {
      allTests.push({ payload, type: 'xss' })
    })
    
    // Add SQL injection tests
    testPayloads.sqlInjection.forEach(payload => {
      allTests.push({ payload, type: 'validation' })
    })
    
    // Add malicious URL tests
    testPayloads.maliciousUrls.forEach(payload => {
      allTests.push({ payload, type: 'url' })
    })
    
    // Add oversized content tests
    testPayloads.oversizedContent.forEach(payload => {
      allTests.push({ payload, type: 'validation' })
    })
    
    // Run all tests
    for (const test of allTests) {
      await runSecurityTest(test.payload, test.type)
    }
    
    setIsRunning(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🔒 Security Tester</h2>
      
      {/* Test Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isRunning ? 'Running Tests...' : 'Run All Security Tests'}
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
        
        {/* Custom Test */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Test Payload
            </label>
            <input
              type="text"
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              placeholder="Enter test payload..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="xss">XSS Test</option>
            <option value="validation">Validation Test</option>
            <option value="url">URL Test</option>
          </select>
          
          <button
            onClick={() => runSecurityTest(customPayload, selectedTest)}
            disabled={!customPayload || isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test
          </button>
        </div>
      </div>
      
      {/* Test Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
        
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet. Click "Run All Security Tests" to start.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? '✅ PASSED' : '❌ FAILED'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {result.response.testType?.toUpperCase()}
                  </span>
                </div>
                
                <div className="text-sm">
                  <div className="mb-1">
                    <strong>Payload:</strong> 
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                      {result.response.payload?.substring(0, 50)}
                      {result.response.payload?.length > 50 ? '...' : ''}
                    </code>
                  </div>
                  
                  {result.response.error && (
                    <div className="text-red-600">
                      <strong>Error:</strong> {result.response.error}
                    </div>
                  )}
                  
                  {result.response.result && (
                    <div className="text-gray-700">
                      <strong>Result:</strong> {JSON.stringify(result.response.result, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Security Status */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Security Status</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">XSS Protection:</span>
            <span className="ml-2 text-green-600">✅ Active</span>
          </div>
          <div>
            <span className="font-medium">Input Validation:</span>
            <span className="ml-2 text-green-600">✅ Active</span>
          </div>
          <div>
            <span className="font-medium">Rate Limiting:</span>
            <span className="ml-2 text-green-600">✅ Active</span>
          </div>
          <div>
            <span className="font-medium">Security Headers:</span>
            <span className="ml-2 text-green-600">✅ Active</span>
          </div>
        </div>
      </div>
    </div>
  )
} 