-- Migration: Add privacy_settings column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profileVisibility": "public", "showEmail": false, "showPhone": false}'::jsonb;
