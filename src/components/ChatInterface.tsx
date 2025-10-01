"use client"

import { useState, useRef, useEffect } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { trackEvent } from '@/lib/analytics'

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
  // Screen states
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'environment' | 'chat'>('welcome')
  const [userName, setUserName] = useState('')
  const [environment, setEnvironment] = useState('')
  
  // Chat states
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [assessmentComplete, setAssessmentComplete] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Speech recognition hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    error: speechError,
    isSupported
  } = useSpeechRecognition()

  // Auto-expand textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  // Smart scroll
  const smartScroll = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement
      if (container) {
        const threshold = 100
        const isNearBottom = 
          container.scrollHeight - container.scrollTop - container.clientHeight < threshold
        
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  useEffect(() => {
    smartScroll()
  }, [messages, isLoading, isGeneratingReport])

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (currentScreen === 'welcome') {
        handleWelcomeSubmit()
      } else if (currentScreen === 'environment') {
        handleEnvironmentSubmit()
      } else {
        sendMessage()
      }
    }
  }

  // Welcome screen handlers
  const handleWelcomeSubmit = () => {
    if (!input.trim()) return
    
    const name = input.trim()
    setUserName(name)
    setInput('')
    setCurrentScreen('chat')
    
    // Start the assessment immediately
    startAssessment()
    trackEvent('welcome_completed', { sessionId, userName: name })
  }

  // Environment screen handlers
  const handleEnvironmentSubmit = () => {
    if (!input.trim()) return
    
    const env = input.trim()
    setEnvironment(env)
    setInput('')
    setCurrentScreen('chat')
    
    // Start the actual assessment chat
    startAssessment()
    trackEvent('environment_set', { sessionId, environment: env })
  }

  // Start assessment chat
  const startAssessment = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Hey there, ${userName}!

This assessment will help you understand exactly why you might feel stuck despite having the drive and vision to succeed. We'll identify the specific patterns that have been holding you back, map your unique strengths across four key life domains (Mind, Body, Spirit, and Contribution), and create a personalized 30-day protocol that actually fits your nervous system and lifestyle.

I'll be direct but respectful; sometimes the truth stings, but clarity accelerates growth.

