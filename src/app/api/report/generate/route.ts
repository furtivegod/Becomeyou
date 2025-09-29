import { NextRequest, NextResponse } from 'next/server'
import { generateStructuredPlan } from '@/lib/claude'
import { generatePDF } from '@/lib/pdf'
import { sendReportEmail } from '@/lib/email'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    console.log('Report generation API called')
    console.log('Received sessionId:', sessionId)

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Check if plan already exists
    const { data: existingPlan } = await supabase
      .from('plan_outputs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingPlan && existingPlan.length > 0) {
      console.log('Plan already exists for this session')
      return NextResponse.json({ 
        message: 'Report already generated',
        planData: existingPlan[0].plan_json
      })
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
      return NextResponse.json({ error: 'Failed to fetch conversation history' }, { status: 500 })
    }

    console.log('Found', messages?.length || 0, 'messages in conversation')

    // Generate conversation history string
    const conversationHistory = messages?.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n') || ''

    console.log('Generated conversation history')

    // Generate structured plan
    console.log('Generating structured plan')
    const planData = await generateStructuredPlan(conversationHistory)
    console.log('Structured plan generated successfully')

    // Save plan to database
    console.log('Saving plan to database')
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

    console.log('Plan saved to database')

    // Generate PDF
    console.log('Generating PDF with storage')
    const { pdfUrl, pdfBuffer } = await generatePDF(planData, sessionId)
    console.log('PDF generated and stored successfully:', pdfUrl)

    // Get user email
    console.log('Fetching user information')
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      console.error('Error fetching session:', sessionError)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', sessionData.user_id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('User email found:', userData.email)

    // Send email with PDF
    console.log('Sending report email with PDF attachment')
    try {
      await sendReportEmail(userData.email, pdfUrl, pdfBuffer)
      console.log('Report email sent successfully')
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({ 
      message: 'Report generated successfully',
      planData,
      pdfUrl
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}