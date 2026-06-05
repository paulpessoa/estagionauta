-- Migration to add BYOK keys to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN encrypted_gemini_key TEXT DEFAULT NULL,
ADD COLUMN gemini_key_iv TEXT DEFAULT NULL,
ADD COLUMN gemini_key_tag TEXT DEFAULT NULL,
ADD COLUMN encrypted_openai_key TEXT DEFAULT NULL,
ADD COLUMN openai_key_iv TEXT DEFAULT NULL,
ADD COLUMN openai_key_tag TEXT DEFAULT NULL;
