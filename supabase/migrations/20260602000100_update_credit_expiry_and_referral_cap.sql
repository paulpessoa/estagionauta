-- Migration: Update credit expiration to 2 months and apply 15 credits lifetime referral cap
-- Date: 2026-06-02

-- 1. Create helper function to reward referrer bonus with 15 credits cap
CREATE OR REPLACE FUNCTION reward_referrer_bonus(referrer_uuid uuid, invited_uuid uuid, reward_amount integer, reward_description text)
RETURNS void AS $$
DECLARE
  total_earned integer;
  adjusted_amount integer;
  invited_email text;
BEGIN
  -- Get total referral bonus credits already earned by this referrer (both registration and first purchase rewards)
  SELECT COALESCE(SUM(amount), 0) INTO total_earned
  FROM public.credit_transactions
  WHERE user_id = referrer_uuid 
    AND type = 'bonus' 
    AND (description LIKE 'Indicação de amigo:%' OR description LIKE 'Bônus: Primeira compra do indicado%');

  IF total_earned >= 15 THEN
    RETURN;
  END IF;

  adjusted_amount := LEAST(reward_amount, 15 - total_earned);

  IF adjusted_amount > 0 THEN
    INSERT INTO public.credit_transactions (user_id, type, amount, description)
    VALUES (referrer_uuid, 'bonus', adjusted_amount, reward_description);

    -- Recalculate referrer balance cache
    PERFORM get_active_credits(referrer_uuid);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to trigger signup referral bonus on first activity
CREATE OR REPLACE FUNCTION check_and_trigger_referral_signup_bonus(user_uuid uuid)
RETURNS void AS $$
DECLARE
  ref_by_id uuid;
  user_email text;
  already_rewarded boolean;
BEGIN
  -- Check if user has a referrer
  SELECT referred_by, email INTO ref_by_id, user_email
  FROM public.user_profiles
  WHERE id = user_uuid;

  IF ref_by_id IS NULL THEN
    RETURN;
  END IF;

  -- Check if already rewarded for signup of this friend
  SELECT EXISTS(
    SELECT 1 FROM public.credit_transactions
    WHERE user_id = ref_by_id
      AND type = 'bonus'
      AND description = 'Indicação de amigo: ' || user_email
  ) INTO already_rewarded;

  IF NOT already_rewarded THEN
    -- Reward referrer with 3 credits (subject to 15 credit limit)
    PERFORM reward_referrer_bonus(ref_by_id, user_uuid, 3, 'Indicação de amigo: ' || user_email);

    -- Update referral invite status to active in database
    UPDATE public.referral_invites
    SET status = 'active', updated_at = NOW()
    WHERE referrer_id = ref_by_id AND email = user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update handle_new_user to remove immediate referrer reward on registration
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

  -- NOTE: Referral bonus is NO LONGER given immediately on registration.
  -- It is now validated when the referred user performs their first credit-consuming activity.

  -- Update corresponding invite status to 'registered' (it signed up)
  UPDATE public.referral_invites
  SET status = 'registered', updated_at = NOW()
  WHERE email = NEW.email AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Update consume_credits to trigger referral check on first activity
CREATE OR REPLACE FUNCTION consume_credits(user_uuid uuid, amount integer, description text)
RETURNS boolean AS $$
DECLARE
  current_active_credits integer;
BEGIN
  current_active_credits := get_active_credits(user_uuid);
  
  IF current_active_credits < amount THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO credit_transactions (user_id, type, amount, description)
  VALUES (user_uuid, 'usage', amount, description);

  PERFORM get_active_credits(user_uuid);
  
  UPDATE user_profiles 
  SET total_credits_used = total_credits_used + amount
  WHERE id = user_uuid;
  
  -- Trigger signup referral reward check for the referrer
  PERFORM check_and_trigger_referral_signup_bonus(user_uuid);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update add_credits to use 2 months validity and apply cap
CREATE OR REPLACE FUNCTION add_credits(user_uuid uuid, amount integer, description text, stripe_payment_intent_id text DEFAULT NULL)
RETURNS void AS $$
DECLARE
  ref_by_id uuid;
  has_purchased_before boolean;
  user_email text;
BEGIN
  -- Check if they purchased before
  SELECT (total_credits_purchased > 0), email INTO has_purchased_before, user_email
  FROM user_profiles WHERE id = user_uuid;

  -- Insert the purchase transaction (with 2 months expiration)
  INSERT INTO credit_transactions (user_id, type, amount, description, stripe_payment_intent_id, expires_at)
  VALUES (user_uuid, 'purchase', amount, description, stripe_payment_intent_id, NOW() + INTERVAL '2 months');

  PERFORM get_active_credits(user_uuid);

  UPDATE user_profiles 
  SET total_credits_purchased = total_credits_purchased + amount
  WHERE id = user_uuid;

  -- If they have a referrer and this is their first purchase, reward the referrer!
  IF NOT has_purchased_before THEN
    SELECT referred_by INTO ref_by_id FROM user_profiles WHERE id = user_uuid;
    IF ref_by_id IS NOT NULL THEN
      -- Reward 5 credits (subject to 15 credits limit)
      PERFORM reward_referrer_bonus(ref_by_id, user_uuid, 5, 'Bônus: Primeira compra do indicado ' || user_email);
      
      -- Update invite status to active
      UPDATE public.referral_invites
      SET status = 'active', updated_at = NOW()
      WHERE referrer_id = ref_by_id AND email = user_email;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
