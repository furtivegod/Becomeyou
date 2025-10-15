"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'
import ConsentScreen from '@/components/ConsentScreen'

interface AssessmentPageProps {
  params: Promise<{ sessionId: string }>
  searchParams: { token?: string }
}

export default function AssessmentPage({ params, searchParams }: AssessmentPageProps) {
  const [sessionId, setSessionId] = useState<string>('')
  const [hasConsented, setHasConsented] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setSessionId(resolvedParams.sessionId)
    }
    getParams()
  }, [params])

  useEffect(() => {
    let isMounted = true
    async function validate() {
      if (!searchParams.token) {
        if (isMounted) setIsValid(false)
        return
      }
      try {
        const res = await fetch(`/api/jwt?token=${encodeURIComponent(searchParams.token)}`)
        if (!res.ok) {
          if (isMounted) setIsValid(false)
          return
        }
        const data = await res.json()
        if (isMounted) setIsValid(data.valid === true && data.sessionId === sessionId)
      } catch (e) {
        console.error('Token validation failed:', e)
        if (isMounted) setIsValid(false)
      }
    }
    if (sessionId) {
      validate()
    }
    return () => { isMounted = false }
  }, [searchParams.token, sessionId])

  const handleComplete = useCallback(async () => {
    // Show loading state while generating report
    setIsGeneratingReport(true)
    
    // Trigger report generation FIRST
    try {
      console.log('Starting report generation...')
      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      })
      
      if (response.ok) {
        console.log('Report generation completed successfully')
        // Only show completion screen AFTER email is sent
        setIsGeneratingReport(false)
        setIsComplete(true)
      } else {
        console.error('Failed to trigger report generation')
        // Show error state instead of completion
        setIsGeneratingReport(false)
        setIsComplete(true) // Still show completion but with error message
      }
    } catch (error) {
      console.error('Error triggering report generation:', error)
      // Show error state
      setIsGeneratingReport(false)
      setIsComplete(true)
    }
  }, [sessionId])

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F1E8' }}>
        <div className="text-center max-w-md w-full">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#4A5D23', borderTopColor: 'transparent' }}></div>
          <h1 className="text-lg sm:text-xl font-semibold" style={{ color: '#1A1A1A' }}>Validating access…</h1>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F1E8' }}>
        <div className="text-center max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: '#4A5D23', fontFamily: 'Georgia, Times New Roman, serif' }}>Access Denied</h1>
          <p className="mb-6 text-sm sm:text-base" style={{ color: '#1A1A1A' }}>
            This assessment link is invalid or has expired. Please check your email for a valid link.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm sm:text-base hover:opacity-90"
            style={{ backgroundColor: '#4A5D23' }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!hasConsented) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F1E8' }}>
        <div className="max-w-2xl w-full">
          <ConsentScreen onConsent={() => setHasConsented(true)} />
        </div>
      </div>
    )
  }

  if (isGeneratingReport) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F1E8' }}>
        <div className="text-center max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4A5D23', borderTopColor: 'transparent' }}></div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: '#4A5D23', fontFamily: 'Georgia, Times New Roman, serif' }}>Generating Your Report</h1>
          <p className="mb-6 text-sm sm:text-base" style={{ color: '#1A1A1A' }}>
            Creating your personalized You 3.0 assessment report and sending it to your email...
          </p>
          <div className="rounded-md p-4" style={{ backgroundColor: '#E3F2FD', border: '1px solid #2196F3' }}>
            <p className="text-sm" style={{ color: '#1565C0' }}>
              ⏳ This usually takes 30-60 seconds
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F1E8' }}>
        <div className="text-center max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: '#4A5D23', fontFamily: 'Georgia, Times New Roman, serif' }}>Assessment Complete!</h1>
          <p className="mb-6 text-sm sm:text-base" style={{ color: '#1A1A1A' }}>
            Your personalized You 3.0 report has been generated and sent to your email.
          </p>
          <div className="rounded-md p-4" style={{ backgroundColor: '#FFF3CD', border: '1px solid #D4AF37' }}>
            <p className="text-sm" style={{ color: '#856404' }}>
              📧 Check your email for your personalized 30-day protocol
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F1E8' }}>
      <ChatInterface sessionId={sessionId} onComplete={handleComplete} />
    </div>
  )
}