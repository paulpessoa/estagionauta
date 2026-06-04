-- Migration: Remove curriculo_slug from user_profiles and update select policy
-- Created at: 2026-06-04

-- 1. Drop index associated with public curriculum slug
DROP INDEX IF EXISTS public.idx_user_profiles_curriculo_slug;

-- 2. Drop the policy first since the column depends on it
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;

-- 3. Drop the column (this automatically drops the user_profiles_curriculo_slug_key unique constraint)
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS curriculo_slug;

-- 4. Recreate public user profiles select policy without curriculo_slug reference
CREATE POLICY "Users can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    auth.uid() = id OR
    public.is_admin_or_moderator(auth.uid())
  );
