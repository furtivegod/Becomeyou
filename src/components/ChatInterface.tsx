"use client"

import { useState, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  sessionId: string
  onComplete: () => void
}

export default function ChatInterface({ sessionId, onComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Auto-start with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: "Welcome! I'm here to help you create your personalized 30-day transformation plan. What's one area of your life you'd most like to improve right now?",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [])

  // Track assessment completion
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant') {
        const completionSignals = [
          'assessment is complete',
          'protocol is ready', 
          'I will now create your 30-day protocol',
          'Thank you! I have everything I need',
          'Your assessment is complete'
        ]
        
        const isComplete = completionSignals.some(signal => 
          lastMessage.content.toLowerCase().includes(signal.toLowerCase())
        )
        
        if (isComplete && !isComplete) {
          setIsComplete(true)
          onComplete()
          triggerReportGeneration()
        }
      }
    }
  }, [messages])

  const triggerReportGeneration = async () => {
    if (isGeneratingReport) return
    
    setIsGeneratingReport(true)
    try {
      console.log('Triggering report generation for session:', sessionId)
      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate report')
      }
      
      const result = await response.json()
      console.log('Report generation result:', result)
      
      // Show completion message to user
      const completionMessage: Message = {
        id: 'completion',
        role: 'assistant',
        content: "🎉 Perfect! Your personalized 30-day protocol has been generated and sent to your email. Check your inbox for your customized transformation plan!",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, completionMessage])
      
    } catch (error) {
      console.error('Failed to trigger report generation:', error)
      const errorMessage: Message = {
        id: 'error',
        role: 'assistant',
        content: "I've generated your protocol, but there was an issue sending it to your email. Please check back in a few minutes or contact support.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isComplete) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/assessment/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: input })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      if (!reader) return

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              assistantMessage.content += data.content
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: assistantMessage.content }
                    : msg
                )
              )
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        {isGeneratingReport && (
          <div className="flex justify-start">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              🔄 Generating your personalized protocol...
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        {isComplete ? (
          <div className="text-center text-green-600 font-semibold">
            ✅ Assessment Complete! Your protocol has been generated and sent to your email.
          </div>
        ) : (
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your response..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  )
}