-- Script para adicionar colunas na tabela email_logs
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas se não existirem
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS curriculum_slug TEXT;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_email_logs_curriculum_slug ON public.email_logs(curriculum_slug);
CREATE INDEX IF NOT EXISTS idx_email_logs_profile_id ON public.email_logs(profile_id);

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 