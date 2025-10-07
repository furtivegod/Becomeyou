import { NextRequest, NextResponse } from 'next/server'
import { processEmailQueue } from '@/lib/email-queue'

export async function GET(request: NextRequest) {
  try {
    console.log('Email queue cron job started...')
    
    const result = await processEmailQueue()
    
    console.log('Email queue cron job completed:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Email queue processed',
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Email queue cron job error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Email queue processing failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Allow POST requests as well (for manual triggers)
export async function POST(request: NextRequest) {
  return GET(request)
}
