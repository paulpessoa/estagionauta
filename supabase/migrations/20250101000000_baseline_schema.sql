-- ==========================================
-- ESTAGIONAUTA - CONSOLIDATED BASELINE SCHEMA
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom enums safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('student', 'agency', 'admin', 'moderator');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analysis_status') THEN
        CREATE TYPE public.analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agency_status') THEN
        CREATE TYPE public.agency_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- 1. USER_PROFILES Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role public.user_role DEFAULT 'student',
  credits INTEGER DEFAULT 5 NOT NULL,
  total_credits_used INTEGER DEFAULT 0 NOT NULL,
  total_credits_purchased INTEGER DEFAULT 0 NOT NULL,
  subscription_status TEXT DEFAULT 'free',
  subscription_tier TEXT,
  location_enabled BOOLEAN DEFAULT false,
  bio TEXT,
  phone TEXT,
  linkedin_url TEXT,
  course TEXT,
  university TEXT,
  period TEXT,
  curriculo_slug TEXT UNIQUE,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Ensure all columns are present (for safety on existing databases)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 5 NOT NULL;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS total_credits_used INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS total_credits_purchased INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS referred_by UUID;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS curriculo_slug TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_curriculo_slug_key'
    ) THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_curriculo_slug_key UNIQUE (curriculo_slug);
    END IF;
END $$;

-- 2. CURRICULUM_ANALYSIS Table
CREATE TABLE IF NOT EXISTS public.curriculum_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  course TEXT,
  university TEXT,
  file_url TEXT,
  analysis_data JSONB,
  status public.analysis_status DEFAULT 'pending',
  credits_used INTEGER DEFAULT 1,
  used_fallback BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.curriculum_analysis ADD COLUMN IF NOT EXISTS used_fallback BOOLEAN DEFAULT false;

-- 3. ANALYSIS_SCREENSHOTS Table
CREATE TABLE IF NOT EXISTS public.analysis_screenshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.curriculum_analysis(id) ON DELETE CASCADE NOT NULL,
  screenshot_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- 4. AGENCIES Table
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  status public.agency_status DEFAULT 'pending',
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL NOT NULL,
  verified_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  agency_type TEXT CHECK (agency_type IN ('faculdade', 'consultoria', 'agencia_privada', 'orgao_publico', 'instituto', 'fundacao', 'outro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- 5. AGENCY_REVIEWS Table
CREATE TABLE IF NOT EXISTS public.agency_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  comment TEXT NOT NULL,
  justification TEXT NOT NULL,
  is_moderated BOOLEAN DEFAULT false,
  moderated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.agency_reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- 6. AGENCY_REPORTS Table
CREATE TABLE IF NOT EXISTS public.agency_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  resolved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- 7. EMAIL_LOGS Table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- 8. CREDIT_TRANSACTIONS Table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 9. AGENCY_COMMENTS Table
CREATE TABLE IF NOT EXISTS public.agency_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID NULL REFERENCES public.agency_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  is_reported BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. COMMENT_REACTIONS Table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.agency_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- 11. COMMENT_REPORTS Table
CREATE TABLE IF NOT EXISTS public.comment_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.agency_comments(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_curriculo_slug ON public.user_profiles(curriculo_slug);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- 1. Timestamp Auto-Update Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. New User Handler Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  ref_code text;
  referrer_id uuid;
BEGIN
  ref_code := NEW.raw_user_meta_data->>'referral_code';
  
  IF ref_code IS NOT NULL THEN
    SELECT id INTO referrer_id FROM public.user_profiles WHERE referral_code = ref_code;
  END IF;

  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, credits, total_credits_used, total_credits_purchased, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    5,
    0,
    0,
    UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8)),
    referrer_id
  )
  ON CONFLICT (id) DO UPDATE SET
    credits = COALESCE(user_profiles.credits, 5),
    total_credits_used = COALESCE(user_profiles.total_credits_used, 0),
    total_credits_purchased = COALESCE(user_profiles.total_credits_purchased, 0);
  
  -- Registrar créditos iniciais como bônus (apenas se não existir)
  IF NOT EXISTS (SELECT 1 FROM public.credit_transactions WHERE user_id = NEW.id AND type = 'bonus' AND description = 'Créditos iniciais de boas-vindas') THEN
    INSERT INTO public.credit_transactions (user_id, type, amount, description)
    VALUES (NEW.id, 'bonus', 5, 'Créditos iniciais de boas-vindas');
  END IF;

  -- Se foi indicado por alguém, premiar o indicador
  IF referrer_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.credit_transactions WHERE user_id = referrer_id AND type = 'bonus' AND description = 'Indicação de amigo: ' || NEW.email) THEN
      INSERT INTO public.credit_transactions (user_id, type, amount, description)
      VALUES (referrer_id, 'bonus', 3, 'Indicação de amigo: ' || NEW.email);
      
      UPDATE public.user_profiles
      SET credits = credits + 3
      WHERE id = referrer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update Agency Rating Function
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

