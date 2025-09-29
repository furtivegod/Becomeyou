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
  const [assessmentComplete, setAssessmentComplete] = useState(false)
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
    if (messages.length > 0 && !assessmentComplete) {
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
        
        if (isComplete) {
          console.log('Assessment completion detected!')
          setAssessmentComplete(true)
          onComplete()
          triggerReportGeneration()
        }
      }
    }
  }, [messages, assessmentComplete, onComplete])

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
    if (!input.trim() || isLoading || assessmentComplete) return

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
    <div className="flex flex-col h-full">
      {/* Chat Messages - Fixed height with scroll */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50" style={{ maxHeight: 'calc(100% - 80px)' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
              }`}
            >
              <div className="text-sm leading-relaxed">
                {message.content}
              </div>
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Report generation indicator */}
        {isGeneratingReport && (
          <div className="flex justify-start">
            <div className="bg-green-50 border border-green-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-green-700 text-sm font-medium">
                  🔄 Generating your personalized protocol...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 border-t bg-white p-4">
        {assessmentComplete ? (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Assessment Complete! Your protocol is being generated...</span>
            </div>
          </div>
        ) : (
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your response..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}