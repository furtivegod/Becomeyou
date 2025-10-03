'use client'

import { useState } from 'react'

export default function TestPDFPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testSamplePDF = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test-pdf')
      const data = await response.json()
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Test failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testRealPDF = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test-pdf-real')
      const data = await response.json()
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Test failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 PDF Generation Test
          </h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                Test Options
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    1. Test with Sample Data
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Generate a PDF using predefined sample data to test the PDF generation system.
                  </p>
                  <button
                    onClick={testSamplePDF}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Test Sample PDF'}
                  </button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    2. Test with Real Database Data
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Generate a PDF using actual assessment data from your database.
                  </p>
                  <button
                    onClick={testRealPDF}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Test Real PDF'}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  ❌ Error
                </h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  ✅ Success!
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <strong>Message:</strong> {result.message}
                  </div>
                  
                  {result.pdfUrl && (
                    <div>
                      <strong>PDF URL:</strong>{' '}
                      <a 
                        href={result.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Open PDF in new tab
                      </a>
                    </div>
                  )}
                  
                  {result.sessionId && (
                    <div>
                      <strong>Session ID:</strong> {result.sessionId}
                    </div>
                  )}
                  
                  {result.clientName && (
                    <div>
                      <strong>Client Name:</strong> {result.clientName}
                    </div>
                  )}
                  
                  {result.planDataKeys && (
                    <div>
                      <strong>Plan Data Keys:</strong> {result.planDataKeys.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
