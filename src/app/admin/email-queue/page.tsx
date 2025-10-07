'use client'

import { useState, useEffect } from 'react'

interface EmailQueueItem {
  id: string
  user_id: string
  session_id: string
  email: string
  user_name: string
  email_type: string
  scheduled_for: string
  status: string
  sent_at?: string
  error_message?: string
  created_at: string
}

interface QueueStats {
  total: number
  pending: number
  sent: number
  failed: number
  due_now: number
}

export default function EmailQueueAdmin() {
  const [emails, setEmails] = useState<EmailQueueItem[]>([])
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmailQueue = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/email-queue')
      const data = await response.json()
      
      if (data.success) {
        setEmails(data.emails)
        setStats(data.stats)
      } else {
        setError(data.error || 'Failed to fetch email queue')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const processQueueNow = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cron/email-queue')
      const data = await response.json()
      
      if (data.message) {
        alert(`Queue processed: ${data.message}`)
        fetchEmailQueue() // Refresh the data
      } else {
        alert('Error processing queue')
      }
    } catch (err) {
      alert('Error processing queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmailQueue()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const isOverdue = (scheduledFor: string) => {
    return new Date(scheduledFor) < new Date() && new Date(scheduledFor) < new Date(Date.now() - 24 * 60 * 60 * 1000)
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#F5F1E8' }}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold" style={{ color: '#4A5D23', fontFamily: 'Georgia, Times New Roman, serif' }}>
              📧 Email Queue Admin
            </h1>
            <div className="space-x-4">
              <button
                onClick={fetchEmailQueue}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : '🔄 Refresh'}
              </button>
              <button
                onClick={processQueueNow}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                ⚡ Process Now
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-800">Total Emails</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-yellow-800">Pending</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
                <div className="text-sm text-green-800">Sent</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-red-800">Failed</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.due_now}</div>
                <div className="text-sm text-orange-800">Due Now</div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Scheduled</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Sent At</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email) => (
                  <tr key={email.id} className={isOverdue(email.scheduled_for) ? 'bg-red-50' : ''}>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="font-medium">{email.email}</div>
                      <div className="text-sm text-gray-500">{email.user_name}</div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {email.email_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="text-sm">{formatDate(email.scheduled_for)}</div>
                      {isOverdue(email.scheduled_for) && (
                        <div className="text-xs text-red-600">⚠️ Overdue</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(email.status)}`}>
                        {email.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {email.sent_at ? formatDate(email.sent_at) : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-red-600">
                      {email.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {emails.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No emails in queue
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
