-- 1. Create user_reminders table
CREATE TABLE IF NOT EXISTS public.user_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  reminder_at TIMESTAMP WITH TIME ZONE NOT NULL,
  candidatura_id UUID REFERENCES public.kanban_applications(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for user_reminders
CREATE INDEX IF NOT EXISTS idx_user_reminders_user_id ON public.user_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reminders_reminder_at ON public.user_reminders(reminder_at);

-- Enable RLS
ALTER TABLE public.user_reminders ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "Users can manage their own reminders" ON public.user_reminders;
CREATE POLICY "Users can manage their own reminders" ON public.user_reminders
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Create referral_invites table
CREATE TABLE IF NOT EXISTS public.referral_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'registered', 'active')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(referrer_id, email)
);

-- Index for referral_invites
CREATE INDEX IF NOT EXISTS idx_referral_invites_referrer_id ON public.referral_invites(referrer_id);

-- Enable RLS
ALTER TABLE public.referral_invites ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "Users can manage their own referral invites" ON public.referral_invites;
CREATE POLICY "Users can manage their own referral invites" ON public.referral_invites
  FOR ALL USING (auth.uid() = referrer_id)
  WITH CHECK (auth.uid() = referrer_id);

-- 3. Create user_tasks table (for gamified tasks)
CREATE TABLE IF NOT EXISTS public.user_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_key TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  claimed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, task_key)
);

-- Index for user_tasks
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON public.user_tasks(user_id);

-- Enable RLS
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.user_tasks;
CREATE POLICY "Users can manage their own tasks" ON public.user_tasks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for update_timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_reminders_timestamp ON public.user_reminders;
CREATE TRIGGER trigger_update_user_reminders_timestamp
  BEFORE UPDATE ON public.user_reminders
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trigger_update_referral_invites_timestamp ON public.referral_invites;
CREATE TRIGGER trigger_update_referral_invites_timestamp
  BEFORE UPDATE ON public.referral_invites
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trigger_update_user_tasks_timestamp ON public.user_tasks;
CREATE TRIGGER trigger_update_user_tasks_timestamp
  BEFORE UPDATE ON public.user_tasks
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 4. Update handle_new_user to also update referral_invites
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

  -- Atualizar convite correspondente se houver (mesmo sem referral_code)
  UPDATE public.referral_invites
  SET status = 'registered', updated_at = NOW()
  WHERE email = NEW.email AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Update add_credits to also update referral_invites
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

      -- Update invite status
      UPDATE public.referral_invites
      SET status = 'active', updated_at = NOW()
      WHERE referrer_id = ref_by_id AND email = (SELECT email FROM user_profiles WHERE id = user_uuid);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
