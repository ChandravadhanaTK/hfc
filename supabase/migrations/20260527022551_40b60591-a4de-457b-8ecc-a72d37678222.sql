
-- 1. Health uploads storage: restrict read to owner folder + admin/mentor; make bucket private
DROP POLICY IF EXISTS "hu_read" ON storage.objects;
CREATE POLICY "hu_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'health-uploads'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'mentor'::public.app_role)
  )
);

UPDATE storage.buckets SET public = false WHERE id = 'health-uploads';

-- 2. Revoke EXECUTE from anon/PUBLIC on SECURITY DEFINER functions (none of them should be callable anonymously)
REVOKE EXECUTE ON FUNCTION public.enforce_assignment_lock() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_all_profiles() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_full_profile(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_all_activity() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_rsvp() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_all_event() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.send_birthday_reminders() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, PUBLIC;