Are you ready to get started?`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
    trackEvent('assessment_started', { sessionId })
  }

  // Chat message handling
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
    setQuestionCount(prev => prev + 1)

    try {
      const response = await fetch('/api/assessment/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          message: input,
          userName,
          environment,
          questionCount: questionCount + 1
        })
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
              if (data.content && data.content !== 'undefined') {
                assistantMessage.content += data.content
              }
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

      // Check if assessment is complete
      if (questionCount >= 15 && assistantMessage.content.includes('assessment is complete')) {
        setAssessmentComplete(true)
        triggerReportGeneration()
      }

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

      window.location.href = `/api/report/${sessionId}`

    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Track message sent
  useEffect(() => {
    if (input.length > 0 && !isLoading && !assessmentComplete) {
      trackEvent('message_sent', { sessionId, messageLength: input.length })
    }
  }, [input, isLoading, assessmentComplete, sessionId])

  // Render different screens
  if (currentScreen === 'welcome') {
    return (
      <div className="flex flex-col h-screen bg-white font-['-apple-system',_'BlinkMacSystemFont',_'SF_Pro_Display',_'Segoe_UI',_'system-ui',_'sans-serif']">
        {/* Welcome Screen - Second Image Style (Client's Needs) */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-[700px] w-full text-center">
            {/* Greeting */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-6 h-6 bg-[#8B4513] rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">★</span>
                </div>
                <h1 className="text-2xl font-serif text-[#8B4513]">
                  Hey there, Matthew
                </h1>
              </div>
            </div>

            {/* Input Box - Clean and Minimalist */}
            <div className="bg-white border border-gray-300 rounded-xl p-4 flex flex-col gap-2 transition-all duration-150 focus-within:border-[#284138] focus-within:shadow-[0_0_0_3px_rgba(40,65,56,0.08)]">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Are you ready to unlock You 3.0?"
                className="w-full min-h-[24px] max-h-[200px] border-none outline-none resize-none text-base leading-[1.5] text-[#1F2937] bg-transparent font-inherit placeholder:text-gray-400"
                rows={1}
              />
              
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div className="flex gap-1">
                  <button className="w-8 h-8 border-none bg-transparent rounded-md flex items-center justify-center cursor-pointer text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-[#1F2937] active:scale-95">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                  
                  {isSupported && (
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={`w-8 h-8 border-none bg-transparent rounded-md flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 ${
                        isListening
                          ? 'text-red-500 hover:bg-red-50'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-[#1F2937]'
                      }`}
                    >
                      {isListening ? (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="23"/>
                          <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={handleWelcomeSubmit}
                  disabled={!input.trim()}
                  className="min-w-[80px] h-9 bg-[#284138] text-white border-none rounded-lg text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-150 px-4 hover:bg-[#1f3329] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(40,65,56,0.2)] active:translate-y-0 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  Send <span className="text-base">→</span>
                </button>
              </div>
            </div>

            {/* Transformation Message */}
            <div className="mt-8">
              <p className="text-lg text-gray-800 font-medium">
                This is where transformation begins.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Chat Screen - EXACT CLAUDE SPECIFICATIONS
  return (
    <div className="flex flex-col h-screen bg-white font-['-apple-system',_'BlinkMacSystemFont',_'SF_Pro_Display',_'Segoe_UI',_'system-ui',_'sans-serif']">
      {/* Messages Container - Exact Claude Layout */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth py-6"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div className="w-full flex justify-center">
          <div className="max-w-[700px] w-full px-6">
            {messages.map((message) => (
              <div key={message.id} className="w-full flex justify-center mb-8 animate-[messageSlideIn_0.3s_ease-out]">
                <div className="max-w-[700px] w-full px-6">
                  {message.role === 'assistant' ? (
                    // AI Message - Exact Claude Styling
                    <div className="flex gap-4 mb-8">
                      {/* AI Avatar - 32px, rounded-md, emerald color */}
                      <div className="w-8 h-8 flex-shrink-0 rounded-md bg-[#F3F4F6] flex items-center justify-center text-[#284138] text-base">
                        /
                      </div>
                      {/* AI Content - Fixed formatting */}
                      <div className="flex-1 text-base leading-[1.7] text-[#1F2937] font-normal tracking-[-0.01em]">
                        <div className="whitespace-pre-line">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // User Message - Exact Claude Styling
                    <div className="flex justify-end mb-8">
                      <div className="bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-3 rounded-[18px] max-w-[70%] text-base leading-[1.5] text-[#1F2937] break-words">
                        {message.content}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator - Exact Claude Animation */}
            {isLoading && (
              <div className="w-full flex justify-center mb-8 opacity-60">
                <div className="max-w-[700px] w-full px-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 flex-shrink-0 rounded-md bg-[#F3F4F6] flex items-center justify-center text-[#284138] text-base">
                      /
                    </div>
                    <div className="flex items-center gap-1 pt-2">
                      <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-[typingBounce_1.4s_infinite_ease-in-out]"></div>
                      <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-[typingBounce_1.4s_infinite_ease-in-out]" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-[typingBounce_1.4s_infinite_ease-in-out]" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Report Generation Indicator */}
            {isGeneratingReport && (
              <div className="w-full flex justify-center mb-8">
                <div className="max-w-[700px] w-full px-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 flex-shrink-0 rounded-md bg-[#F3F4F6] flex items-center justify-center text-[#284138] text-base">
                      /
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-green-700 text-sm font-medium">
                        🔄 Generating your You 3.0 assessment report...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Container - EXACT CLAUDE SPECS */}
      <div className="flex-shrink-0 border-t border-[#E5E7EB] p-4 bg-white">
        {assessmentComplete ? (
          <div className="max-w-[700px] mx-auto text-center">
            <div className="inline-flex items-center space-x-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Assessment Complete! Your You 3.0 report is ready above.</span>
            </div>
          </div>
        ) : (
          <div className="max-w-[700px] mx-auto">
            {/* Speech Error Display */}
            {speechError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {speechError}
              </div>
            )}
            
            {/* Input Box - EXACT CLAUDE SPECIFICATIONS */}
            <div className="bg-white border border-[#D1D5DB] rounded-xl p-4 flex flex-col gap-2 transition-all duration-150 focus-within:border-[#284138] focus-within:shadow-[0_0_0_3px_rgba(40,65,56,0.08)]">
              {/* Textarea - Exact specs */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Are you ready to unlock You 3.0?"
                className="w-full min-h-[24px] max-h-[200px] border-none outline-none resize-none text-base leading-[1.5] text-[#1F2937] bg-transparent font-inherit placeholder:text-[#9CA3AF]"
                disabled={isLoading}
                rows={1}
                aria-label="Message input"
              />
              
              {/* Controls Row - Exact Claude Layout */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F3F4F6]">
                <div className="flex gap-1">
                  {/* Attach Button - 32px control button */}
                  <button
                    className="w-8 h-8 border-none bg-transparent rounded-md flex items-center justify-center cursor-pointer text-[#6B7280] transition-all duration-150 hover:bg-[#F3F4F6] hover:text-[#1F2937] active:scale-95"
                    aria-label="Attach file"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                  
                  {/* Voice Input Button - 32px control button */}
                  {isSupported && (
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                      className={`w-8 h-8 border-none bg-transparent rounded-md flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 ${
                        isListening
                          ? 'text-red-500 hover:bg-red-50'
                          : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1F2937]'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label="Voice input"
                    >
                      {isListening ? (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="23"/>
                          <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                
                {/* Send Button - EXACT CLAUDE SPECS */}
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="min-w-[80px] h-9 bg-[#284138] text-white border-none rounded-lg text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-150 px-4 hover:bg-[#1f3329] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(40,65,56,0.2)] active:translate-y-0 disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  aria-label="Send message"
                >
                  Send <span className="text-base" aria-hidden="true">↑</span>
                </button>
              </div>
            </div>
            
            {/* Voice Input Status */}
            {isListening && (
              <div className="mt-2 text-center text-sm text-gray-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span>Listening... Speak now</span>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  )
}