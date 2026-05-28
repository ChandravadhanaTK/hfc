-- Make the view respect caller's RLS
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Add a second permissive SELECT policy on profiles; column-level grants restrict which columns non-owners can read
CREATE POLICY profiles_select_public_cols ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Lock down direct column access: revoke broad SELECT, regrant only safe columns to authenticated
REVOKE SELECT ON public.profiles FROM authenticated, anon;
GRANT SELECT (id, username, full_name, team, avatar_url, current_book) ON public.profiles TO authenticated;

-- Owner / admin / mentor read all columns via SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.get_full_profile(_id uuid)
RETURNS SETOF public.profiles
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() = _id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mentor') THEN
    RETURN QUERY SELECT * FROM public.profiles WHERE id = _id;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_full_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_full_profile(uuid) TO authenticated;

-- Admin list view via RPC
CREATE OR REPLACE FUNCTION public.list_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mentor') THEN
    RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.list_all_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_all_profiles() TO authenticated;