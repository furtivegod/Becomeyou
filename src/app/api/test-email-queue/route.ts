import { NextRequest, NextResponse } from 'next/server'
import { processEmailQueue } from '@/lib/email-queue'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing email queue processing...')
    
    const result = await processEmailQueue()
    
    return NextResponse.json({
      success: true,
      message: 'Email queue processed successfully',
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Email queue test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Email queue processing failed'
    }, { status: 500 })
  }
}
