-- Migration: Create coupons and coupon_redemptions tables
CREATE TABLE public.coupons (
    code text PRIMARY KEY,
    credits integer NOT NULL DEFAULT 5,
    max_uses integer,
    used_count integer NOT NULL DEFAULT 0,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.coupon_redemptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_code text REFERENCES public.coupons(code) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    redeemed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_coupon UNIQUE (user_id, coupon_code)
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Seed default coupons
INSERT INTO public.coupons (code, credits, max_uses, expires_at)
VALUES 
  ('ESTAGIO100', 10, NULL, NULL),
  ('BOASVINDAS', 5, NULL, NULL)
ON CONFLICT (code) DO NOTHING;
