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
                Test PDF Generation with Sample Data
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#1A1A1A' }}>
                    Generate Sample Assessment PDF
                  </h3>
                  <p className="mb-4" style={{ color: '#1A1A1A' }}>
                    This will generate a PDF using predefined sample assessment data to test the PDF generation system. 
                    The sample includes a complete assessment report with all sections: overview, sabotage analysis, 
                    domain breakdown, nervous system assessment, and 30-day protocol.
                  </p>
                  <button
                    onClick={testSamplePDF}
                    disabled={loading}
                    className="text-white px-8 py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 text-lg font-semibold"
                    style={{ backgroundColor: '#4A5D23' }}
                  >
                    {loading ? '🔄 Generating PDF...' : '📄 Generate Sample PDF'}
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
              <div className="rounded-lg p-6" style={{ backgroundColor: '#E8F5E8', border: '1px solid #4A5D23' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#4A5D23' }}>
                  ✅ PDF Generated Successfully!
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold mb-2" style={{ color: '#4A5D23' }}>📄 Generated PDF</h4>
                    {result.pdfUrl && (
                      <div className="flex items-center space-x-4">
                        <a 
                          href={result.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          📖 Open PDF in New Tab
                        </a>
                        <span className="text-sm text-gray-600">
                          Click to view the generated assessment report
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold mb-2" style={{ color: '#4A5D23' }}>📊 Test Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Status:</strong> <span className="text-green-600">✅ Success</span>
                      </div>
                      <div>
                        <strong>Session ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{result.sessionId}</code>
                      </div>
                      <div>
                        <strong>Test Type:</strong> Sample Data Assessment
                      </div>
                      <div>
                        <strong>Message:</strong> {result.message}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold mb-2" style={{ color: '#1E40AF' }}>💡 What This Test Validates</h4>
                    <ul className="text-sm space-y-1" style={{ color: '#1E40AF' }}>
                      <li>• PDF generation system is working correctly</li>
                      <li>• Sample assessment data is properly formatted</li>
                      <li>• All report sections are rendering correctly</li>
                      <li>• PDFShift API integration is functional</li>
                      <li>• File storage and URL generation works</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
