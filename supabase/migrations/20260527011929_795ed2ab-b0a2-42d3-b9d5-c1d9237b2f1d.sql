
-- 1) gallery_groups: add description
ALTER TABLE public.gallery_groups ADD COLUMN IF NOT EXISTS description text;

-- 2) trainers: phone, alt phone, hfc_code_name
ALTER TABLE public.trainers
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS phone_alt text,
  ADD COLUMN IF NOT EXISTS hfc_code_name text;

-- 3) profiles: nickname, trainer_id, group_id
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS trainer_id uuid,
  ADD COLUMN IF NOT EXISTS group_id uuid;

-- 4) Allow mentors to update mentor_id/trainer_id/group_id only (via additional policy)
DROP POLICY IF EXISTS profiles_mentor_assign ON public.profiles;
CREATE POLICY profiles_mentor_assign ON public.profiles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'mentor'))
WITH CHECK (public.has_role(auth.uid(), 'mentor'));

-- 5) BEFORE UPDATE trigger: prevent non-admin mentors from changing an already-assigned mentor/trainer/group
CREATE OR REPLACE FUNCTION public.enforce_assignment_lock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'mentor') AND auth.uid() <> NEW.id THEN
    IF OLD.mentor_id IS NOT NULL AND NEW.mentor_id IS DISTINCT FROM OLD.mentor_id THEN
      RAISE EXCEPTION 'Only an admin can change an already-assigned mentor';
    END IF;
    IF OLD.trainer_id IS NOT NULL AND NEW.trainer_id IS DISTINCT FROM OLD.trainer_id THEN
      RAISE EXCEPTION 'Only an admin can change an already-assigned trainer';
    END IF;
    IF OLD.group_id IS NOT NULL AND NEW.group_id IS DISTINCT FROM OLD.group_id THEN
      RAISE EXCEPTION 'Only an admin can change an already-assigned group';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_assignment_lock ON public.profiles;
CREATE TRIGGER trg_enforce_assignment_lock
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_assignment_lock();

-- 6) handle_new_user: pass trainer_id, group_id, nickname from metadata if provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, nickname, trainer_id, group_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NULLIF(NEW.raw_user_meta_data->>'nickname',''),
    NULLIF(NEW.raw_user_meta_data->>'trainer_id','')::uuid,
    NULLIF(NEW.raw_user_meta_data->>'group_id','')::uuid
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
