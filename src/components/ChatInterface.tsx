"use client"

import { useState, useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/posthog'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

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
  const [showProtocol, setShowProtocol] = useState(false)
  const [protocolData, setProtocolData] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Speech recognition hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    error: speechError,
    isSupported
  } = useSpeechRecognition()

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, isGeneratingReport])

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

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

  // Track assessment start
  useEffect(() => {
    if (messages.length === 0) {
      trackEvent('assessment_started', { sessionId })
    }
  }, [])

  // Track assessment completion
  useEffect(() => {
    if (assessmentComplete) {
      trackEvent('assessment_completed', { sessionId })
    }
  }, [assessmentComplete, sessionId])

  const triggerReportGeneration = async () => {
    if (isGeneratingReport) return

    setIsGeneratingReport(true)
    try {
      const response = await fetch(`/api/report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const data = await response.json()
      setProtocolData(data.planData)
      setShowProtocol(true)
      
      // Call onComplete after a delay
      setTimeout(() => {
        onComplete()
      }, 2000)

    } catch (error) {
      console.error('Error generating report:', error)
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

      // Check if assessment is complete (you'll need to implement this logic)
      if (messages.length >= 10) { // Example: complete after 10 messages
        setAssessmentComplete(true)
        triggerReportGeneration()
      }

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Track message sent
  useEffect(() => {
    if (input.length > 0 && !isLoading && !assessmentComplete) {
      trackEvent('message_sent', { sessionId, messageLength: input.length })
    }
  }, [input, isLoading, assessmentComplete, sessionId])

  // Protocol display component
  const ProtocolDisplay = ({ data }: { data: any }) => (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-4 border-2 border-blue-200">
      <div className="text-center mb-6 border-b-2 border-blue-500 pb-4">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">{data.title || 'Your Personalized 30-Day Protocol'}</h1>
        <p className="text-gray-600 text-lg italic">{data.overview || 'Based on your assessment, here\'s your customized transformation plan.'}</p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4 border-b border-gray-200 pb-2">📅 Daily Actions</h2>
        <div className="space-y-4">
          {(data.daily_actions || []).map((action: any, index: number) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="font-bold text-blue-600 text-lg mb-2">Day {action.day}</div>
              <div className="font-semibold text-gray-800 text-lg mb-2">{action.title}</div>
              <div className="text-gray-600 mb-2">{action.description}</div>
              <div className="text-sm text-gray-500">Duration: {action.duration} | Category: {action.category}</div>
            </div>
          ))}
        </div>
      </div>
      
      {(data.weekly_goals || []).length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4 border-b border-gray-200 pb-2">🎯 Weekly Goals</h2>
          <div className="space-y-4">
            {(data.weekly_goals || []).map((goal: any, index: number) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <div className="font-bold text-blue-600 text-lg mb-2">Week {goal.week}: {goal.focus}</div>
                <ul className="list-disc list-inside space-y-1">
                  {(goal.goals || []).map((g: string, goalIndex: number) => (
                    <li key={goalIndex} className="text-gray-700">{g}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {(data.resources || []).length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4 border-b border-gray-200 pb-2">📚 Resources</h2>
          <div className="space-y-2">
            {(data.resources || []).map((resource: string, index: number) => (
              <div key={index} className="text-gray-700 border-b border-gray-200 pb-2">• {resource}</div>
            ))}
          </div>
        </div>
      )}
      
      {(data.reflection_prompts || []).length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4 border-b border-gray-200 pb-2">🤔 Reflection Prompts</h2>
          <div className="space-y-3">
            {(data.reflection_prompts || []).map((prompt: string, index: number) => (
              <div key={index} className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400 italic text-gray-700">{prompt}</div>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-center text-gray-500 text-sm border-t border-gray-200 pt-4">
        <p>Generated on {new Date().toLocaleDateString()} | Your personalized transformation protocol</p>
        <p className="mt-2 text-blue-600 font-semibold">📧 A downloadable PDF has been sent to your email!</p>
      </div>
    </div>
  )

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
        
        {/* Show Protocol */}
        {showProtocol && protocolData && (
          <ProtocolDisplay data={protocolData} />
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 border-t bg-white p-4">
        {assessmentComplete ? (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Assessment Complete! Your protocol is ready above.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Speech Error Display */}
            {speechError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {speechError}
              </div>
            )}
            
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your response or use voice input..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              />
              
              {/* Voice Input Button - Only show if supported */}
              {isSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                  className={`px-4 py-3 rounded-full font-medium transition-all duration-200 shadow-sm ${
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isListening ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>Stop</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      <span>Voice</span>
                    </div>
                  )}
                </button>
              )}
              
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
            
            {/* Voice Input Status */}
            {isListening && (
              <div className="text-center text-sm text-gray-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span>Listening... Speak now</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}