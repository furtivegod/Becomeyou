import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📧 Fetching email queue...')
    
    // Get all emails in the queue
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .order('scheduled_for', { ascending: true })

    if (error) {
      console.error('Error fetching email queue:', error)
      return NextResponse.json({ error: 'Failed to fetch email queue' }, { status: 500 })
    }

    // Get summary stats
    const stats = {
      total: emails?.length || 0,
      pending: emails?.filter(e => e.status === 'pending').length || 0,
      sent: emails?.filter(e => e.status === 'sent').length || 0,
      failed: emails?.filter(e => e.status === 'failed').length || 0,
      due_now: emails?.filter(e => 
        e.status === 'pending' && 
        new Date(e.scheduled_for) <= new Date()
      ).length || 0
    }

    return NextResponse.json({
      success: true,
      stats,
      emails: emails || [],
      message: `Found ${stats.total} emails in queue`
    })

  } catch (error) {
    console.error('Error in email queue admin:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
