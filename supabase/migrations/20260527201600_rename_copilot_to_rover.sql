-- Rename copilot_messages to rover_messages
ALTER TABLE IF EXISTS public.copilot_messages RENAME TO rover_messages;

-- Rename copilot_abuse_logs to rover_abuse_logs
ALTER TABLE IF EXISTS public.copilot_abuse_logs RENAME TO rover_abuse_logs;

-- Rename policies to reflect new names
ALTER POLICY "Users can manage their own copilot messages" ON public.rover_messages RENAME TO "Users can manage their own rover messages";
ALTER POLICY "Admins can view abuse logs" ON public.rover_abuse_logs RENAME TO "Admins can view rover abuse logs";
