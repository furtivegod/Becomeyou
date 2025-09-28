import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface User {
  id: string
  email: string
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  provider_ref: string
  status: string
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  status: string
  started_at: string
  ended_at?: string
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  flags?: Record<string, unknown>
  ts: string
}

export interface PlanOutput {
  id: string
  session_id: string
  plan_json: Record<string, unknown>
  version: number
  created_at: string
}

export interface PdfJob {
  id: string
  session_id: string
  status: string
  pdf_url?: string
  error?: string
  created_at: string
}