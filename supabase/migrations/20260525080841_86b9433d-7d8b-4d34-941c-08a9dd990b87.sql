
CREATE TABLE IF NOT EXISTS public.gallery_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY gg_select ON public.gallery_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY gg_admin ON public.gallery_groups FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.gallery_groups(id) ON DELETE SET NULL;

INSERT INTO public.gallery_groups (name, sort_order)
SELECT 'Brigade ' || lpad(g::text, 2, '0'), g FROM generate_series(1, 25) g
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.gallery_groups (name, sort_order) VALUES ('HFCs Fitness Mentors', 100)
ON CONFLICT (name) DO NOTHING;
