
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  tier text NOT NULL DEFAULT 'bronze',
  threshold integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY badges_select ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY badges_admin ON public.badges FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  awarded_by uuid,
  UNIQUE (user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY ub_select ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY ub_insert_own ON public.user_badges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY ub_admin ON public.user_badges FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.badges (code, name, description, icon, tier, threshold) VALUES
  ('first_unlock','First Standard','Unlocked your first achievement','trophy','bronze',1),
  ('five_unlocks','Rising Standard','Unlocked five achievements','medal','silver',5),
  ('ten_unlocks','Standard Bearer','Unlocked ten achievements','award','gold',10)
ON CONFLICT (code) DO NOTHING;