-- 4. Consume Credits Function
CREATE OR REPLACE FUNCTION public.consume_credits(
  user_uuid UUID,
  amount INTEGER,
  description TEXT DEFAULT 'Análise de currículo'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits INTO current_credits 
  FROM public.user_profiles 
  WHERE id = user_uuid;
  
  IF current_credits < amount THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.user_profiles 
  SET 
    credits = credits - amount,
    total_credits_used = total_credits_used + amount
  WHERE id = user_uuid;
  
  INSERT INTO public.credit_transactions (user_id, type, amount, description)
  VALUES (user_uuid, 'usage', amount, description);
  
  RETURN TRUE;
END;
$$;

-- 5. Add Credits Function
CREATE OR REPLACE FUNCTION public.add_credits(
  user_uuid UUID,
  amount INTEGER,
  stripe_payment_intent_id TEXT DEFAULT NULL,
  description TEXT DEFAULT 'Compra de créditos'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles 
  SET 
    credits = credits + amount,
    total_credits_purchased = total_credits_purchased + amount
  WHERE id = user_uuid;
  
  INSERT INTO public.credit_transactions (user_id, type, amount, description, stripe_payment_intent_id)
  VALUES (user_uuid, 'purchase', amount, description, stripe_payment_intent_id);
END;
$$;

-- 6. Comment Reactions Update Function
CREATE OR REPLACE FUNCTION public.update_comment_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE public.agency_comments 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.agency_comments 
      SET dislikes_count = dislikes_count + 1 
      WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE public.agency_comments 
      SET likes_count = likes_count - 1 
      WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.agency_comments 
      SET dislikes_count = dislikes_count - 1 
      WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction_type != NEW.reaction_type THEN
      IF OLD.reaction_type = 'like' THEN
        UPDATE public.agency_comments 
        SET likes_count = likes_count - 1, dislikes_count = dislikes_count + 1 
        WHERE id = NEW.comment_id;
      ELSE
        UPDATE public.agency_comments 
        SET likes_count = likes_count + 1, dislikes_count = dislikes_count - 1 
        WHERE id = NEW.comment_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS ASSIGNMENT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS handle_updated_at ON public.user_profiles;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.agencies;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_agency_rating_trigger ON public.agency_reviews;
CREATE TRIGGER update_agency_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.agency_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_agency_rating();

DROP TRIGGER IF EXISTS comment_reaction_counts_trigger ON public.comment_reactions;
CREATE TRIGGER comment_reaction_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.comment_reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_reaction_counts();

DROP TRIGGER IF EXISTS handle_updated_at_agency_comments ON public.agency_comments;
CREATE TRIGGER handle_updated_at_agency_comments BEFORE UPDATE ON public.agency_comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

-- 1. USER_PROFILES Policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
CREATE POLICY "Users can view all profiles" ON public.user_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. CURRICULUM_ANALYSIS Policies
DROP POLICY IF EXISTS "Users can view own analyses" ON public.curriculum_analysis;
CREATE POLICY "Users can view own analyses" ON public.curriculum_analysis 
  FOR SELECT USING (auth.uid() = user_id OR auth.email() = email);

DROP POLICY IF EXISTS "Users can create analyses" ON public.curriculum_analysis;
CREATE POLICY "Users can create analyses" ON public.curriculum_analysis 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own analyses" ON public.curriculum_analysis;
CREATE POLICY "Users can update own analyses" ON public.curriculum_analysis 
  FOR UPDATE USING (auth.uid() = user_id OR auth.email() = email);

-- 3. ANALYSIS_SCREENSHOTS Policies
DROP POLICY IF EXISTS "Users can view screenshots for their analyses" ON public.analysis_screenshots;
CREATE POLICY "Users can view screenshots for their analyses" ON public.analysis_screenshots 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.curriculum_analysis ca 
      WHERE ca.id = analysis_screenshots.analysis_id 
      AND (ca.user_id = auth.uid() OR ca.email = auth.email())
    )
  );

DROP POLICY IF EXISTS "System can create screenshots" ON public.analysis_screenshots;
CREATE POLICY "System can create screenshots" ON public.analysis_screenshots 
  FOR INSERT WITH CHECK (true);

