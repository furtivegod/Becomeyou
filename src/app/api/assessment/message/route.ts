import { NextRequest } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { generateClaudeResponse } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json()
    
    // Save user message
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
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('ts', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return new Response('Error fetching conversation', { status: 500 })
    }

    // Generate Claude response
    const claudeResponse = await generateClaudeResponse(messages)

    // Save Claude response
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