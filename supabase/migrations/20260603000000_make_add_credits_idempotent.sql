-- Migration: Make add_credits function idempotent by checking stripe_payment_intent_id duplicates

CREATE OR REPLACE FUNCTION add_credits(user_uuid uuid, amount integer, description text, stripe_payment_intent_id text DEFAULT NULL)
RETURNS void AS $$
DECLARE
  ref_by_id uuid;
  has_purchased_before boolean;
  user_email text;
BEGIN
  -- Check for duplicate processing of the same Stripe payment
  IF stripe_payment_intent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM credit_transactions WHERE credit_transactions.stripe_payment_intent_id = add_credits.stripe_payment_intent_id
  ) THEN
    -- Already processed, return immediately to ensure idempotency
    RETURN;
  END IF;

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
