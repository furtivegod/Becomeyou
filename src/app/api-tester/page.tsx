"use client"

import { useState, useEffect } from "react"

// Toast component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center space-x-2">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
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
      
      // Get signature from server (which has access to SAMCART_WEBHOOK_SECRET)
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

      // Now call the webhook with the signature
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
        
        // Show success toast
        if (json.emailed) {
          showToast(`✅ Magic link successfully sent to ${email}`, "success")
        } else {
          showToast("⚠️ Webhook processed but email may not have been sent", "error")
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
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Complete SamCart → Assessment Workflow Tester</h1>
          <p className="text-gray-600 mb-6">Simulate the full user journey: SamCart purchase → webhook → magic link → assessment → PDF.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="sc_test_123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="completed">completed</option>
                <option value="failed">failed</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={callWebhook}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Processing…' : '1. Simulate SamCart Purchase'}
              </button>
            </div>

            {/* Success Message - No Magic Link Button */}
            {webhookData && webhookData.emailed && (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Purchase Complete!</h3>
                <p className="text-green-700 mb-3">
                  User created, order placed, session started. Magic link has been sent to your email!
                </p>
                <p className="text-sm text-gray-600">
                  Check your email ({email}) for the magic link to access the assessment.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Webhook Response</label>
              <pre className="w-full bg-gray-100 rounded p-3 overflow-auto text-sm whitespace-pre-wrap">{responseText}</pre>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Manual Session Tester</h2>
          <p className="text-gray-600 mb-6">Create an assessment session directly via <code>/api/assessment/session</code>.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supabase User ID</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={sessionUserId}
                onChange={(e) => setSessionUserId(e.target.value)}
                placeholder="uuid-of-existing-user"
              />
            </div>

            <button
              onClick={createSession}
              disabled={sessionLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {sessionLoading ? 'Creating…' : 'Create Session'}
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Response</label>
              <pre className="w-full bg-gray-100 rounded p-3 overflow-auto text-sm whitespace-pre-wrap">{sessionResponse}</pre>
            </div>
          </div>
        </div>

        {webhookData && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Workflow Summary</h2>
            <div className="space-y-2 text-sm">
              <div><strong>User:</strong> {webhookData.user?.email} (ID: {webhookData.user?.id})</div>
              <div><strong>Order:</strong> {webhookData.order?.provider_ref} (Status: {webhookData.order?.status})</div>
              <div><strong>Session:</strong> {webhookData.session_id}</div>
              <div><strong>Email Sent:</strong> {webhookData.emailed ? 'Yes' : 'No'}</div>
              <div><strong>Next Step:</strong> Check your email for the magic link to access the assessment</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}