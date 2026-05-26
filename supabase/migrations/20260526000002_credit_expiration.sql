ALTER TABLE public.credit_transactions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Definir a expiração retroativamente para quem já comprou
UPDATE public.credit_transactions 
SET expires_at = created_at + INTERVAL '30 days'
WHERE type = 'purchase' AND expires_at IS NULL;

-- View/Function to calculate active credits using FIFO
CREATE OR REPLACE FUNCTION get_active_credits(user_uuid uuid)
RETURNS integer AS $$
DECLARE
    total_used integer;
    purchase_record RECORD;
    active_balance integer := 0;
    remaining_used integer;
    bonus_balance integer;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total_used 
    FROM credit_transactions 
    WHERE user_id = user_uuid AND type = 'usage';
    
    remaining_used := total_used;
    
    FOR purchase_record IN 
        SELECT amount, expires_at 
        FROM credit_transactions 
        WHERE user_id = user_uuid AND type = 'purchase' 
        ORDER BY created_at ASC
    LOOP
        IF remaining_used >= purchase_record.amount THEN
            remaining_used := remaining_used - purchase_record.amount;
        ELSE
            DECLARE
                available_from_this_purchase integer;
            BEGIN
                available_from_this_purchase := purchase_record.amount - remaining_used;
                remaining_used := 0;
                
                IF purchase_record.expires_at > NOW() THEN
                    active_balance := active_balance + available_from_this_purchase;
                END IF;
            END;
        END IF;
    END LOOP;
    
    SELECT COALESCE(SUM(amount), 0) INTO bonus_balance 
    FROM credit_transactions 
    WHERE user_id = user_uuid AND type NOT IN ('purchase', 'usage');
    
    active_balance := active_balance + bonus_balance;

    -- Atualiza cache
    UPDATE user_profiles SET credits = active_balance WHERE id = user_uuid;
    
    RETURN active_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar consume_credits
DROP FUNCTION IF EXISTS consume_credits(uuid, integer, text);
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
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar add_credits
DROP FUNCTION IF EXISTS add_credits(uuid, integer, text, text);
CREATE OR REPLACE FUNCTION add_credits(user_uuid uuid, amount integer, description text, stripe_payment_intent_id text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO credit_transactions (user_id, type, amount, description, stripe_payment_intent_id, expires_at)
  VALUES (user_uuid, 'purchase', amount, description, stripe_payment_intent_id, NOW() + INTERVAL '30 days');

  PERFORM get_active_credits(user_uuid);

  UPDATE user_profiles 
  SET total_credits_purchased = total_credits_purchased + amount
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
