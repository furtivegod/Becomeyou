import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get the most recent user email from the database
    const { data: users, error } = await supabase
      .from('users')
      .select('email')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('Error fetching user email:', error)
      return NextResponse.json({
        success: false,
        email: '[their email]',
        error: error.message
      })
    }
    
    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        email: '[their email]',
        error: 'No users found'
      })
    }
    
    return NextResponse.json({
      success: true,
      email: users[0].email
    })
    
  } catch (error) {
    console.error('Error fetching user email:', error)
    return NextResponse.json({
      success: false,
      email: '[their email]',
      error: 'Unknown error'
    })
  }
}
