
CREATE TABLE public.class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  class_date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_sessions TO authenticated;
GRANT ALL ON public.class_sessions TO service_role;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY cs_select ON public.class_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY cs_manage ON public.class_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

CREATE TABLE public.class_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_attendees TO authenticated;
GRANT ALL ON public.class_attendees TO service_role;
ALTER TABLE public.class_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY ca_select ON public.class_attendees FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));
CREATE POLICY ca_manage ON public.class_attendees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

CREATE INDEX idx_cs_group_date ON public.class_sessions(group_id, class_date DESC);
CREATE INDEX idx_ca_user ON public.class_attendees(user_id);
CREATE INDEX idx_ca_session ON public.class_attendees(session_id);
