
-- ================================
-- ESTAGIONAUTA - COMPLETE DATABASE SCHEMA
-- ================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA extensions;

-- ================================
-- ENUMS
-- ================================

CREATE TYPE user_role AS ENUM ('student', 'agency', 'admin', 'moderator');
CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE agency_status AS ENUM ('pending', 'approved', 'rejected');

-- ================================
-- MAIN TABLES
-- ================================

-- User profiles (extends auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'student',
  credits INTEGER DEFAULT 2,
  subscription_status TEXT DEFAULT 'free',
  subscription_tier TEXT,
  location_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Curriculum analysis table
CREATE TABLE public.curriculum_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  course TEXT,
  university TEXT,
  file_url TEXT,
  analysis_data JSONB,
  status analysis_status DEFAULT 'pending',
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Email screenshots for sending analysis results
CREATE TABLE public.analysis_screenshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analysis_id UUID REFERENCES public.curriculum_analysis(id) ON DELETE CASCADE NOT NULL,
  screenshot_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Agencies table
CREATE TABLE public.agencies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  instagram TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  cep TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  areas TEXT[],
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_whatsapp BOOLEAN DEFAULT false,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  status agency_status DEFAULT 'pending',
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL NOT NULL,
  verified_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Agency reviews
CREATE TABLE public.agency_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  comment TEXT NOT NULL,
  justification TEXT NOT NULL,
  is_moderated BOOLEAN DEFAULT false,
  moderated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Agency reports for moderation
CREATE TABLE public.agency_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  resolved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Email logs for tracking sent emails
CREATE TABLE public.email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  to_email VARCHAR NOT NULL,
  from_email VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  provider VARCHAR DEFAULT 'resend',
  provider_id VARCHAR,
  template_name VARCHAR,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- ROW LEVEL SECURITY POLICIES
-- ================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- USER_PROFILES policies
CREATE POLICY "Users can view all profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- CURRICULUM_ANALYSIS policies
CREATE POLICY "Users can view own analyses" ON public.curriculum_analysis 
  FOR SELECT USING (auth.uid() = user_id OR auth.email() = email);
CREATE POLICY "Users can create analyses" ON public.curriculum_analysis 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own analyses" ON public.curriculum_analysis 
  FOR UPDATE USING (auth.uid() = user_id OR auth.email() = email);

-- ANALYSIS_SCREENSHOTS policies
CREATE POLICY "Users can view screenshots for their analyses" ON public.analysis_screenshots 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.curriculum_analysis ca 
      WHERE ca.id = analysis_screenshots.analysis_id 
      AND (ca.user_id = auth.uid() OR ca.email = auth.email())
    )
  );
CREATE POLICY "System can create screenshots" ON public.analysis_screenshots 
  FOR INSERT WITH CHECK (true);

-- AGENCIES policies
CREATE POLICY "Anyone can view approved agencies" ON public.agencies 
  FOR SELECT USING (status = 'approved' OR auth.uid() = created_by);
CREATE POLICY "Authenticated users can create agencies" ON public.agencies 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own agencies" ON public.agencies 
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage all agencies" ON public.agencies 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- AGENCY_REVIEWS policies
CREATE POLICY "Anyone can view moderated reviews" ON public.agency_reviews 
  FOR SELECT USING (is_moderated = true);
CREATE POLICY "Users can create reviews" ON public.agency_reviews 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.agency_reviews 
  FOR UPDATE USING (auth.uid() = user_id);

-- AGENCY_REPORTS policies
CREATE POLICY "Users can view own reports" ON public.agency_reports 
  FOR SELECT USING (auth.uid() = reported_by);
CREATE POLICY "Users can create reports" ON public.agency_reports 
  FOR INSERT WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins can view all reports" ON public.agency_reports 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- EMAIL_LOGS policies
CREATE POLICY "Admins can view email logs" ON public.email_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- ================================
-- FUNCTIONS AND TRIGGERS
-- ================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update agency rating
CREATE OR REPLACE FUNCTION public.update_agency_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.agencies 
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2) 
      FROM public.agency_reviews 
      WHERE agency_id = COALESCE(NEW.agency_id, OLD.agency_id) AND is_moderated = true
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.agency_reviews 
      WHERE agency_id = COALESCE(NEW.agency_id, OLD.agency_id) AND is_moderated = true
    )
  WHERE id = COALESCE(NEW.agency_id, OLD.agency_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for agency rating updates
CREATE TRIGGER update_agency_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.agency_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_agency_rating();

-- ================================
-- STORAGE BUCKETS
-- ================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('curriculum-files', 'curriculum-files', false),
  ('analysis-screenshots', 'analysis-screenshots', false),
  ('agency-logos', 'agency-logos', true);

-- Storage policies for curriculum files
CREATE POLICY "Users can upload curriculum files" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'curriculum-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view own curriculum files" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'curriculum-files' AND 
    auth.role() = 'authenticated'
  );

-- Storage policies for analysis screenshots
CREATE POLICY "System can upload screenshots" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'analysis-screenshots');

CREATE POLICY "Users can view screenshots" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'analysis-screenshots');

-- Storage policies for agency logos
CREATE POLICY "Anyone can view agency logos" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'agency-logos');

CREATE POLICY "Users can upload agency logos" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'agency-logos' AND 
    auth.role() = 'authenticated'
  );

-- ================================
-- SAMPLE DATA
-- ================================

-- Insert sample agencies (only after real users exist)
-- This will be populated by the application

COMMIT;
