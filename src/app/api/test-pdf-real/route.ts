import { NextRequest, NextResponse } from 'next/server'
import { generatePDF } from '@/lib/pdf'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing PDF generation with real data...')
    
    // Check if PDFShift API key is available
    if (!process.env.PDFSHIFT_API_KEY) {
      console.error('❌ PDFSHIFT_API_KEY not configured')
      return NextResponse.json({
        success: false,
        error: 'PDFSHIFT_API_KEY not configured',
        message: 'PDF generation service not configured'
      }, { status: 500 })
    }
    
    // Fetch real data from Supabase plan_outputs table
    console.log('📊 Fetching real assessment data from plan_outputs table...')
    
    // Get the most recent plan output with assessment data
    const { data: planOutputs, error: planOutputsError } = await supabase
      .from('plan_outputs')
      .select(`
        session_id,
        plan_data,
        sessions!inner(
          id,
          user_id,
          users!inner(email, user_name)
        )
      `)
      .not('plan_data', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (planOutputsError) {
      console.error('❌ Error fetching plan outputs:', planOutputsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch plan data',
        message: 'Could not retrieve assessment data from plan_outputs table'
      }, { status: 500 })
    }

    if (!planOutputs || planOutputs.length === 0) {
      console.error('❌ No plan outputs found')
      return NextResponse.json({
        success: false,
        error: 'No assessment data found',
        message: 'No completed assessments found in database. Please complete an assessment first.'
      }, { status: 404 })
    }

    const planOutput = planOutputs[0]
    const planData = planOutput.plan_data
    const sessionData = Array.isArray(planOutput.sessions) ? planOutput.sessions[0] : planOutput.sessions
    const userData = Array.isArray(sessionData.users) ? sessionData.users[0] : sessionData.users
    
    console.log('✅ Found real assessment data for session:', planOutput.session_id)
    console.log('📋 Plan data keys:', Object.keys(planData))
    console.log('👤 User data:', userData)

    // Generate PDF with real data from Supabase
    console.log('📝 Starting PDF generation with real data...')
    const result = await generatePDF(planData, planOutput.session_id)
    
    console.log('✅ PDF generated successfully with real data!')
    console.log('📄 PDF URL:', result.pdfUrl)
    
    return NextResponse.json({
      success: true,
      message: 'PDF generated successfully with real assessment data',
      pdfUrl: result.pdfUrl,
      sessionId: planOutput.session_id,
      clientName: userData?.user_name || userData?.email?.split('@')[0] || 'Client'
    })

  } catch (error) {
    console.error('❌ PDF generation test failed:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'PDF generation test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
