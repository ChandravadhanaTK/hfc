
CREATE TABLE public.calorie_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  meal_name text NOT NULL,
  calories numeric NOT NULL,
  photo_url text,
  notes text,
  eaten_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calorie_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cal_select" ON public.calorie_log FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'mentor'));
CREATE POLICY "cal_insert" ON public.calorie_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cal_delete" ON public.calorie_log FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

INSERT INTO storage.buckets (id, name, public) VALUES ('health-uploads','health-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "hu_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'health-uploads');
CREATE POLICY "hu_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'health-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "hu_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'health-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
