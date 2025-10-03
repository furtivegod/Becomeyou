import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get session data to find user
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_name, email')
      .eq('id', sessionData.user_id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Determine the best name to use
    let name = 'there'
    if (userData.user_name) {
      name = userData.user_name
    } else {
      // Extract name from email if no name is provided
      const emailName = userData.email.split('@')[0]
      name = emailName.charAt(0).toUpperCase() + emailName.slice(1)
    }

    return NextResponse.json({ name })

  } catch (error) {
    console.error('Error fetching user name:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
