-- Script para adicionar colunas necessárias na tabela email_logs
-- Execute este script no Supabase SQL Editor

-- Verificar se a tabela email_logs existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_logs' AND table_schema = 'public') THEN
        -- Criar tabela email_logs se não existir
        CREATE TABLE public.email_logs (
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
    END IF;
END $$;

-- Adicionar colunas para currículo (se não existirem)
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS curriculum_slug TEXT;

-- Criar índices para melhorar performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_email_logs_curriculum_slug ON public.email_logs(curriculum_slug);
CREATE INDEX IF NOT EXISTS idx_email_logs_profile_id ON public.email_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- Adicionar comentários nas colunas
COMMENT ON COLUMN public.email_logs.profile_id IS 'ID do perfil do usuário que compartilhou o currículo';
COMMENT ON COLUMN public.email_logs.curriculum_slug IS 'Slug do currículo compartilhado';

-- Verificar se as colunas foram adicionadas corretamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 