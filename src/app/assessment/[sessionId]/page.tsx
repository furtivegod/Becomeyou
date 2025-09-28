"use client"

import { useEffect, useState } from "react"
import ChatInterface from "@/components/ChatInterface"
import ConsentScreen from "@/components/ConsentScreen"

interface AssessmentPageProps {
  params: { sessionId: string }
  searchParams: { token?: string }
}

export default function AssessmentPage({ params, searchParams }: AssessmentPageProps) {
  const { sessionId } = params
  const { token } = searchParams
  const [hasConsented, setHasConsented] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
            <div className="border-b p-4">
              <h1 className="text-2xl font-bold text-gray-800">BECOME YOU Assessment</h1>
              <p className="text-gray-600">Let&apos;s discover your path to transformation</p>
            </div>
            <ChatInterface 
              sessionId={sessionId} 
              onComplete={() => {
                console.log('Assessment completed')
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 