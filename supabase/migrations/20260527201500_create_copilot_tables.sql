-- Migration to create tables for Copilot WebAgent MVP (Fase 2)
CREATE TABLE IF NOT EXISTS public.copilot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT,
  name TEXT, -- Name of the tool if role is 'tool'
  tool_calls JSONB, -- Tool call object/array if role is 'assistant'
  tool_call_id TEXT, -- ID of the tool call if role is 'tool'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on copilot_messages
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own copilot messages" ON public.copilot_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create copilot_abuse_logs
CREATE TABLE IF NOT EXISTS public.copilot_abuse_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  action TEXT NOT NULL, -- E.g. 'rate_limit_hourly', 'spam_cooldown', 'prompt_injection'
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on copilot_abuse_logs
ALTER TABLE public.copilot_abuse_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view abuse logs" ON public.copilot_abuse_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );
