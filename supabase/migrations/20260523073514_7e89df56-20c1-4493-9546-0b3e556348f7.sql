
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_sessions_user_started ON public.user_sessions(user_id, started_at DESC);
CREATE INDEX idx_user_sessions_started ON public.user_sessions(started_at DESC);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sess_own_insert ON public.user_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY sess_own_update ON public.user_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY sess_select_self_or_admin ON public.user_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

CREATE TABLE public.feature_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID,
  screen TEXT NOT NULL,
  feature TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_feature_events_screen ON public.feature_events(screen);
CREATE INDEX idx_feature_events_feature ON public.feature_events(feature);
CREATE INDEX idx_feature_events_occurred ON public.feature_events(occurred_at DESC);
CREATE INDEX idx_feature_events_user ON public.feature_events(user_id);

ALTER TABLE public.feature_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY fe_own_insert ON public.feature_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY fe_select_admin ON public.feature_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));
