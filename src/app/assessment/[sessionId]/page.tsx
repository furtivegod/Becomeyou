"use client"

import { useState, useEffect } from 'react'
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

  const handleComplete = () => {
    setIsComplete(true)
    setTimeout(() => {
      router.push(`/api/report/${sessionId}`)
    }, 3000)
  }

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-700">Validating access…</h1>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            This assessment link is invalid or has expired. Please check your email for a valid link.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!hasConsented) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <ConsentScreen onConsent={() => setHasConsented(true)} />
        </div>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Your personalized You 3.0 report is being generated and will be sent to your email shortly.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-800 text-sm">
              📧 Check your email for your personalized 30-day protocol
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ChatInterface sessionId={sessionId} onComplete={handleComplete} />
    </div>
  )
}