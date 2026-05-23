-- Criar tabela de candidaturas (kanban_applications)
CREATE TABLE IF NOT EXISTS public.kanban_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('interested', 'applied', 'interview', 'test', 'offer', 'rejected')),
  applied_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  salary TEXT,
  location TEXT DEFAULT '' NOT NULL,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  progress INTEGER DEFAULT 0 NOT NULL,
  next_action TEXT,
  next_action_date TIMESTAMP WITH TIME ZONE,
  notes TEXT DEFAULT '' NOT NULL,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Criar tabela de lembretes (kanban_reminders)
CREATE TABLE IF NOT EXISTS public.kanban_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.kanban_applications(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'test', 'interview', 'follow-up', 'deadline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kanban_applications_user_id ON public.kanban_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_applications_status ON public.kanban_applications(status);
CREATE INDEX IF NOT EXISTS idx_kanban_reminders_application_id ON public.kanban_reminders(application_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.kanban_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para kanban_applications
DROP POLICY IF EXISTS "Users can manage their own kanban applications" ON public.kanban_applications;
CREATE POLICY "Users can manage their own kanban applications" ON public.kanban_applications
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas de RLS para kanban_reminders
DROP POLICY IF EXISTS "Users can manage reminders for their applications" ON public.kanban_reminders;
CREATE POLICY "Users can manage reminders for their applications" ON public.kanban_reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.kanban_applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kanban_applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

-- Trigger para atualizar o campo updated_at em kanban_applications
CREATE OR REPLACE FUNCTION update_kanban_application_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_kanban_application_timestamp ON public.kanban_applications;
CREATE TRIGGER trigger_update_kanban_application_timestamp
  BEFORE UPDATE ON public.kanban_applications
  FOR EACH ROW EXECUTE FUNCTION update_kanban_application_timestamp();
