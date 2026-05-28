
-- 1. Reset all existing auth users to shared password + confirm email
UPDATE auth.users
SET 
  encrypted_password = crypt('Welcome@123', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now();

-- 2. Create auth accounts for trainers as mentors (use trainer_ prefix to avoid username clash)
DO $$
DECLARE
  t RECORD;
  new_uid uuid;
  trainer_email text;
  trainer_username text;
BEGIN
  FOR t IN SELECT id, name FROM public.trainers LOOP
    trainer_username := 'trainer_' || lower(regexp_replace(t.name, '[^a-zA-Z0-9]', '', 'g'));
    trainer_email := trainer_username || '@hfc.demo';

    IF EXISTS (SELECT 1 FROM auth.users WHERE email = trainer_email) THEN
      CONTINUE;
    END IF;

    new_uid := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated',
      trainer_email, crypt('Welcome@123', gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers', ARRAY['email']),
      jsonb_build_object('username', trainer_username, 'full_name', t.name),
      now(), now(), '', '', '', ''
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_uid, 'mentor')
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END $$;
