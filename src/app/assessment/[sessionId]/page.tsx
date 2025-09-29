"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'
import ConsentScreen from '@/components/ConsentScreen'

interface AssessmentPageProps {
  params: { sessionId: string }
  searchParams: { token?: string }
}

export default function AssessmentPage({ params, searchParams }: AssessmentPageProps) {
  const { sessionId } = params
  const { token } = searchParams
  const [hasConsented, setHasConsented] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    async function validate() {
      if (!token) {
        if (isMounted) setIsValid(false)
        return
      }
      try {
        const res = await fetch(`/api/jwt?token=${encodeURIComponent(token)}`)
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
    validate()
    return () => { isMounted = false }
  }, [token, sessionId])

  const handleComplete = () => {
    setIsComplete(true)
    // Redirect to report after a short delay
    setTimeout(() => {
      router.push(`/api/report/${sessionId}`)
    }, 3000)
  }

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-700">Validating access…</h1>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Access</h1>
          <p className="text-gray-600">This assessment link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  if (!hasConsented) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ConsentScreen onConsent={() => setHasConsented(true)} />
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Assessment Complete!</h1>
            <p className="text-gray-600 mb-4">Your personalized 30-day protocol is being generated and will be sent to your email shortly.</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Redirecting to your report...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '700px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex-shrink-0">
            <h1 className="text-2xl font-bold mb-2">BECOME YOU Assessment</h1>
            <p className="text-blue-100">Let's discover your path to transformation</p>
          </div>
          
          {/* Chat Interface - Takes remaining height */}
          <div className="flex-1 flex flex-col" style={{ height: 'calc(100% - 120px)' }}>
            <ChatInterface 
              sessionId={sessionId} 
              onComplete={handleComplete}
            />
          </div>
        </div>
      </div>
    </div>
  )
}