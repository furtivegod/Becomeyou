import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get the most recent session based on started_at timestamp
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        started_at,
        users!inner(email, user_name)
      `)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'No session found' }, { status: 404 })
    }

    return NextResponse.json({ 
      email: (sessionData.users as any)?.email,
      userName: (sessionData.users as any)?.user_name,
      sessionId: sessionData.id,
      startedAt: sessionData.started_at
    })

  } catch (error) {
    console.error('Error fetching latest session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
