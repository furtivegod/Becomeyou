import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Creating sample emails for testing...')
    
    // Create sample email queue entries
    const sampleEmails = [
      {
        user_id: 'test-user-1',
        session_id: 'test-session-1',
        email: 'test1@example.com',
        user_name: 'Test User 1',
        email_type: 'pattern_recognition',
        scheduled_for: new Date(Date.now() - 1000).toISOString(), // 1 second ago (due now)
        status: 'pending',
        data: { test: true }
      },
      {
        user_id: 'test-user-2',
        session_id: 'test-session-2',
        email: 'test2@example.com',
        user_name: 'Test User 2',
        email_type: 'evidence_7day',
        scheduled_for: new Date(Date.now() - 2000).toISOString(), // 2 seconds ago (due now)
        status: 'pending',
        data: { test: true }
      },
      {
        user_id: 'test-user-3',
        session_id: 'test-session-3',
        email: 'test3@example.com',
        user_name: 'Test User 3',
        email_type: 'integration_threshold',
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow (not due yet)
        status: 'pending',
        data: { test: true }
      }
    ]

    // Insert sample emails
    const { data, error } = await supabase
      .from('email_queue')
      .insert(sampleEmails)
      .select()

    if (error) {
      console.error('Error creating sample emails:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create sample emails',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Sample emails created successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Sample emails created successfully',
      emailsCreated: data?.length || 0,
      emails: data,
      dueNow: sampleEmails.filter(e => new Date(e.scheduled_for) <= new Date()).length
    })

  } catch (error) {
    console.error('❌ Failed to create sample emails:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create sample emails'
    }, { status: 500 })
  }
}
