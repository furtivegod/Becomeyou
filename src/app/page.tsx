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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F1E8' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#4A5D23', borderTopColor: 'transparent' }}></div>
        <h1 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Redirecting to SamCart...</h1>
        <p className="text-sm mt-2" style={{ color: '#666' }}>Please wait while we redirect you to the purchase page.</p>
      </div>
    </div>
  )
}