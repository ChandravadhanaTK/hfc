CREATE TABLE public.kids_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  punctual boolean NOT NULL DEFAULT false,
  exercise_rating integer,
  water_litres numeric,
  wake_time time,
  sleep_time time,
  slept_8h boolean NOT NULL DEFAULT false,
  made_bed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

ALTER TABLE public.kids_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kids_daily_select_own_or_staff" ON public.kids_daily
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

CREATE POLICY "kids_daily_insert_own" ON public.kids_daily
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kids_daily_update_own" ON public.kids_daily
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "kids_daily_delete_own_or_admin" ON public.kids_daily
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER kids_daily_set_updated_at
  BEFORE UPDATE ON public.kids_daily
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();