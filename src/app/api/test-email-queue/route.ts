import { NextRequest, NextResponse } from 'next/server'
import { processEmailQueue } from '@/lib/email-queue'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing email queue processing...')
    
    // First check how many emails are in the queue
    const { data: queueCheck } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
    
    console.log(`Found ${queueCheck?.length || 0} pending emails in queue`)
    
    const result = await processEmailQueue()
    
    console.log(`Processed ${result.processed} emails, ${result.errors} errors`)
    
    return NextResponse.json({
      success: true,
      message: `Email queue processed successfully. Found ${queueCheck?.length || 0} pending emails.`,
      processed: result.processed,
      errors: result.errors,
      totalPending: queueCheck?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Email queue test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Email queue processing failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
