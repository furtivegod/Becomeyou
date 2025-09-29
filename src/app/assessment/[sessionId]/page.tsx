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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-700">Validating access…</h1>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
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
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Assessment Complete!</h1>
            <p className="text-gray-600">Your personalized 30-day protocol is being generated and will be sent to your email shortly.</p>
          </div>
          <div className="text-sm text-gray-500">
            Redirecting to your report...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
          <div className="border-b p-4">
            <h1 className="text-2xl font-bold text-gray-800">BECOME YOU Assessment</h1>
            <p className="text-gray-600">Let's discover your path to transformation</p>
          </div>
          <ChatInterface 
            sessionId={sessionId} 
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  )
}