import { NextRequest } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { generateClaudeResponse } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    console.log('Message API called')
    
    const { sessionId, message } = await request.json()
    console.log('Received sessionId:', sessionId, 'message:', message)
    
    if (!sessionId || !message) {
      console.error('Missing sessionId or message')
      return new Response('Missing sessionId or message', { status: 400 })
    }

    // Check environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not set')
      return new Response('Claude API key not configured', { status: 500 })
    }

    // Test database connection
    try {
      const { data: testData, error: testError } = await supabase
        .from('messages')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('Database connection test failed:', testError)
        return new Response('Database connection failed', { status: 500 })
      }
      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return new Response('Database connection error', { status: 500 })
    }
    
    // Save user message
    console.log('Saving user message')
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message
      })

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
      return new Response('Error saving message', { status: 500 })
    }

    // Get conversation history
    console.log('Fetching conversation history')
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('ts', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return new Response('Error fetching conversation', { status: 500 })
    }

    console.log('Found', messages?.length || 0, 'messages in conversation')

    // Generate Claude response
    console.log('Generating Claude response')
    let claudeResponse: string
    try {
      claudeResponse = await generateClaudeResponse(messages)
      console.log('Claude response generated successfully')
    } catch (claudeError) {
      console.error('Claude API error:', claudeError)
      return new Response('Failed to generate Claude response', { status: 500 })
    }

    // Save Claude response
    console.log('Saving Claude response')
    const { error: claudeMsgError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: claudeResponse
      })

    if (claudeMsgError) {
      console.error('Error saving Claude message:', claudeMsgError)
      return new Response('Error saving response', { status: 500 })
    }

    console.log('Message processing completed successfully')

    // Return SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: claudeResponse })}\n\n`))
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    console.error('Message API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}