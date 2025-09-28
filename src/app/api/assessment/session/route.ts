import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Session API called')
    
    const { userId } = await request.json()
    console.log('Received userId:', userId)

    if (!userId) {
      console.error('No userId provided')
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Test database connection first
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('sessions')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('Database connection test failed:', testError)
        return NextResponse.json({ 
          error: 'Database connection failed', 
          details: testError 
        }, { status: 500 })
      }
      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({ 
        error: 'Database connection error', 
        details: dbError 
      }, { status: 500 })
    }

    console.log('Creating session for user:', userId)
    
    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .insert({ user_id: userId, status: 'active' })
      .select('*')
      .single()

    if (error) {
      console.error('Session creation failed:', error)
      return NextResponse.json({ 
        error: 'Failed to create session', 
        details: error,
        table: 'sessions',
        userId: userId
      }, { status: 500 })
    }

    console.log('Session created successfully:', session?.id)
    return NextResponse.json({ session })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}