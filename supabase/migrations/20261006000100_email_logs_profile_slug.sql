-- These columns already exist in production and are written by the API
-- (saveEmailLog); recorded here so fresh databases match.
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS profile_id UUID;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS curriculum_slug TEXT;
