
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  username,
  full_name,
  nickname,
  team,
  avatar_url,
  current_book,
  training_type,
  fitness_experience,
  fitness_goals,
  mentor_id
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_peer_safe" ON public.profiles;

-- Keep row-level access broad but restrict columns via GRANT
CREATE POLICY "profiles_select_peer_via_view" ON public.profiles
FOR SELECT TO authenticated
USING (true);

REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, username, full_name, nickname, team, avatar_url, current_book,
  training_type, fitness_experience, fitness_goals, mentor_id
) ON public.profiles TO authenticated;

GRANT SELECT ON public.profiles TO service_role;
GRANT EXECUTE ON FUNCTION public.get_full_profile(uuid) TO authenticated;
