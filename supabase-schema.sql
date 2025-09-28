-- Personal Development Assessment MVP Database Schema
-- Updated to match the exact requirements

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
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
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view own messages" ON messages
  FOR ALL USING (auth.uid() = (SELECT user_id FROM sessions WHERE id = session_id));

-- RLS Policies for plan_outputs
CREATE POLICY "Users can view own plan outputs" ON plan_outputs
  FOR ALL USING (auth.uid() = (SELECT user_id FROM sessions WHERE id = session_id));

-- RLS Policies for pdf_jobs
CREATE POLICY "Users can view own pdf jobs" ON pdf_jobs
  FOR ALL USING (auth.uid() = (SELECT user_id FROM sessions WHERE id = session_id));

-- Indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_plan_outputs_session_id ON plan_outputs(session_id);
CREATE INDEX idx_pdf_jobs_session_id ON pdf_jobs(session_id);

-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, public = EXCLUDED.public;

-- Storage policies
CREATE POLICY "Users can view own reports" ON storage.objects
  FOR SELECT USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own reports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);