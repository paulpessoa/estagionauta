-- Rename copilot_messages to cover_messages
ALTER TABLE IF EXISTS public.copilot_messages RENAME TO cover_messages;

-- Rename copilot_abuse_logs to cover_abuse_logs
ALTER TABLE IF EXISTS public.copilot_abuse_logs RENAME TO cover_abuse_logs;

-- Rename policies to reflect new names
ALTER POLICY "Users can manage their own copilot messages" ON public.cover_messages RENAME TO "Users can manage their own cover messages";
ALTER POLICY "Admins can view abuse logs" ON public.cover_abuse_logs RENAME TO "Admins can view cover abuse logs";
