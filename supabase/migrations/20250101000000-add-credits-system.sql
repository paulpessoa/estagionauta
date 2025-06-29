-- Verificar e adicionar colunas de créditos na tabela user_profiles (se não existirem)
DO $$ 
BEGIN
    -- Adicionar coluna credits se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'credits') THEN
        ALTER TABLE user_profiles ADD COLUMN credits INTEGER DEFAULT 20 NOT NULL;
    END IF;
    
    -- Adicionar coluna total_credits_used se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'total_credits_used') THEN
        ALTER TABLE user_profiles ADD COLUMN total_credits_used INTEGER DEFAULT 0 NOT NULL;
    END IF;
    
    -- Adicionar coluna total_credits_purchased se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'total_credits_purchased') THEN
        ALTER TABLE user_profiles ADD COLUMN total_credits_purchased INTEGER DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- Criar tabela de histórico de créditos (se não existir)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Criar índices para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Função para consumir créditos
CREATE OR REPLACE FUNCTION consume_credits(
  user_uuid UUID,
  amount INTEGER,
  description TEXT DEFAULT 'Análise de currículo'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Verificar se o usuário tem créditos suficientes
  SELECT credits INTO current_credits 
  FROM user_profiles 
  WHERE id = user_uuid;
  
  IF current_credits < amount THEN
    RETURN FALSE;
  END IF;
  
  -- Atualizar créditos do usuário
  UPDATE user_profiles 
  SET 
    credits = credits - amount,
    total_credits_used = total_credits_used + amount
  WHERE id = user_uuid;
  
  -- Registrar transação
  INSERT INTO credit_transactions (user_id, type, amount, description)
  VALUES (user_uuid, 'usage', amount, description);
  
  RETURN TRUE;
END;
$$;

-- Função para adicionar créditos (compras)
CREATE OR REPLACE FUNCTION add_credits(
  user_uuid UUID,
  amount INTEGER,
  stripe_payment_intent_id TEXT DEFAULT NULL,
  description TEXT DEFAULT 'Compra de créditos'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar créditos do usuário
  UPDATE user_profiles 
  SET 
    credits = credits + amount,
    total_credits_purchased = total_credits_purchased + amount
  WHERE id = user_uuid;
  
  -- Registrar transação
  INSERT INTO credit_transactions (user_id, type, amount, description, stripe_payment_intent_id)
  VALUES (user_uuid, 'purchase', amount, description, stripe_payment_intent_id);
END;
$$;

-- RLS Policies para credit_transactions (se não existirem)
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias transações
DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Apenas funções autorizadas podem inserir/atualizar
DROP POLICY IF EXISTS "Only authorized functions can insert credit transactions" ON credit_transactions;
CREATE POLICY "Only authorized functions can insert credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Only authorized functions can update credit transactions" ON credit_transactions;
CREATE POLICY "Only authorized functions can update credit transactions" ON credit_transactions
  FOR UPDATE USING (false);

-- Trigger para atualizar créditos quando um novo usuário é criado
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_profiles (id, email, credits, total_credits_used, total_credits_purchased)
  VALUES (NEW.id, NEW.email, 20, 0, 0)
  ON CONFLICT (id) DO UPDATE SET
    credits = COALESCE(user_profiles.credits, 20),
    total_credits_used = COALESCE(user_profiles.total_credits_used, 0),
    total_credits_purchased = COALESCE(user_profiles.total_credits_purchased, 0);
  
  -- Registrar créditos iniciais como bônus (apenas se não existir)
  IF NOT EXISTS (SELECT 1 FROM credit_transactions WHERE user_id = NEW.id AND type = 'bonus' AND description = 'Créditos iniciais de boas-vindas') THEN
    INSERT INTO credit_transactions (user_id, type, amount, description)
    VALUES (NEW.id, 'bonus', 20, 'Créditos iniciais de boas-vindas');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para novos usuários (se não existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 