-- Script para verificar e corrigir a tabela email_logs
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'email_logs'
) as table_exists;

-- 2. Verificar estrutura atual da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_email VARCHAR NOT NULL,
    from_email VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'pending',
    provider VARCHAR DEFAULT 'brevo',
    provider_id VARCHAR,
    template_name VARCHAR,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    curriculum_slug TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Adicionar colunas se não existirem
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS curriculum_slug TEXT;

-- 5. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_email_logs_curriculum_slug ON public.email_logs(curriculum_slug);
CREATE INDEX IF NOT EXISTS idx_email_logs_profile_id ON public.email_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- 6. Verificar permissões RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'email_logs';

-- 7. Habilitar RLS se necessário
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 8. Criar política para permitir inserção da Edge Function
DROP POLICY IF EXISTS "Allow service role to insert email logs" ON public.email_logs;
CREATE POLICY "Allow service role to insert email logs" ON public.email_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 9. Criar política para usuários verem seus próprios logs
DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_logs;
CREATE POLICY "Users can view their own email logs" ON public.email_logs
    FOR SELECT
    TO authenticated
    USING (profile_id = auth.uid());

-- 10. Testar inserção manual
INSERT INTO public.email_logs (
    to_email,
    from_email,
    subject,
    status,
    provider,
    template_name,
    profile_id,
    curriculum_slug
) VALUES (
    'teste@exemplo.com',
    'noreply@estagionauta.com.br',
    'Teste de Log',
    'sent',
    'brevo',
    'test',
    NULL,
    'test-slug'
) ON CONFLICT DO NOTHING;

-- 11. Verificar se a inserção funcionou
SELECT 
    id,
    to_email,
    from_email,
    subject,
    status,
    created_at
FROM public.email_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- 12. Limpar dados de teste
DELETE FROM public.email_logs WHERE subject = 'Teste de Log'; 