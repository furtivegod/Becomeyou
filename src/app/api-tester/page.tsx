"use client"

import { useState, useEffect } from "react"

// Responsive Toast component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-2 right-2 sm:top-4 sm:right-4 z-50 p-3 sm:p-4 rounded-lg shadow-lg max-w-sm sm:max-w-md ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center space-x-2">
        <span className="text-sm sm:text-base">{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200 text-lg">
          ×
        </button>
      </div>
    </div>
  )
}

export default function BecomeYou_API_TesterPage() {
  const [email, setEmail] = useState("deondreivory328@gmail.com")
  const [status, setStatus] = useState("completed")
  const [orderId, setOrderId] = useState("sc_test_123")
  const [loading, setLoading] = useState(false)
  const [responseText, setResponseText] = useState("")
  const [webhookData, setWebhookData] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  const [sessionUserId, setSessionUserId] = useState("")
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionResponse, setSessionResponse] = useState("")

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  const callWebhook = async () => {
    setLoading(true)
    setResponseText("")
    setWebhookData(null)

    try {
      const bodyObj = { status, customer_email: email, order_id: orderId }
      
      const sigRes = await fetch("/api/samcart/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: bodyObj })
      })
      
      if (!sigRes.ok) {
        const err = await sigRes.text()
        setResponseText("Signing failed: " + err)
        setLoading(false)
        showToast("Failed to sign webhook request", "error")
        return
      }
      
      const { signature } = await sigRes.json()

      const res = await fetch("/api/samcart/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-samcart-signature": signature
        },
        body: JSON.stringify(bodyObj)
      })

      const text = await res.text()
      try {
        const json = JSON.parse(text)
        setResponseText(JSON.stringify(json, null, 2))
        setWebhookData(json)
        
        if (json.emailed) {
          showToast(`Assessment link successfully sent to ${email}`, "success")
        } else {
          showToast("Webhook processed but email may not have been sent", "error")
        }
      } catch {
        setResponseText(text)
        showToast("Failed to parse webhook response", "error")
      }
    } catch (e: any) {
      setResponseText("Request failed: " + (e?.message || String(e)))
      showToast("Webhook request failed", "error")
    } finally {
      setLoading(false)
    }
  }

  const createSession = async () => {
    setSessionLoading(true)
    setSessionResponse("")
    try {
      const res = await fetch("/api/assessment/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sessionUserId })
      })
      const text = await res.text()
      try {
        const json = JSON.parse(text)
        setSessionResponse(JSON.stringify(json, null, 2))
        showToast("Session created successfully", "success")
      } catch {
        setSessionResponse(text)
        showToast("Failed to parse session response", "error")
      }
    } catch (e: any) {
      setSessionResponse("Request failed: " + (e?.message || String(e)))
      showToast("Session creation failed", "error")
    } finally {
      setSessionLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F1E8' }}>
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Main Workflow Tester */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4" style={{ color: '#4A5D23', fontFamily: 'Georgia, Times New Roman, serif' }}>
            Complete SamCart → Assessment Workflow Tester
          </h1>
          <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{ color: '#1A1A1A' }}>
            Simulate the full user journey: SamCart purchase → webhook → magic link → assessment → PDF.
          </p>

          <div className="space-y-4 sm:space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="sc_test_123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="completed">completed</option>
                  <option value="failed">failed</option>
                </select>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={callWebhook}
                disabled={loading}
                className="w-full sm:w-auto text-white px-4 py-2 sm:py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm sm:text-base font-medium hover:opacity-90"
                style={{ backgroundColor: '#4A5D23' }}
              >
                {loading ? 'Processing…' : '1. Simulate SamCart Purchase'}
              </button>
            </div>

            {/* Success Message */}
            {webhookData && webhookData.emailed && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">✅ Purchase Complete!</h3>
                <p className="text-green-700 mb-3 text-sm sm:text-base">
                  User created, order placed, session started. Magic link has been sent to your email!
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Check your email ({email}) for the magic link to access the assessment.
                </p>
              </div>
            )}

            {/* Response Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Response</label>
              <pre className="w-full bg-gray-100 rounded-md p-3 overflow-auto text-xs sm:text-sm whitespace-pre-wrap overflow-x-auto">
                {responseText}
              </pre>
            </div>
          </div>
        </div>

        {/* Manual Session Tester */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Manual Session Tester</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Create an assessment session directly via <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">/api/assessment/session</code>.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supabase User ID</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={sessionUserId}
                onChange={(e) => setSessionUserId(e.target.value)}
                placeholder="uuid-of-existing-user"
              />
            </div>

            <button
              onClick={createSession}
              disabled={sessionLoading}
              className="w-full sm:w-auto text-white px-4 py-2 sm:py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm sm:text-base font-medium hover:opacity-90"
              style={{ backgroundColor: '#4A5D23' }}
            >
              {sessionLoading ? 'Creating…' : 'Create Session'}
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response</label>
              <pre className="w-full bg-gray-100 rounded-md p-3 overflow-auto text-xs sm:text-sm whitespace-pre-wrap overflow-x-auto">
                {sessionResponse}
              </pre>
            </div>
          </div>
        </div>

        {/* Workflow Summary */}
        {webhookData && (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Workflow Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="break-words">
                <strong className="text-gray-700">User:</strong> 
                <span className="text-gray-600 ml-1">{webhookData.user?.email}</span>
                <div className="text-gray-500 text-xs">ID: {webhookData.user?.id}</div>
              </div>
              <div className="break-words">
                <strong className="text-gray-700">Order:</strong> 
                <span className="text-gray-600 ml-1">{webhookData.order?.provider_ref}</span>
                <div className="text-gray-500 text-xs">Status: {webhookData.order?.status}</div>
              </div>
              <div className="break-words">
                <strong className="text-gray-700">Session:</strong> 
                <span className="text-gray-600 ml-1 font-mono text-xs">{webhookData.session_id}</span>
              </div>
              <div>
                <strong className="text-gray-700">Email Sent:</strong> 
                <span className={`ml-1 font-medium ${webhookData.emailed ? 'text-green-600' : 'text-red-600'}`}>
                  {webhookData.emailed ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <strong className="text-gray-700">Next Step:</strong> 
                <span className="text-gray-600 ml-1">Check your email for the magic link to access the assessment</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}