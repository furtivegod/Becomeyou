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
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#F5F1E8' }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8" style={{ color: '#4A5D23', fontFamily: 'Georgia, Times New Roman, serif' }}>
            🧪 PDF Generation Test
          </h1>
          
          <div className="space-y-6">
            <div className="rounded-lg p-6" style={{ backgroundColor: '#FFF3CD', border: '1px solid #D4AF37' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#4A5D23', fontFamily: 'Georgia, Times New Roman, serif' }}>
                Test Options
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#1A1A1A' }}>
                    1. Test with Sample Data
                  </h3>
                  <p className="mb-4" style={{ color: '#1A1A1A' }}>
                    Generate a PDF using predefined sample data to test the PDF generation system.
                  </p>
                  <button
                    onClick={testSamplePDF}
                    disabled={loading}
                    className="text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: '#4A5D23' }}
                  >
                    {loading ? 'Generating...' : 'Test Sample PDF'}
                  </button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#1A1A1A' }}>
                    2. Test with Real Database Data
                  </h3>
                  <p className="mb-4" style={{ color: '#1A1A1A' }}>
                    Generate a PDF using actual assessment data from your database.
                  </p>
                  <button
                    onClick={testRealPDF}
                    disabled={loading}
                    className="text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: '#4A5D23' }}
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
              <div className="rounded-lg p-6" style={{ backgroundColor: '#FFF3CD', border: '1px solid #D4AF37' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#4A5D23' }}>
                  ✅ Success!
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <strong style={{ color: '#1A1A1A' }}>Message:</strong> <span style={{ color: '#1A1A1A' }}>{result.message}</span>
                  </div>
                  
                  {result.pdfUrl && (
                    <div>
                      <strong style={{ color: '#1A1A1A' }}>PDF URL:</strong>{' '}
                      <a 
                        href={result.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: '#4A5D23' }}
                      >
                        Open PDF in new tab
                      </a>
                    </div>
                  )}
                  
                  {result.sessionId && (
                    <div>
                      <strong style={{ color: '#1A1A1A' }}>Session ID:</strong> <span style={{ color: '#1A1A1A' }}>{result.sessionId}</span>
                    </div>
                  )}
                  
                  {result.clientName && (
                    <div>
                      <strong style={{ color: '#1A1A1A' }}>Client Name:</strong> <span style={{ color: '#1A1A1A' }}>{result.clientName}</span>
                    </div>
                  )}
                  
                  {result.planDataKeys && (
                    <div>
                      <strong style={{ color: '#1A1A1A' }}>Plan Data Keys:</strong> <span style={{ color: '#1A1A1A' }}>{result.planDataKeys.join(', ')}</span>
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
