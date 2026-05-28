-- codex_entries
DROP POLICY IF EXISTS codex_select_all ON public.codex_entries;
CREATE POLICY codex_select_own ON public.codex_entries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

-- achievement_attempts
DROP POLICY IF EXISTS att_select ON public.achievement_attempts;
CREATE POLICY att_select_own ON public.achievement_attempts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

-- book_log
DROP POLICY IF EXISTS books_select ON public.book_log;
CREATE POLICY books_select_own ON public.book_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

-- progress_tests
DROP POLICY IF EXISTS progress_select_all ON public.progress_tests;
CREATE POLICY progress_select_own ON public.progress_tests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

-- profiles: restrict full row access to self + admin/mentor
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

-- public_profiles view: safe columns visible to all authenticated users
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, username, full_name, team, avatar_url, current_book
  FROM public.profiles;
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Lock down SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;