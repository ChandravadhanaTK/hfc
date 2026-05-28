
-- Fix: authenticated role lost EXECUTE on has_role, breaking all RLS policies that call it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

-- Tighten event creation to admins only
DROP POLICY IF EXISTS events_insert ON public.events;
CREATE POLICY events_admin_insert ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
