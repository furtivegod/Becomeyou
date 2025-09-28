import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sessionId: string; email: string }
    
    return NextResponse.json({ 
      valid: true, 
      sessionId: decoded.sessionId,
      email: decoded.email 
    })
    
  } catch (error) {
    console.error('JWT verification error:', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, email } = await request.json()
    
    if (!sessionId || !email) {
      return NextResponse.json({ error: 'SessionId and email required' }, { status: 400 })
    }

    // Generate JWT token
    const token = jwt.sign(
      { sessionId, email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )
    
    return NextResponse.json({ token })
    
  } catch (error) {
    console.error('JWT generation error:', error)
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 })
  }
}
