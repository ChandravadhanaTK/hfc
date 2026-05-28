
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  metric text,
  target_value numeric,
  target_unit text,
  source text NOT NULL DEFAULT 'user',
  created_by uuid NOT NULL,
  deadline date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY ch_select ON public.challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY ch_insert ON public.challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY ch_update_own ON public.challenges FOR UPDATE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY ch_delete_own ON public.challenges FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  value numeric,
  proof text,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);
ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY cc_select ON public.challenge_completions FOR SELECT TO authenticated USING (true);
CREATE POLICY cc_insert ON public.challenge_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY cc_delete_own ON public.challenge_completions FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.badges (code, name, description, icon, tier, threshold) VALUES
  ('first_challenge','Challenger','Completed your first challenge','target','bronze',NULL),
  ('five_challenges','Challenge Hunter','Completed five challenges','target','silver',NULL),
  ('ten_challenges','Challenge Master','Completed ten challenges','target','gold',NULL)
ON CONFLICT (code) DO NOTHING;