-- 4. AGENCIES Policies
DROP POLICY IF EXISTS "Anyone can view approved agencies" ON public.agencies;
CREATE POLICY "Anyone can view approved agencies" ON public.agencies 
  FOR SELECT USING (status = 'approved' OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can create agencies" ON public.agencies;
CREATE POLICY "Authenticated users can create agencies" ON public.agencies 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own agencies" ON public.agencies;
CREATE POLICY "Users can update own agencies" ON public.agencies 
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can manage all agencies" ON public.agencies;
CREATE POLICY "Admins can manage all agencies" ON public.agencies 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- 5. AGENCY_REVIEWS Policies
DROP POLICY IF EXISTS "Anyone can view moderated reviews" ON public.agency_reviews;
CREATE POLICY "Anyone can view moderated reviews" ON public.agency_reviews 
  FOR SELECT USING (is_moderated = true);

DROP POLICY IF EXISTS "Users can create reviews" ON public.agency_reviews;
CREATE POLICY "Users can create reviews" ON public.agency_reviews 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.agency_reviews;
CREATE POLICY "Users can update own reviews" ON public.agency_reviews 
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. AGENCY_REPORTS Policies
DROP POLICY IF EXISTS "Users can view own reports" ON public.agency_reports;
CREATE POLICY "Users can view own reports" ON public.agency_reports 
  FOR SELECT USING (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can create reports" ON public.agency_reports;
CREATE POLICY "Users can create reports" ON public.agency_reports 
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.agency_reports;
CREATE POLICY "Admins can view all reports" ON public.agency_reports 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- 7. EMAIL_LOGS Policies
DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
CREATE POLICY "Admins can view email logs" ON public.email_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- 8. CREDIT_TRANSACTIONS Policies
DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only authorized functions can insert credit transactions" ON public.credit_transactions;
CREATE POLICY "Only authorized functions can insert credit transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Only authorized functions can update credit transactions" ON public.credit_transactions;
CREATE POLICY "Only authorized functions can update credit transactions" ON public.credit_transactions
  FOR UPDATE USING (false);

-- 9. AGENCY_COMMENTS Policies
DROP POLICY IF EXISTS "Comentários são visíveis para todos" ON public.agency_comments;
CREATE POLICY "Comentários são visíveis para todos" ON public.agency_comments 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuários podem criar comentários" ON public.agency_comments;
CREATE POLICY "Usuários podem criar comentários" ON public.agency_comments 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem editar próprios comentários" ON public.agency_comments;
CREATE POLICY "Usuários podem editar próprios comentários" ON public.agency_comments 
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar próprios comentários" ON public.agency_comments;
CREATE POLICY "Usuários podem deletar próprios comentários" ON public.agency_comments 
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. COMMENT_REACTIONS Policies
DROP POLICY IF EXISTS "Reações são visíveis para todos" ON public.comment_reactions;
CREATE POLICY "Reações são visíveis para todos" ON public.comment_reactions 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuários podem reagir a comentários" ON public.comment_reactions;
CREATE POLICY "Usuários podem reagir a comentários" ON public.comment_reactions 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem alterar próprias reações" ON public.comment_reactions;
CREATE POLICY "Usuários podem alterar próprias reações" ON public.comment_reactions 
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem remover próprias reações" ON public.comment_reactions;
CREATE POLICY "Usuários podem remover próprias reações" ON public.comment_reactions 
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 11. COMMENT_REPORTS Policies
DROP POLICY IF EXISTS "Denúncias visíveis para admins e autor" ON public.comment_reports;
CREATE POLICY "Denúncias visíveis para admins e autor" ON public.comment_reports 
  FOR SELECT TO authenticated USING (
    auth.uid() = reported_by OR 
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Usuários podem criar denúncias" ON public.comment_reports;
CREATE POLICY "Usuários podem criar denúncias" ON public.comment_reports 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);


-- ==========================================
-- STORAGE BUCKETS CONFIGURATION
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('curriculum-files', 'curriculum-files', false),
  ('analysis-screenshots', 'analysis-screenshots', false),
  ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Bucket Policies
DROP POLICY IF EXISTS "Users can upload curriculum files" ON storage.objects;
CREATE POLICY "Users can upload curriculum files" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'curriculum-files' AND 
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can view own curriculum files" ON storage.objects;
CREATE POLICY "Users can view own curriculum files" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'curriculum-files' AND 
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "System can upload screenshots" ON storage.objects;
CREATE POLICY "System can upload screenshots" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'analysis-screenshots');

DROP POLICY IF EXISTS "Users can view screenshots" ON storage.objects;
CREATE POLICY "Users can view screenshots" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'analysis-screenshots');

DROP POLICY IF EXISTS "Anyone can view agency logos" ON storage.objects;
CREATE POLICY "Anyone can view agency logos" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'agency-logos');

DROP POLICY IF EXISTS "Users can upload agency logos" ON storage.objects;
CREATE POLICY "Users can upload agency logos" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'agency-logos' AND 
    auth.role() = 'authenticated'
  );


-- ==========================================
-- SECURE CREDIT PROCEDURES
-- ==========================================
REVOKE EXECUTE ON FUNCTION public.add_credits(UUID, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(UUID, INTEGER, TEXT, TEXT) TO service_role;
