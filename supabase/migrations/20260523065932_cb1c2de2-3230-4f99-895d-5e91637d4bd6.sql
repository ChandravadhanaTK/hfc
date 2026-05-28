
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'mentor');
CREATE TYPE public.team_name AS ENUM ('OT', 'PT', 'PF', 'GT');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  team team_name,
  birthday DATE,
  social_handle TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  past_injuries TEXT,
  medications TEXT,
  sleep_hours NUMERIC,
  eating_habits TEXT,
  hydration_liters NUMERIC,
  allergies TEXT,
  diet TEXT,
  activity_level TEXT,
  fitness_experience TEXT,
  fitness_goals TEXT,
  mentor_id UUID REFERENCES auth.users(id),
  referral_code TEXT UNIQUE DEFAULT substr(md5(random()::text),1,8),
  referred_by UUID REFERENCES auth.users(id),
  credits INTEGER NOT NULL DEFAULT 0,
  current_book TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

-- Trigger to create profile + default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name','')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Codex daily entries (8 principles)
CREATE TABLE public.codex_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  movement BOOLEAN DEFAULT FALSE,
  nutrition BOOLEAN DEFAULT FALSE,
  sleep BOOLEAN DEFAULT FALSE,
  hydration BOOLEAN DEFAULT FALSE,
  mindfulness BOOLEAN DEFAULT FALSE,
  learning BOOLEAN DEFAULT FALSE,
  connection BOOLEAN DEFAULT FALSE,
  gratitude BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

-- Progress tracker
CREATE TABLE public.progress_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pushups INTEGER,
  pullups INTEGER,
  run_100m_seconds NUMERIC,
  plank_seconds INTEGER,
  squats INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type TEXT,
  location TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- Achievements
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  standard TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.achievement_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_date DATE NOT NULL DEFAULT CURRENT_DATE,
  present BOOLEAN NOT NULL DEFAULT TRUE,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_date)
);

-- Gallery
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  category TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Book reading log
CREATE TABLE public.book_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reading',
  finished_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Health logs (BMI/BMR + blood reports)
CREATE TABLE public.health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mentor chat
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room TEXT NOT NULL DEFAULT 'mentors',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TTV reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Testimonials
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_type TEXT,
  content TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  credits_applied INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  training_type TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone authenticated can view; users edit own; admins edit all
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()=id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_roles: user sees own; admin manages all
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Codex: users manage own; everyone can see (for leaderboard)
CREATE POLICY "codex_select_all" ON public.codex_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "codex_own_insert" ON public.codex_entries FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "codex_own_update" ON public.codex_entries FOR UPDATE TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "codex_own_delete" ON public.codex_entries FOR DELETE TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));

-- Progress
CREATE POLICY "progress_select_all" ON public.progress_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "progress_own_insert" ON public.progress_tests FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "progress_own_update" ON public.progress_tests FOR UPDATE TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "progress_own_delete" ON public.progress_tests FOR DELETE TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));

-- Events
CREATE POLICY "events_select" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid()=created_by);
CREATE POLICY "events_admin" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "rsvps_select" ON public.event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "rsvps_own" ON public.event_rsvps FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Achievements
CREATE POLICY "ach_select" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "ach_insert" ON public.achievements FOR INSERT TO authenticated WITH CHECK (auth.uid()=created_by);
CREATE POLICY "ach_admin" ON public.achievements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "att_select" ON public.achievement_attempts FOR SELECT TO authenticated USING (true);
CREATE POLICY "att_own" ON public.achievement_attempts FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Attendance: users see own; mentors/admins manage
CREATE POLICY "att_select_own_or_admin" ON public.attendance FOR SELECT TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));
CREATE POLICY "att_manage_admin" ON public.attendance FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor'));

-- Gallery
CREATE POLICY "gallery_select" ON public.gallery FOR SELECT TO authenticated USING (true);
CREATE POLICY "gallery_insert" ON public.gallery FOR INSERT TO authenticated WITH CHECK (auth.uid()=uploaded_by);
CREATE POLICY "gallery_admin" ON public.gallery FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Books
CREATE POLICY "books_select" ON public.book_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "books_own" ON public.book_log FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Health (private)
CREATE POLICY "health_own" ON public.health_logs FOR ALL TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- Chat
CREATE POLICY "chat_select" ON public.chat_messages FOR SELECT TO authenticated USING (
  sender_id=auth.uid() OR recipient_id=auth.uid() OR recipient_id IS NULL
);
CREATE POLICY "chat_insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid()=sender_id);

-- Reviews
CREATE POLICY "reviews_select_self_admin" ON public.reviews FOR SELECT TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reviews_own_insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);

-- Testimonials: public read approved; admin all
CREATE POLICY "testimonials_select_approved" ON public.testimonials FOR SELECT TO authenticated USING (approved OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "testimonials_admin" ON public.testimonials FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Payments
CREATE POLICY "pay_select_own_admin" ON public.payments FOR SELECT TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "pay_own_insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "pay_admin" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Inventory: admin/mentor
CREATE POLICY "inv_select" ON public.inventory FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor') OR assigned_to=auth.uid());
CREATE POLICY "inv_admin" ON public.inventory FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
