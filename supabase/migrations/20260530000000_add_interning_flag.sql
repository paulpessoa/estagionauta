-- Add is_currently_interning flag to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_currently_interning BOOLEAN DEFAULT false;
