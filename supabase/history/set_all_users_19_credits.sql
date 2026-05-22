-- Script para definir 19 créditos para todos os usuários existentes
-- Execute este script no Supabase SQL Editor

-- 1. Atualizar todos os usuários para terem 19 créditos
UPDATE user_profiles 
SET 
  credits = 19,
  total_credits_used = 0,
  total_credits_purchased = 0
WHERE credits IS NULL OR credits != 19;

-- 2. Adicionar transação de bônus para usuários que não têm
INSERT INTO credit_transactions (user_id, type, amount, description)
SELECT 
  up.id,
  'bonus',
  19,
  'Créditos de teste - 19 créditos'
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM credit_transactions ct 
  WHERE ct.user_id = up.id 
  AND ct.type = 'bonus' 
  AND ct.description = 'Créditos de teste - 19 créditos'
);

-- 3. Verificar resultado
SELECT 
  'Créditos definidos com sucesso!' as status,
  COUNT(*) as total_users,
  SUM(credits) as total_credits_available,
  AVG(credits) as media_credits_por_usuario
FROM user_profiles;

-- 4. Mostrar alguns usuários para verificação
SELECT 
  id,
  email,
  credits,
  total_credits_used,
  total_credits_purchased,
  created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 10; 