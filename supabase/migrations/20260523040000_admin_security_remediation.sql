-- Migration: Admin Panel Security Remediation
-- Created at: 2026-05-23

-- 1. Create Helper Functions to Prevent RLS Infinite Recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_moderator(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_uuid AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'update_role', 'update_credits'
  previous_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Audit Logs Policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
  FOR SELECT USING (
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Service role can insert audit logs" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (true);

-- 4. Trigger Function to Prevent Client-Side Privilege Escalation and Credit Manipulation (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.check_user_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent non-admins from changing role or credits
  IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.credits IS DISTINCT FROM NEW.credits OR OLD.total_credits_used IS DISTINCT FROM NEW.total_credits_used OR OLD.total_credits_purchased IS DISTINCT FROM NEW.total_credits_purchased) THEN
    -- Bypass if user is database superuser/postgres, or if active role is not authenticated (e.g. service_role)
    IF current_user <> 'postgres' AND auth.role() = 'authenticated' THEN
      -- Check if the actual authenticated user is an admin
      IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Não autorizado a alterar cargo ou créditos diretamente.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; -- SECURITY INVOKER (default) so current_user reflects calling context

-- Bind the trigger
DROP TRIGGER IF EXISTS enforce_profile_security ON public.user_profiles;
CREATE TRIGGER enforce_profile_security
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_user_profile_update();

-- 5. Secure select policy on user_profiles (Reduce PII Exposure without recursion)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
CREATE POLICY "Users can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    auth.uid() = id OR
    public.is_admin_or_moderator(auth.uid()) OR
    curriculo_slug IS NOT NULL
  );
