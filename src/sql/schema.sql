
-- Este arquivo contém todas as tabelas, políticas RLS e funções necessárias
-- Execute após conectar o Supabase ao projeto

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('mentor', 'mentee', 'admin')) DEFAULT 'mentee',
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. PROFILES TABLE (detailed user information)
CREATE TABLE public.profiles (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  headline TEXT,
  skills TEXT[],
  interests TEXT[],
  is_demo BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  video_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  available_for_mentorship BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. CATEGORIES TABLE (mentorship categories)
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. MENTORSHIP_CATEGORIES (many-to-many relationship)
CREATE TABLE public.mentorship_categories (
  mentor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (mentor_id, category_id)
);

-- 5. MENTORSHIP_REQUESTS TABLE
CREATE TABLE public.mentorship_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')) DEFAULT 'pending',
  message TEXT NOT NULL,
  response_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  meeting_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. MENTOR_AVAILABILITIES TABLE
CREATE TABLE public.mentor_availabilities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT TRUE,
  specific_date DATE, -- for one-time availabilities
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. FEEDBACKS TABLE
CREATE TABLE public.feedbacks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentorship_id UUID REFERENCES public.mentorship_requests(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. EVENTS TABLE (for tracking events like UPE Destaca)
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. EVENT_ATTENDEES TABLE (form submissions from events)
CREATE TABLE public.event_attendees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- if user creates account later
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  source_param TEXT, -- e.g., 'upe_destaca', 'instagram'
  form_data JSONB, -- all form responses
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. UPLOADS TABLE (for resumes, avatars, etc.)
CREATE TABLE public.uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES public.event_attendees(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  original_name TEXT,
  metadata JSONB, -- AI analysis results, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. CURRICULUM_ANALYSIS TABLE (AI analysis results)
CREATE TABLE public.curriculum_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  upload_id UUID REFERENCES public.uploads(id) ON DELETE CASCADE NOT NULL,
  attendee_id UUID REFERENCES public.event_attendees(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL, -- AI response with scores and recommendations
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. AGENCIES TABLE (for internship agencies map)
CREATE TABLE public.agencies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  areas TEXT[], -- areas of expertise
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. AGENCY_REVIEWS TABLE
CREATE TABLE public.agency_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES public.event_attendees(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  comment TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ===========================
-- ROW LEVEL SECURITY POLICIES
-- ===========================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_reviews ENABLE ROW LEVEL SECURITY;

-- USERS table policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- PROFILES table policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- CATEGORIES table policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Only admins can modify categories" ON public.categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- MENTORSHIP_CATEGORIES table policies
CREATE POLICY "Mentorship categories are viewable by everyone" ON public.mentorship_categories FOR SELECT USING (true);
CREATE POLICY "Users can manage own mentorship categories" ON public.mentorship_categories FOR ALL USING (auth.uid() = mentor_id);

-- MENTORSHIP_REQUESTS table policies
CREATE POLICY "Users can view own mentorship requests" ON public.mentorship_requests FOR SELECT USING (
  auth.uid() = mentee_id OR auth.uid() = mentor_id
);
CREATE POLICY "Mentees can create requests" ON public.mentorship_requests FOR INSERT WITH CHECK (auth.uid() = mentee_id);
CREATE POLICY "Users can update own requests" ON public.mentorship_requests FOR UPDATE USING (
  auth.uid() = mentee_id OR auth.uid() = mentor_id
);

-- MENTOR_AVAILABILITIES table policies
CREATE POLICY "Availabilities are viewable by everyone" ON public.mentor_availabilities FOR SELECT USING (true);
CREATE POLICY "Mentors can manage own availabilities" ON public.mentor_availabilities FOR ALL USING (auth.uid() = mentor_id);

-- FEEDBACKS table policies
CREATE POLICY "Feedbacks are viewable by everyone" ON public.feedbacks FOR SELECT USING (true);
CREATE POLICY "Users can create feedbacks for their mentorships" ON public.feedbacks FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- EVENTS table policies
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Only admins can manage events" ON public.events FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- EVENT_ATTENDEES table policies
CREATE POLICY "Attendees can view own data" ON public.event_attendees FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
CREATE POLICY "Anyone can insert attendee data" ON public.event_attendees FOR INSERT WITH CHECK (true);

-- UPLOADS table policies
CREATE POLICY "Users can view own uploads" ON public.uploads FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
CREATE POLICY "Users can insert own uploads" ON public.uploads FOR INSERT WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

-- CURRICULUM_ANALYSIS table policies
CREATE POLICY "Users can view related analysis" ON public.curriculum_analysis FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.uploads 
    WHERE uploads.id = upload_id AND uploads.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- AGENCIES table policies
CREATE POLICY "Agencies are viewable by everyone" ON public.agencies FOR SELECT USING (true);
CREATE POLICY "Only admins can manage agencies" ON public.agencies FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- AGENCY_REVIEWS table policies
CREATE POLICY "Reviews are viewable by everyone" ON public.agency_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.agency_reviews FOR INSERT WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);
CREATE POLICY "Users can update own reviews" ON public.agency_reviews FOR UPDATE USING (auth.uid() = user_id);

-- ===========================
-- FUNCTIONS AND TRIGGERS
-- ===========================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
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
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.mentorship_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.curriculum_analysis FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
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
      WHERE agency_id = COALESCE(NEW.agency_id, OLD.agency_id)
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.agency_reviews 
      WHERE agency_id = COALESCE(NEW.agency_id, OLD.agency_id)
    )
  WHERE id = COALESCE(NEW.agency_id, OLD.agency_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for agency rating updates
CREATE TRIGGER update_agency_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.agency_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_agency_rating();

-- ===========================
-- INSERT SAMPLE DATA
-- ===========================

-- Insert default categories
INSERT INTO public.categories (name, slug, description, icon) VALUES
  ('Tecnologia', 'tecnologia', 'Desenvolvimento, programação, TI', 'Code'),
  ('Marketing', 'marketing', 'Marketing digital, mídias sociais', 'Megaphone'),
  ('Finanças', 'financas', 'Contabilidade, investimentos, economia', 'DollarSign'),
  ('Design', 'design', 'UI/UX, design gráfico, criatividade', 'Palette'),
  ('Vendas', 'vendas', 'Vendas, relacionamento com cliente', 'TrendingUp'),
  ('Recursos Humanos', 'rh', 'Gestão de pessoas, recrutamento', 'Users'),
  ('Empreendedorismo', 'empreendedorismo', 'Startups, inovação, negócios', 'Lightbulb'),
  ('Carreira', 'carreira', 'Desenvolvimento profissional geral', 'Briefcase');

-- Insert UPE Destaca event
INSERT INTO public.events (name, slug, description, start_date, end_date, location) VALUES
  ('UPE Destaca 2024', 'upe-destaca-2024', 'Evento de carreira da Universidade de Pernambuco', '2024-03-15', '2024-03-16', 'Campus Benfica - UPE');

-- Insert sample agencies
INSERT INTO public.agencies (name, description, website, email, address, areas, is_verified) VALUES
  ('CIEE Pernambuco', 'Centro de Integração Empresa-Escola, uma das maiores organizações de estágio do Brasil', 'https://www.ciee.org.br', 'contato@cieepe.org.br', 'Rua da Aurora, 463 - Boa Vista, Recife - PE', ARRAY['Todas as áreas'], true),
  ('IEL - Instituto Euvaldo Lodi', 'Instituição do Sistema Federação das Indústrias focada em estágios industriais', 'https://www.iel.org.br', 'iel@fiepe.org.br', 'Av. Cruz Cabugá, 1200 - Santo Amaro, Recife - PE', ARRAY['Engenharia', 'Tecnologia', 'Indústria'], true),
  ('Nube - Núcleo Brasileiro de Estágios', 'Organização nacional especializada em programas de estágio e trainee', 'https://www.nube.com.br', 'contato@nube.com.br', 'Rua do Hospício, 81 - Boa Vista, Recife - PE', ARRAY['Administração', 'Marketing', 'Vendas'], true);

COMMIT;
