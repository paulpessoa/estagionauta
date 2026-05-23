-- Migration: Add RLS policies for admin and moderator roles to view stats and moderate content
-- Created at: 2026-05-23

-- Drop policies if they already exist
DROP POLICY IF EXISTS "Admins and moderators can view all curriculum analyses" ON public.curriculum_analysis;
DROP POLICY IF EXISTS "Admins and moderators can view all interview simulations" ON public.interview_simulations;
DROP POLICY IF EXISTS "Admins and moderators can view all reviews" ON public.agency_reviews;
DROP POLICY IF EXISTS "Admins and moderators can update any reviews" ON public.agency_reviews;
DROP POLICY IF EXISTS "Admins and moderators can delete any reviews" ON public.agency_reviews;
DROP POLICY IF EXISTS "Admins and moderators can view all credit transactions" ON public.credit_transactions;

-- 1. Policies for curriculum_analysis
CREATE POLICY "Admins and moderators can view all curriculum analyses" 
  ON public.curriculum_analysis
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- 2. Policies for interview_simulations
CREATE POLICY "Admins and moderators can view all interview simulations" 
  ON public.interview_simulations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- 3. Policies for agency_reviews
CREATE POLICY "Admins and moderators can view all reviews" 
  ON public.agency_reviews
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can update any reviews" 
  ON public.agency_reviews
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can delete any reviews" 
  ON public.agency_reviews
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- 4. Policies for credit_transactions
CREATE POLICY "Admins and moderators can view all credit transactions" 
  ON public.credit_transactions
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );
