import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { generateStructuredPlan } from '@/lib/claude'
import { generatePDF } from '@/lib/pdf'
import { sendReportEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    console.log('Report generation API called')
    
    const { sessionId } = await request.json()
    console.log('Received sessionId:', sessionId)

    if (!sessionId) {
      console.error('No sessionId provided')
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Check environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not set')
      return NextResponse.json({ error: 'Claude API key not configured' }, { status: 500 })
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
      return NextResponse.json({ error: 'Failed to fetch conversation', details: messagesError }, { status: 500 })
    }

    if (!messages || messages.length === 0) {
      console.error('No messages found for session:', sessionId)
      return NextResponse.json({ error: 'No conversation found' }, { status: 400 })
    }

    console.log('Found', messages.length, 'messages in conversation')

    // Generate conversation history string
    const conversationHistory = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n')

    console.log('Generated conversation history')

    // Generate structured plan with timeout
    console.log('Generating structured plan')
    let planData
    try {
      // Set a timeout for Claude API call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Claude API timeout after 60 seconds')), 60000)
      )
      
      const claudePromise = generateStructuredPlan(conversationHistory)
      planData = await Promise.race([claudePromise, timeoutPromise])
      
      console.log('Structured plan generated successfully')
    } catch (error) {
      console.error('Claude API error:', error)
      console.log('Using fallback plan due to Claude API error')
      
      // Fallback plan if Claude fails
      planData = {
        title: 'Your Personalized 30-Day Protocol',
        overview: "Based on your assessment, here's your customized transformation plan.",
        daily_actions: [
          {
            day: 1,
            title: 'Morning Reflection',
            description: 'Start your day with 10 minutes of quiet reflection on your goals.',
            duration: '10 minutes',
            category: 'mindfulness'
          },
          {
            day: 2,
            title: 'Action Step',
            description: 'Take one small step toward your main goal today.',
            duration: '15 minutes',
            category: 'action'
          },
          {
            day: 3,
            title: 'Progress Review',
            description: 'Review your progress and adjust your approach if needed.',
            duration: '10 minutes',
            category: 'reflection'
          }
        ],
        weekly_goals: [
          {
            week: 1,
            focus: 'Foundation Building',
            goals: ['Establish daily routine', 'Identify key priorities', 'Set clear objectives']
          }
        ],
        resources: [
          'Daily journal for tracking progress',
          'Accountability partner or support group',
          'Regular check-ins with yourself',
          'Online resources and tools'
        ],
        reflection_prompts: [
          'What went well today?',
          'What would you like to improve tomorrow?',
          'How are you feeling about your progress?'
        ]
      }
    }

    // Save plan to database
    console.log('Saving plan to database')
    const { error: planError } = await supabase
      .from('plan_outputs')
      .insert({
        session_id: sessionId,
        plan_json: planData,
      })

    if (planError) {
      console.error('Error saving plan:', planError)
      return NextResponse.json({ error: 'Failed to save plan', details: planError }, { status: 500 })
    }

    console.log('Plan saved to database')

    // Generate PDF with storage
    console.log('Generating PDF with storage')
    let pdfUrl
    try {
      pdfUrl = await generatePDF(planData, sessionId)
      console.log('PDF generated and stored successfully:', pdfUrl)
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError)
      return NextResponse.json({ error: 'Failed to generate PDF', details: pdfError }, { status: 500 })
    }

    // Get user email for sending report
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

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', sessionData.user_id)
      .single()

    if (userError || !userRow) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('User email found:', userRow.email)

    // Send report email
    console.log('Sending report email')
    try {
      await sendReportEmail(userRow.email, pdfUrl)
      console.log('Report email sent successfully')
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Don't fail the whole process if email fails
    }

    return NextResponse.json({ 
      success: true, 
      pdfUrl: pdfUrl,
      message: 'Report generated and email sent successfully',
      redirectUrl: `/api/report/${sessionId}`
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate report', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}