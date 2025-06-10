-- Criar enum para status da agência
CREATE TYPE agency_status AS ENUM ('pending', 'approved', 'rejected');

-- Criar tabela de agências
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

-- Habilitar RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Agências podem ser lidas por qualquer usuário autenticado"
  ON public.agencies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agências podem ser criadas por usuários autenticados"
  ON public.agencies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Agências podem ser atualizadas por admins ou pelo criador"
  ON public.agencies
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE role = 'admin'
    ) OR
    auth.uid() = created_by
  );

CREATE POLICY "Agências podem ser deletadas por admins"
  ON public.agencies
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE role = 'admin'
    )
  );

-- Criar trigger para atualizar updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at(); 