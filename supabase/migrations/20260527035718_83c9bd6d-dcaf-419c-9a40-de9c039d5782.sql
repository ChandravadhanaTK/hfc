
-- 1) Remove the over-broad peer SELECT policy on profiles
DROP POLICY IF EXISTS profiles_select_peer_via_view ON public.profiles;

-- 2) Recreate public_profiles view with group_id, as SECURITY DEFINER (default) so authenticated
--    peers can still read safe, non-sensitive columns of other members through the view.
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
  SELECT id, username, full_name, nickname, team, avatar_url, current_book,
         training_type, fitness_experience, fitness_goals, mentor_id, group_id
  FROM public.profiles;
GRANT SELECT ON public.public_profiles TO authenticated;

-- 3) Restrict mentor updates on profiles to safe assignment columns via a trigger
CREATE OR REPLACE FUNCTION public.enforce_mentor_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins and self-updates are unrestricted (other rules still apply)
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF auth.uid() = NEW.id THEN
    RETURN NEW;
  END IF;
  -- For mentors editing another member, only allow assignment columns to change
  IF public.has_role(auth.uid(), 'mentor') THEN
    IF NEW.username       IS DISTINCT FROM OLD.username
    OR NEW.full_name      IS DISTINCT FROM OLD.full_name
    OR NEW.nickname       IS DISTINCT FROM OLD.nickname
    OR NEW.phone          IS DISTINCT FROM OLD.phone
    OR NEW.gender         IS DISTINCT FROM OLD.gender
    OR NEW.birthday       IS DISTINCT FROM OLD.birthday
    OR NEW.social_handle  IS DISTINCT FROM OLD.social_handle
    OR NEW.avatar_url     IS DISTINCT FROM OLD.avatar_url
    OR NEW.height_cm      IS DISTINCT FROM OLD.height_cm
    OR NEW.weight_kg      IS DISTINCT FROM OLD.weight_kg
    OR NEW.past_injuries  IS DISTINCT FROM OLD.past_injuries
    OR NEW.medications    IS DISTINCT FROM OLD.medications
    OR NEW.sleep_hours    IS DISTINCT FROM OLD.sleep_hours
    OR NEW.eating_habits  IS DISTINCT FROM OLD.eating_habits
    OR NEW.hydration_liters IS DISTINCT FROM OLD.hydration_liters
    OR NEW.allergies      IS DISTINCT FROM OLD.allergies
    OR NEW.diet           IS DISTINCT FROM OLD.diet
    OR NEW.activity_level IS DISTINCT FROM OLD.activity_level
    OR NEW.fitness_experience IS DISTINCT FROM OLD.fitness_experience
    OR NEW.fitness_goals  IS DISTINCT FROM OLD.fitness_goals
    OR NEW.credits        IS DISTINCT FROM OLD.credits
    OR NEW.training_type  IS DISTINCT FROM OLD.training_type
    OR NEW.team           IS DISTINCT FROM OLD.team
    OR NEW.current_book   IS DISTINCT FROM OLD.current_book
    OR NEW.referral_code  IS DISTINCT FROM OLD.referral_code
    OR NEW.referred_by    IS DISTINCT FROM OLD.referred_by
    OR NEW.joining_date   IS DISTINCT FROM OLD.joining_date
    OR NEW.last_login_at  IS DISTINCT FROM OLD.last_login_at
    THEN
      RAISE EXCEPTION 'Mentors may only change assignment fields (mentor_id, trainer_id, group_id) on other members';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_mentor_update_scope ON public.profiles;
CREATE TRIGGER trg_enforce_mentor_update_scope
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_mentor_update_scope();

-- 4) Prevent members from self-awarding badges
DROP POLICY IF EXISTS ub_insert_own ON public.user_badges;
CREATE POLICY ub_insert_staff ON public.user_badges
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mentor')
  );
