-- Atualizar usuários existentes que não têm créditos
UPDATE user_profiles 
SET 
  credits = COALESCE(credits, 20),
  total_credits_used = COALESCE(total_credits_used, 0),
  total_credits_purchased = COALESCE(total_credits_purchased, 0)
WHERE credits IS NULL OR total_credits_used IS NULL OR total_credits_purchased IS NULL;

-- Adicionar créditos iniciais para usuários que não têm transações de bônus
INSERT INTO credit_transactions (user_id, type, amount, description)
SELECT 
  up.id,
  'bonus',
  20,
  'Créditos iniciais de boas-vindas'
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM credit_transactions ct 
  WHERE ct.user_id = up.id 
  AND ct.type = 'bonus' 
  AND ct.description = 'Créditos iniciais de boas-vindas'
)
AND up.created_at < NOW() - INTERVAL '1 hour'; -- Apenas usuários criados há mais de 1 hora 