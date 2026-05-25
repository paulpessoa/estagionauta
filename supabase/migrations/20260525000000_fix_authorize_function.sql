-- Fix the type mismatch in public.authorize function
-- Convert requested_permission (public.app_permission enum) to text when comparing with role_permissions.permission (text)

CREATE OR REPLACE FUNCTION public.authorize(requested_permission app_permission)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  bind_permissions int;
  user_role public.app_role;
begin
  -- Fetch user role once and store it to reduce number of calls
  select (auth.jwt() ->> 'user_role')::public.app_role into user_role;

  select count(*)
  into bind_permissions
  from public.role_permissions
  where role_permissions.permission = requested_permission::text
    and role_permissions.role = user_role;

  return bind_permissions > 0;
end;
$function$;
