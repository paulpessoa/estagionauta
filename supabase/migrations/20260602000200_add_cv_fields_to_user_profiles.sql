-- Add curriculum fields to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS city_state TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}'::text[];
