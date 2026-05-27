-- Add referral system columns and trigger logic

-- 1. Alter user_profiles to add referral columns
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.user_profiles(id);

-- 2. Populate referral_code for existing users
UPDATE public.user_profiles 
SET referral_code = UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8)) 
WHERE referral_code IS NULL;

-- 3. Make referral_code NOT NULL for the future
ALTER TABLE public.user_profiles ALTER COLUMN referral_code SET NOT NULL;

-- 4. Update handle_new_user function to support referrals
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  ref_code text;
  referrer_id uuid;
BEGIN
  ref_code := NEW.raw_user_meta_data->>'referral_code';
  
  IF ref_code IS NOT NULL THEN
    SELECT id INTO referrer_id FROM public.user_profiles WHERE referral_code = ref_code;
  END IF;

  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, credits, total_credits_used, total_credits_purchased, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    5,
    0,
    0,
    UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8)),
    referrer_id
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

  -- Se foi indicado por alguém, premiar o indicador
  IF referrer_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.credit_transactions WHERE user_id = referrer_id AND type = 'bonus' AND description = 'Indicação de amigo: ' || NEW.email) THEN
      INSERT INTO public.credit_transactions (user_id, type, amount, description)
      VALUES (referrer_id, 'bonus', 3, 'Indicação de amigo: ' || NEW.email);
      
      -- Recalcular saldo do indicador
      PERFORM get_active_credits(referrer_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Update add_credits function to support referral purchase rewards
CREATE OR REPLACE FUNCTION add_credits(user_uuid uuid, amount integer, description text, stripe_payment_intent_id text DEFAULT NULL)
RETURNS void AS $$
DECLARE
  ref_by_id uuid;
  has_purchased_before boolean;
BEGIN
  -- Check if they purchased before
  SELECT (total_credits_purchased > 0) INTO has_purchased_before
  FROM user_profiles WHERE id = user_uuid;

  -- Insert the purchase transaction
  INSERT INTO credit_transactions (user_id, type, amount, description, stripe_payment_intent_id, expires_at)
  VALUES (user_uuid, 'purchase', amount, description, stripe_payment_intent_id, NOW() + INTERVAL '6 months');

  PERFORM get_active_credits(user_uuid);

  UPDATE user_profiles 
  SET total_credits_purchased = total_credits_purchased + amount
  WHERE id = user_uuid;

  -- If they have a referrer and this is their first purchase, reward the referrer!
  IF NOT has_purchased_before THEN
    SELECT referred_by INTO ref_by_id FROM user_profiles WHERE id = user_uuid;
    IF ref_by_id IS NOT NULL THEN
      -- Award 5 credits to referrer
      INSERT INTO credit_transactions (user_id, type, amount, description)
      VALUES (ref_by_id, 'bonus', 5, 'Bônus: Primeira compra do indicado ' || (SELECT email FROM user_profiles WHERE id = user_uuid));
      
      -- Recalculate referrer balance
      PERFORM get_active_credits(ref_by_id);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
