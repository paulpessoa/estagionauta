-- Fix FIFO get_active_credits calculation bug with bonus credits

CREATE OR REPLACE FUNCTION get_active_credits(user_uuid uuid)
RETURNS integer AS $$
DECLARE
    total_used integer;
    deposit_record RECORD;
    active_balance integer := 0;
    remaining_used integer;
BEGIN
    -- Sum of all usage
    SELECT COALESCE(SUM(amount), 0) INTO total_used 
    FROM credit_transactions 
    WHERE user_id = user_uuid AND type = 'usage';
    
    remaining_used := total_used;
    
    -- Loop through all deposits (purchase, bonus, refund, etc.) chronologically
    FOR deposit_record IN 
        SELECT amount, expires_at 
        FROM credit_transactions 
        WHERE user_id = user_uuid AND type != 'usage' 
        ORDER BY created_at ASC
    LOOP
        IF remaining_used >= deposit_record.amount THEN
            remaining_used := remaining_used - deposit_record.amount;
        ELSE
            DECLARE
                available_from_this_deposit integer;
            BEGIN
                available_from_this_deposit := deposit_record.amount - remaining_used;
                remaining_used := 0;
                
                -- Add to active balance if it is not expired (or has no expiration like bonus)
                IF deposit_record.expires_at IS NULL OR deposit_record.expires_at > NOW() THEN
                    active_balance := active_balance + available_from_this_deposit;
                END IF;
            END;
        END IF;
    END LOOP;
    
    -- Update cache in user_profiles
    UPDATE user_profiles SET credits = active_balance WHERE id = user_uuid;
    
    RETURN active_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
