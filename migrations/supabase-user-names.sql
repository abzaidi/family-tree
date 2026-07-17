-- =============================================================================
-- User Names
-- =============================================================================
-- Run this once in the Supabase SQL Editor for existing projects.
-- Names are stored in auth.users.raw_user_meta_data under "full_name".
-- =============================================================================

-- Backfill the existing account requested by the project owner.
UPDATE auth.users
SET raw_user_meta_data =
  COALESCE(raw_user_meta_data, '{}'::JSONB)
  || JSONB_BUILD_OBJECT('full_name', 'Abubakar Zaidi')
WHERE LOWER(email) = LOWER('ma2003110@gmail.com');

-- PostgreSQL cannot change a function's return columns with CREATE OR REPLACE.
DROP FUNCTION IF EXISTS public.list_app_users();

-- List all signed-up users, including their signup name (admin only).
CREATE FUNCTION public.list_app_users()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  role public.user_role_type
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    NULLIF(BTRIM(u.raw_user_meta_data ->> 'full_name'), '') AS name,
    u.email::TEXT,
    u.created_at,
    COALESCE(ur.role, 'viewer'::public.user_role_type) AS role
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  ORDER BY u.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_app_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_app_users() TO authenticated;
