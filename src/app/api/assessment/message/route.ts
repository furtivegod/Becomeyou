import { NextRequest, NextResponse } from 'next/server'
import { generateClaudeResponse } from '@/lib/claude'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message, currentPhase, questionCount } = await request.json()
    
    console.log('Processing message for session:', sessionId)
    console.log('Current phase:', currentPhase)
    console.log('Question count:', questionCount)

    if (!sessionId || !message) {
      return NextResponse.json({ error: 'Session ID and message are required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    // Save user message first
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message
      })

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
      return NextResponse.json({ error: 'Failed to save user message' }, { status: 500 })
    }

    // Get conversation history
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('ts', { ascending: true })

    if (fetchError) {
      console.error('Error fetching messages:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch conversation history' }, { status: 500 })
    }

    // Build conversation history for Claude
    const conversationHistory = messages?.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    })) || []

    // Generate response using Claude
    const response = await generateClaudeResponse(conversationHistory, currentPhase, questionCount)

    // Save assistant response to database
    const { error: saveError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: response
      })

    if (saveError) {
      console.error('Error saving message:', saveError)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // Check if assessment is complete
    const isComplete = response.includes('Thank you for showing up fully for this assessment') || 
                       response.includes('ASSESSMENT COMPLETE') ||
                       response.includes('You did the hard part. Now let\'s build on it.') ||
                       (questionCount && questionCount >= 15)

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Send the response in chunks
        const chunks = response.split(' ')
        let index = 0

        const sendChunk = () => {
          if (index < chunks.length) {
            const chunk = chunks[index] + (index < chunks.length - 1 ? ' ' : '')
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            index++
            setTimeout(sendChunk, 50) // 50ms delay between chunks
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ isComplete, protocolData: isComplete ? {} : null })}\n\n`))
            controller.close()
          }
        }

        sendChunk()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error processing message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}