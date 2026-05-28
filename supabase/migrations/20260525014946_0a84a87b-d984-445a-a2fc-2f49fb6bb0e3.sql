
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  event_inapp boolean NOT NULL DEFAULT true,
  event_sms boolean NOT NULL DEFAULT false,
  event_email boolean NOT NULL DEFAULT false,
  activity_inapp boolean NOT NULL DEFAULT true,
  activity_sms boolean NOT NULL DEFAULT false,
  activity_email boolean NOT NULL DEFAULT false,
  rsvp_inapp boolean NOT NULL DEFAULT true,
  rsvp_sms boolean NOT NULL DEFAULT false,
  rsvp_email boolean NOT NULL DEFAULT false,
  achievement_inapp boolean NOT NULL DEFAULT true,
  achievement_sms boolean NOT NULL DEFAULT false,
  achievement_email boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY np_select_own ON public.notification_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY np_insert_own ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY np_update_own ON public.notification_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY np_admin_all ON public.notification_preferences
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_np_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed defaults for existing users
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Extend handle_new_user to also create preferences row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name','')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$function$;
