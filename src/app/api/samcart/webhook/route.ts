import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMagicLink } from '@/lib/email'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    const requiredEnvVars = {
      SAMCART_WEBHOOK_SECRET: process.env.SAMCART_WEBHOOK_SECRET,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      JWT_SECRET: process.env.JWT_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
    }

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars)
      return NextResponse.json({ 
        error: 'Server configuration error', 
        missing: missingVars 
      }, { status: 500 })
    }

    const url = new URL(request.url)
    const body = await request.text()
    const signature = request.headers.get('x-samcart-signature')
    
    if (!signature) {
      console.error('Missing signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify SamCart webhook signature
    const webhookSecret = process.env.SAMCART_WEBHOOK_SECRET!
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')
    
    if (signature !== expectedSignature) {
      console.error('Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse data (allow empty/minimal body in test mode)
    const parsed = body ? JSON.parse(body) : {}

    const data = {
      status: 'completed',
      customer_email: parsed.customer_email || url.searchParams.get('email') || 'tester@example.com',
      order_id: parsed.order_id || url.searchParams.get('order_id') || `test_${Date.now()}`,
      ...parsed
    }
    
    console.log('Processing webhook data:', { customer_email: data.customer_email, order_id: data.order_id })
    
    // Only process successful orders in non-test mode
    if (data.status !== 'completed') {
      return NextResponse.json({ message: 'Order not completed, skipping' })
    }

    const { customer_email, order_id } = data

    // Test database connection
    try {
      const { data: testConnection } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1)
      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json({ error: 'Database connection failed', details: dbError }, { status: 500 })
    }

    // Create or get user
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, created_at')
      .eq('email', customer_email)
      .single()

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create them
      console.log('Creating new user:', customer_email)
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({ email: customer_email })
        .select('id, email, created_at')
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json({ error: 'Failed to create user', details: createError }, { status: 500 })
      }
      user = newUser
    } else if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user', details: userError }, { status: 500 })
    }

    // Add null check for user
    if (!user) {
      console.error('User not found after creation/fetch')
      return NextResponse.json({ error: 'User not found' }, { status: 500 })
    }

    console.log('User processed:', user.id)

    // Create order record (handle duplicate provider_ref by selecting existing)
    let orderRow: { id: string; user_id: string; provider_ref: string; status: string } | undefined
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        provider_ref: order_id,
        status: 'completed'
      })
      .select('id, user_id, provider_ref, status')
      .single()

    if (orderError) {
      const isUniqueViolation = (orderError as unknown as { code?: string }).code === '23505'
      if (isUniqueViolation) {
        // Fetch existing order row by provider_ref
        console.log('Order already exists, fetching existing:', order_id)
        const { data: existingOrder, error: selectError } = await supabaseAdmin
          .from('orders')
          .select('id, user_id, provider_ref, status')
          .eq('provider_ref', order_id)
          .single()
        if (selectError || !existingOrder) {
          console.error('Error selecting existing order:', selectError)
          return NextResponse.json({ error: 'Failed to get existing order', details: selectError }, { status: 500 })
        }
        orderRow = existingOrder
      } else {
        console.error('Error creating order:', orderError)
        return NextResponse.json({ error: 'Failed to create order', details: orderError }, { status: 500 })
      }
    } else {
      orderRow = order as unknown as typeof orderRow
    }

    console.log('Order processed:', orderRow?.id)

    // Create assessment session directly (avoiding internal API call)
    console.log('Creating session for user:', user.id)
    
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({ user_id: user.id, status: 'active' })
      .select('*')
      .single()

    if (sessionError) {
      console.error('Session creation failed:', sessionError)
      return NextResponse.json({ 
        error: 'Failed to create session', 
        details: sessionError,
        table: 'sessions',
        userId: user.id
      }, { status: 500 })
    }

    const sessionId = session?.id
    if (!sessionId) {
      console.error('Session created but no ID returned:', session)
      return NextResponse.json({ error: 'Failed to create session - no ID' }, { status: 500 })
    }

    console.log('Session created:', sessionId)

    // Compute magic link for response
    const token = generateToken(sessionId, customer_email)
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/assessment/${sessionId}?token=${token}`

    // Send magic link email with better error handling
    let emailed = false
    let emailError: any = null
    
    try {
      console.log('Sending magic link email to:', customer_email)
      console.log('Using RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET')
      console.log('Using FROM address:', process.env.NODE_ENV === 'production' ? 'BECOME YOU <noreply@becomeyou.com>' : 'onboarding@resend.dev')
      
      await sendMagicLink(customer_email, sessionId)
      emailed = true
      console.log('Magic link email sent successfully')
    } catch (emailErr) {
      emailError = emailErr
      console.error('Failed to send magic link email:', emailErr)
      // Don't fail the webhook if email fails
    }
    
    return NextResponse.json({ 
      verified: true,
      emailed,
      email_to: customer_email,
      user,
      order: orderRow,
      session_id: sessionId,
      magic_link: magicLink,
      email_error: emailError ? emailError.message : null
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}