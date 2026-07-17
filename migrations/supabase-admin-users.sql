-- =============================================================================
-- Admin Users Management
-- =============================================================================
-- Run this in the Supabase SQL Editor for existing projects.
-- Fresh installs already get these definitions from supabase-schema.sql.
-- =============================================================================

-- Backfill viewer roles for any existing auth users that lack a row
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'viewer'::public.user_role_type
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Auto-provision a viewer role whenever a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- List all signed-up users (admin only)
-- Drop first because PostgreSQL cannot replace a function with changed columns.
DROP FUNCTION IF EXISTS public.list_app_users();
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

-- Change a user's role (admin only; cannot demote the last admin)
CREATE OR REPLACE FUNCTION public.set_app_user_role(
  target_user_id UUID,
  new_role public.user_role_type
)
RETURNS public.user_role_type
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_role public.user_role_type;
  admin_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF target_user_id IS NULL OR new_role IS NULL THEN
    RAISE EXCEPTION 'Invalid arguments';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  SELECT ur.role INTO existing_role
  FROM public.user_roles ur
  WHERE ur.user_id = target_user_id;

  existing_role := COALESCE(existing_role, 'viewer'::public.user_role_type);

  IF existing_role = 'admin' AND new_role <> 'admin' THEN
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';

    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last admin';
    END IF;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role;

  RETURN new_role;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_app_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_app_user_role(UUID, public.user_role_type) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_app_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_app_user_role(UUID, public.user_role_type) TO authenticated;
