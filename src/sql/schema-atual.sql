-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.agencies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  email text,
  phone text,
  website text,
  instagram text,
  address text,
  city text,
  state text,
  cep text,
  latitude numeric,
  longitude numeric,
  areas ARRAY,
  logo_url text,
  is_verified boolean DEFAULT false,
  is_whatsapp boolean DEFAULT false,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  status USER-DEFINED DEFAULT 'pending'::agency_status,
  created_by uuid NOT NULL,
  verified_by uuid,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  agency_type text CHECK (agency_type = ANY (ARRAY['faculdade'::text, 'consultoria'::text, 'agencia_privada'::text, 'orgao_publico'::text, 'instituto'::text, 'fundacao'::text, 'outro'::text])),
  CONSTRAINT agencies_pkey PRIMARY KEY (id),
  CONSTRAINT agencies_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.user_profiles(id),
  CONSTRAINT agencies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.agency_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  agency_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  reason text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending'::text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT agency_reports_pkey PRIMARY KEY (id),
  CONSTRAINT agency_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.user_profiles(id),
  CONSTRAINT agency_reports_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
  CONSTRAINT agency_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.agency_reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  agency_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text NOT NULL,
  justification text NOT NULL,
  is_moderated boolean DEFAULT false,
  moderated_by uuid,
  moderated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT agency_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT agency_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id),
  CONSTRAINT agency_reviews_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
  CONSTRAINT agency_reviews_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.analysis_screenshots (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  analysis_id uuid NOT NULL,
  screenshot_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT analysis_screenshots_pkey PRIMARY KEY (id),
  CONSTRAINT analysis_screenshots_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.curriculum_analysis(id)
);
CREATE TABLE public.curriculum_analysis (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  course text,
  university text,
  file_url text,
  analysis_data jsonb,
  status USER-DEFINED DEFAULT 'pending'::analysis_status,
  credits_used integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT curriculum_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT curriculum_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  to_email character varying NOT NULL,
  from_email character varying NOT NULL,
  subject character varying NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  provider character varying DEFAULT 'resend'::character varying,
  provider_id character varying,
  template_name character varying,
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.resume_analyses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  resume_text text,
  form_data jsonb,
  analysis_data jsonb,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT resume_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT resume_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.role_permissions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  role USER-DEFINED NOT NULL,
  permission text NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role USER-DEFINED DEFAULT 'student'::user_role,
  credits integer DEFAULT 2,
  subscription_status text DEFAULT 'free'::text,
  subscription_tier text,
  location_enabled boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_roles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);