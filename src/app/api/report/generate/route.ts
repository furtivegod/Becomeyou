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
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Claude API timeout after 5 minutes')), 300000)
      )
      
      const claudePromise = generateStructuredPlan(conversationHistory)
      
      planData = await Promise.race([claudePromise, timeoutPromise])
      console.log('Structured plan generated successfully')
    } catch (claudeError) {
      console.error('Claude API error:', claudeError)
      
      // Use fallback plan if Claude fails
      planData = {
        title: "Your Personalized 30-Day Protocol",
        overview: "Based on your assessment, here's your customized transformation plan.",
        daily_actions: [
          {
            day: 1,
            title: "Morning Reflection",
            description: "Start your day with 5 minutes of mindful breathing and intention setting.",
            duration: "5 minutes",
            category: "mindfulness"
          },
          {
            day: 2,
            title: "Goal Setting",
            description: "Write down your main goal for the day and one action step.",
            duration: "10 minutes",
            category: "growth"
          }
        ],
        weekly_goals: [
          {
            week: 1,
            focus: "Foundation Building",
            goals: ["Establish daily routine", "Practice consistency"]
          }
        ],
        resources: ["Daily journal", "Meditation app", "Support group"],
        reflection_prompts: ["What went well today?", "What can I improve tomorrow?"]
      }
      
      console.log('Using fallback plan due to Claude API error')
    }

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
      return NextResponse.json({ error: 'Failed to save plan', details: planError }, { status: 500 })
    }

    console.log('Plan saved to database')

    // Generate PDF
    console.log('Generating PDF')
    let pdfUrl
    try {
      pdfUrl = await generatePDF(planData, sessionId)
      console.log('PDF generated successfully:', pdfUrl)
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError)
      return NextResponse.json({ error: 'Failed to generate PDF', details: pdfError }, { status: 500 })
    }

    // Update PDF job status
    console.log('Updating PDF job status')
    const { error: pdfJobError } = await supabase
      .from('pdf_jobs')
      .insert({
        session_id: sessionId,
        status: 'completed',
        pdf_url: pdfUrl
      })

    if (pdfJobError) {
      console.error('Error updating PDF job:', pdfJobError)
      // Don't fail the whole process for this
    }

    // Get user id for session
    console.log('Fetching user information')
    const { data: sessionRow, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionRow) {
      console.error('Error fetching session:', sessionError)
      return NextResponse.json({ error: 'Failed to fetch session', details: sessionError }, { status: 500 })
    }

    // Get user email
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', sessionRow.user_id)
      .single()

    if (userError || !userRow) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user', details: userError }, { status: 500 })
    }

    console.log('User email found:', userRow.email)

    // Send report email
    console.log('Sending report email')
    try {
      await sendReportEmail(userRow.email, pdfUrl)
      console.log('Report email sent successfully')
    } catch (emailError) {
      console.error('Failed to send report email:', emailError)
      // Don't fail the whole process for email issues
    }

    console.log('Report generation completed successfully')

    return NextResponse.json({ 
      success: true,
      pdfUrl,
      message: 'Report generated and sent successfully'
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}