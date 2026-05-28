
-- profiles additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male','female')),
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS training_type text CHECK (training_type IN ('OT','PT','KT','GT')),
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- progress_tests
ALTER TABLE public.progress_tests
  ADD COLUMN IF NOT EXISTS run_5k_seconds numeric;

-- codex_entries
ALTER TABLE public.codex_entries
  ADD COLUMN IF NOT EXISTS sleep_score int CHECK (sleep_score BETWEEN 0 AND 7),
  ADD COLUMN IF NOT EXISTS water_litres numeric;
CREATE UNIQUE INDEX IF NOT EXISTS codex_entries_user_date_uniq
  ON public.codex_entries (user_id, entry_date);

-- book_log
ALTER TABLE public.book_log
  ADD COLUMN IF NOT EXISTS one_liner text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS public_url text;

-- achievement_attempts
ALTER TABLE public.achievement_attempts
  ADD COLUMN IF NOT EXISTS story text;

-- activities
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  location text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY activities_select ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY activities_insert ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY activities_update_own ON public.activities FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY activities_delete_own ON public.activities FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));

-- feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  screen text NOT NULL,
  message text NOT NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY feedback_insert_own ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY feedback_select_own_or_admin ON public.feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

-- achievement_comments
CREATE TABLE IF NOT EXISTS public.achievement_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.achievement_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY acom_select ON public.achievement_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY acom_insert ON public.achievement_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY acom_delete ON public.achievement_comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- kids_stars
CREATE TABLE IF NOT EXISTS public.kids_stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  star_type text NOT NULL CHECK (star_type IN ('gold','silver','blue')),
  reason text,
  awarded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kids_stars ENABLE ROW LEVEL SECURITY;
CREATE POLICY kids_select ON public.kids_stars FOR SELECT TO authenticated USING (true);
CREATE POLICY kids_admin ON public.kids_stars FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_select_own ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notif_update_own ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Notification fan-out triggers
CREATE OR REPLACE FUNCTION public.notify_all_event() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  SELECT p.id, 'event', 'New event: ' || NEW.title, COALESCE(NEW.description,''), '/app/community'
  FROM public.profiles p WHERE p.id <> COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_event ON public.events;
CREATE TRIGGER trg_notify_event AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_all_event();

CREATE OR REPLACE FUNCTION public.notify_all_activity() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  SELECT p.id, 'activity', 'New activity: ' || NEW.title, COALESCE(NEW.description,''), '/app/community'
  FROM public.profiles p WHERE p.id <> NEW.created_by;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_activity ON public.activities;
CREATE TRIGGER trg_notify_activity AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.notify_all_activity();

CREATE OR REPLACE FUNCTION public.notify_rsvp() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE evt_title text; evt_creator uuid;
BEGIN
  SELECT title, created_by INTO evt_title, evt_creator FROM public.events WHERE id = NEW.event_id;
  IF evt_creator IS NOT NULL AND evt_creator <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (evt_creator, 'rsvp', 'New RSVP for ' || evt_title, 'A member just RSVPed.', '/app/community');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_rsvp ON public.event_rsvps;
CREATE TRIGGER trg_notify_rsvp AFTER INSERT ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.notify_rsvp();

-- Storage bucket for progress imports
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-imports','progress-imports', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "progress imports public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'progress-imports');
CREATE POLICY "progress imports own write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'progress-imports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "progress imports own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'progress-imports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "progress imports own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'progress-imports' AND auth.uid()::text = (storage.foldername(name))[1]);
