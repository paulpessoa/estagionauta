-- Script para configurar o bucket de storage para avatares de usuários
-- Execute este script no Supabase SQL Editor

-- Criar bucket para avatares de usuários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket user-avatars

-- Permitir que usuários autenticados façam upload de seus próprios avatares
CREATE POLICY "Users can upload own avatar" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'user-avatars' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Permitir que usuários autenticados atualizem seus próprios avatares
CREATE POLICY "Users can update own avatar" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'user-avatars' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Permitir que usuários autenticados deletem seus próprios avatares
CREATE POLICY "Users can delete own avatar" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'user-avatars' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Permitir que qualquer pessoa visualize avatares (público)
CREATE POLICY "Anyone can view avatars" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'user-avatars');

-- Verificar se o bucket foi criado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'user-avatars'; 