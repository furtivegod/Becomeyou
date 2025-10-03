-- Personal Development Assessment MVP Database Schema
-- Updated to match the exact requirements

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  user_name VARCHAR(255), -- Full name from SamCart
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table (from SamCart)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_ref VARCHAR(255) UNIQUE NOT NULL, -- SamCart order ID
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment sessions
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Chat messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  flags JSONB, -- For storing message metadata/flags
  ts TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan outputs (structured JSON from AI)
CREATE TABLE plan_outputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  plan_json JSONB NOT NULL, -- Changed from plan_data to plan_json
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF generation jobs
CREATE TABLE pdf_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  pdf_url TEXT,
  file_path TEXT, -- Path to file in Supabase Storage
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

-- Storage policies for reports bucket
CREATE POLICY "Users can view their own reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'reports' AND
    auth.uid()::text = (
      SELECT user_id::text 
      FROM sessions s 
      JOIN pdf_jobs pj ON s.id = pj.session_id 
      WHERE pj.file_path = name
    )
  );

CREATE POLICY "Service role can manage all reports" ON storage.objects
  FOR ALL USING (bucket_id = 'reports');

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (true);

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all orders" ON orders
  FOR ALL USING (true);

-- RLS Policies for sessions
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sessions" ON sessions
  FOR ALL USING (true);

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their sessions" ON messages
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all messages" ON messages
  FOR ALL USING (true);

-- RLS Policies for plan_outputs
CREATE POLICY "Users can view their own plan outputs" ON plan_outputs
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all plan outputs" ON plan_outputs
  FOR ALL USING (true);

-- RLS Policies for pdf_jobs
CREATE POLICY "Users can view their own PDF jobs" ON pdf_jobs
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all PDF jobs" ON pdf_jobs
  FOR ALL USING (true);