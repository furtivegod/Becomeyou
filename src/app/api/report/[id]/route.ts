import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') || undefined

    // Verify access token for this session id
    const isValid = verifyToken(token, id)
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get PDF job details
    const { data: pdfJob, error } = await supabase
      .from('pdf_jobs')
      .select('pdf_url, status')
      .eq('session_id', id)
      .single()

    if (error || !pdfJob) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    if (pdfJob.status !== 'completed') {
      return NextResponse.json({ error: 'PDF not ready' }, { status: 202 })
    }

    return NextResponse.json({ 
      pdfUrl: pdfJob.pdf_url,
      status: pdfJob.status 
    })

  } catch (error) {
    console.error('PDF fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}