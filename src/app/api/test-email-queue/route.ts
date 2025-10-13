import { NextRequest, NextResponse } from 'next/server'
import { processEmailQueue } from '@/lib/email-queue'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing email queue...')
    
    // First, let's check what's in the email queue
    const { data: queueItems, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .order('scheduled_for', { ascending: true })

    if (queueError) {
      console.error('Error fetching queue:', queueError)
      return NextResponse.json({ error: 'Failed to fetch queue', details: queueError }, { status: 500 })
    }

    console.log('Email queue items:', queueItems)

    // Now process the queue
    const result = await processEmailQueue()
    
    return NextResponse.json({
      success: true,
      message: 'Email queue test completed',
      queueItems: queueItems,
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Email queue test error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Email queue test failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}