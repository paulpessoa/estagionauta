-- Update welcome credits and credit expiration policies to 6 months

-- Update existing purchase transactions to expire in 6 months instead of 30 days
UPDATE public.credit_transactions
SET expires_at = created_at + INTERVAL '6 months'
WHERE type = 'purchase';

-- Update add_credits function to use 6 months
CREATE OR REPLACE FUNCTION add_credits(user_uuid uuid, amount integer, description text, stripe_payment_intent_id text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO credit_transactions (user_id, type, amount, description, stripe_payment_intent_id, expires_at)
  VALUES (user_uuid, 'purchase', amount, description, stripe_payment_intent_id, NOW() + INTERVAL '6 months');

  PERFORM get_active_credits(user_uuid);

  UPDATE user_profiles 
  SET total_credits_purchased = total_credits_purchased + amount
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user function to give 5 starting credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, credits, total_credits_used, total_credits_purchased)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    5,
    0,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    credits = COALESCE(user_profiles.credits, 5),
    total_credits_used = COALESCE(user_profiles.total_credits_used, 0),
    total_credits_purchased = COALESCE(user_profiles.total_credits_purchased, 0);
  
  -- Registrar créditos iniciais como bônus (apenas se não existir)
  IF NOT EXISTS (SELECT 1 FROM public.credit_transactions WHERE user_id = NEW.id AND type = 'bonus' AND description = 'Créditos iniciais de boas-vindas') THEN
    INSERT INTO public.credit_transactions (user_id, type, amount, description)
    VALUES (NEW.id, 'bonus', 5, 'Créditos iniciais de boas-vindas');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
