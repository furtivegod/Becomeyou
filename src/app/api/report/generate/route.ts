import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { generateStructuredPlan } from '@/lib/claude'
import { generatePDF } from '@/lib/pdf'
import { sendReportEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    // Get conversation history
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('ts', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
    }

    // Generate conversation history string
    const conversationHistory = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n')

    // Generate structured plan
    const planData = await generateStructuredPlan(conversationHistory)

    // Save plan to database
    const { error: planError } = await supabase
      .from('plan_outputs')
      .insert({
        session_id: sessionId,
        plan_json: planData
      })

    if (planError) {
      console.error('Error saving plan:', planError)
      return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 })
    }

    // Generate PDF
    const pdfUrl = await generatePDF(planData, sessionId)

    // Update PDF job status
    const { error: pdfJobError } = await supabase
      .from('pdf_jobs')
      .insert({
        session_id: sessionId,
        status: 'completed',
        pdf_url: pdfUrl
      })

    if (pdfJobError) {
      console.error('Error updating PDF job:', pdfJobError)
    }

    // Get user id for session
    const { data: sessionRow, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionRow) {
      console.error('Error fetching session:', sessionError)
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
    }

    // Get user email
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', sessionRow.user_id)
      .single()

    if (userError || !userRow) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    // Send report email
    await sendReportEmail(userRow.email, pdfUrl)

    return NextResponse.json({ 
      success: true,
      pdfUrl,
      message: 'Report generated and sent successfully'
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
