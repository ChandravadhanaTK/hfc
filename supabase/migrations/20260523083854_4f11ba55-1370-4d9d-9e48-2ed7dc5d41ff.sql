
DO $$
DECLARE
  ajay_id uuid := gen_random_uuid();
  johnson_id uuid := gen_random_uuid();
BEGIN
  -- ajay@hfc.demo (admin)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ajay@hfc.demo') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', ajay_id, 'authenticated', 'authenticated',
      'ajay@hfc.demo', crypt('Demo1234!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username','ajay','full_name','Ajay Victor'),
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ajay_id, jsonb_build_object('sub', ajay_id::text, 'email','ajay@hfc.demo'), 'email', ajay_id::text, now(), now(), now());
    INSERT INTO public.user_roles (user_id, role) VALUES (ajay_id, 'admin') ON CONFLICT DO NOTHING;
  END IF;

  -- johnson@hfc.demo (mentor, OT)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'johnson@hfc.demo') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', johnson_id, 'authenticated', 'authenticated',
      'johnson@hfc.demo', crypt('Demo1234!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username','johnson','full_name','Johnson'),
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), johnson_id, jsonb_build_object('sub', johnson_id::text, 'email','johnson@hfc.demo'), 'email', johnson_id::text, now(), now(), now());
    INSERT INTO public.user_roles (user_id, role) VALUES (johnson_id, 'mentor') ON CONFLICT DO NOTHING;
    UPDATE public.profiles SET team = 'OT' WHERE id = johnson_id;
  END IF;
END $$;
