"use client"

import { useState } from "react"

export default function BecomeYou_API_TesterPage() {
  const [email, setEmail] = useState("deondreivory328@gmail.com")
  const [status, setStatus] = useState("completed")
  const [orderId, setOrderId] = useState("sc_test_123")
  const [loading, setLoading] = useState(false)
  const [responseText, setResponseText] = useState("")
  const [magicLink, setMagicLink] = useState("")
  const [webhookData, setWebhookData] = useState<any>(null)

  const [sessionUserId, setSessionUserId] = useState("")
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionResponse, setSessionResponse] = useState("")

  const callWebhook = async () => {
    setLoading(true)
    setResponseText("")
    setMagicLink("")
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
        
        if (json.magic_link) {
          setMagicLink(json.magic_link)
        }
      } catch {
        setResponseText(text)
      }
    } catch (e: any) {
      setResponseText("Request failed: " + (e?.message || String(e)))
    } finally {
      setLoading(false)
    }
  }

  const openAssessment = () => {
    if (magicLink) {
      window.open(magicLink, '_blank')
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
      } catch {
        setSessionResponse(text)
      }
    } catch (e: any) {
      setSessionResponse("Request failed: " + (e?.message || String(e)))
    } finally {
      setSessionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

            {magicLink && (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Purchase Complete!</h3>
                <p className="text-green-700 mb-3">User created, order placed, session started. Magic link generated:</p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={openAssessment}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    2. Open Assessment (Magic Link)
                  </button>
                  <span className="text-sm text-gray-600">This opens the assessment page in a new tab</span>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-gray-600">View Magic Link</summary>
                  <code className="block mt-2 p-2 bg-gray-100 rounded text-xs break-all">{magicLink}</code>
                </details>
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
              <div><strong>Next Step:</strong> Click "Open Assessment" to continue the user journey</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}