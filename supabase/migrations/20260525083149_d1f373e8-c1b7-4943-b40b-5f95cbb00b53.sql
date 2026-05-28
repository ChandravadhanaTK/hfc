
-- 1. Profiles: drop permissive policy, create safe public view
DROP POLICY IF EXISTS profiles_select_public_cols ON public.profiles;

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, username, full_name, avatar_url, team, training_type, gender,
       fitness_experience, fitness_goals, mentor_id
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- Allow authenticated users to read the safe view rows via the underlying
-- table by re-adding a permissive policy ONLY for the view's safe columns.
-- Since RLS can't restrict columns, we instead allow any authenticated user
-- to read any profile row, but the view is the only intended access path
-- and column-level GRANTs restrict what columns peers can read on the base
-- table.
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, username, full_name, avatar_url, team, training_type,
              gender, fitness_experience, fitness_goals, mentor_id,
              created_at)
  ON public.profiles TO authenticated;

-- Owner / admin / mentor still get full row access via existing policies
-- (profiles_select_own, profiles_admin_all). Re-add a permissive policy that
-- mirrors what peers may see so SELECT through the view works.
CREATE POLICY profiles_select_peer_safe ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- 2. event_rsvps: restrict select
DROP POLICY IF EXISTS rsvps_select ON public.event_rsvps;
CREATE POLICY rsvps_select ON public.event_rsvps
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'mentor'::app_role)
    OR EXISTS (SELECT 1 FROM public.events e
               WHERE e.id = event_id AND e.created_by = auth.uid())
  );

-- 3. health_logs: allow mentors to read
DROP POLICY IF EXISTS health_own ON public.health_logs;
CREATE POLICY health_own ON public.health_logs
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'mentor'::app_role)
  )
  WITH CHECK (auth.uid() = user_id);

-- 4. Realtime: restrict private channel subscription to owner
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "realtime_user_topic_only" ON realtime.messages;
CREATE POLICY "realtime_user_topic_only" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    -- Allow shared/public topics (anything not prefixed with "user:")
    (realtime.topic() NOT LIKE 'user:%')
    OR (realtime.topic() = 'user:' || auth.uid()::text)
  );

-- 5. Storage: make progress-imports private and lock down access
UPDATE storage.buckets SET public = false WHERE id = 'progress-imports';

DROP POLICY IF EXISTS "progress imports public read" ON storage.objects;
DROP POLICY IF EXISTS "progress_imports_owner_read" ON storage.objects;
DROP POLICY IF EXISTS "progress_imports_owner_write" ON storage.objects;
DROP POLICY IF EXISTS "progress_imports_owner_delete" ON storage.objects;

CREATE POLICY "progress_imports_owner_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'progress-imports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'mentor'::app_role)
    )
  );
CREATE POLICY "progress_imports_owner_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'progress-imports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "progress_imports_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'progress-imports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 6. health-uploads: keep public read for displayed images but require
-- folder-scoped uploads so users can't overwrite each others' files
DROP POLICY IF EXISTS "health_uploads_owner_write" ON storage.objects;
DROP POLICY IF EXISTS "health_uploads_owner_delete" ON storage.objects;

CREATE POLICY "health_uploads_owner_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'health-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "health_uploads_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'health-uploads'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 7. Revoke public execute on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.list_all_profiles() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_full_profile(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_birthday_reminders() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_rsvp() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_all_event() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_all_activity() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.list_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_full_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
