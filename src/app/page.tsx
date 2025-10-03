"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {

  
  const router = useRouter()
  router.push('/test-pdf');

  useEffect(() => {
    // Get SamCart URL from environment variable
    const samcartUrl = process.env.NEXT_PUBLIC_SAMCART_URL
    
    if (samcartUrl) {
      // Redirect to SamCart
      window.location.href = samcartUrl
    } else {
      // Fallback to API tester if no SamCart URL is configured
      router.push('/api-tester')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-lg font-semibold text-gray-700">Redirecting to SamCart...</h1>
        <p className="text-sm text-gray-500 mt-2">Please wait while we redirect you to the purchase page.</p>
      </div>
    </div>
  )
}