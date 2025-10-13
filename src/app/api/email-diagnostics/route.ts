import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Running email diagnostics...')
    
    // Check recent sessions
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, user_id, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5)

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
    }

    // Check email queue
    const { data: queueItems, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .order('scheduled_for', { ascending: true })

    if (queueError) {
      console.error('Error fetching queue:', queueError)
    }

    // Check plan outputs
    const { data: planOutputs, error: planError } = await supabase
      .from('plan_outputs')
      .select('session_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (planError) {
      console.error('Error fetching plan outputs:', planError)
    }

    // Check users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    return NextResponse.json({
      success: true,
      diagnostics: {
        recentSessions: recentSessions || [],
        emailQueue: queueItems || [],
        planOutputs: planOutputs || [],
        users: users || [],
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Diagnostics error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Diagnostics failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
