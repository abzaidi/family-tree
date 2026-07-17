-- =============================================================================
-- Family Tree Application - Complete Supabase SQL Schema
-- =============================================================================
-- Run this script in the Supabase SQL Editor to set up all tables,
-- constraints, indexes, RLS policies, triggers, and helper functions.
-- =============================================================================

-- ========================
-- 1. ENUMS
-- ========================

CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE user_role_type AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE audit_action_type AS ENUM ('create', 'update', 'delete', 'restore');

-- ========================
-- 2. TABLES
-- ========================

-- Persons table
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  english_name TEXT NOT NULL DEFAULT '',
  urdu_name TEXT NOT NULL DEFAULT '',
  gender gender_type NOT NULL DEFAULT 'male',
  birth_year INTEGER,
  death_year INTEGER,
  notes TEXT,
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_name_required CHECK (english_name != '' OR urdu_name != ''),
  CONSTRAINT check_valid_years CHECK (
    (birth_year IS NULL OR death_year IS NULL) OR (death_year >= birth_year)
  )
);

-- Unions (marriages/partnerships)
CREATE TABLE unions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner1_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  partner2_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  marriage_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_different_partners CHECK (partner1_id != partner2_id)
);

-- Union children (linking children to specific unions)
CREATE TABLE union_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  union_id UUID NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_union_child UNIQUE (union_id, child_id),
  CONSTRAINT unique_child_parents UNIQUE (child_id)  -- Each child has exactly one parent union
);

-- User roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_role UNIQUE (user_id)
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action audit_action_type NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- App configuration (for root_person_id etc.)
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- 3. INDEXES
-- ========================

-- Enable trigram extension for fuzzy search (must be before trgm indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_persons_deleted ON persons(deleted);
CREATE INDEX idx_persons_english_name ON persons(english_name);
CREATE INDEX idx_persons_urdu_name ON persons(urdu_name);
CREATE INDEX idx_persons_english_name_trgm ON persons USING gin (english_name gin_trgm_ops);
CREATE INDEX idx_persons_urdu_name_trgm ON persons USING gin (urdu_name gin_trgm_ops);

CREATE INDEX idx_unions_partner1 ON unions(partner1_id);
CREATE INDEX idx_unions_partner2 ON unions(partner2_id);

CREATE INDEX idx_union_children_union ON union_children(union_id);
CREATE INDEX idx_union_children_child ON union_children(child_id);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ========================
-- 4. HELPER FUNCTIONS
-- ========================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit log function
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
  action_type audit_action_type;
  old_data JSONB;
  new_data JSONB;
  record_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    old_data := NULL;
    new_data := to_jsonb(NEW);
    record_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if this is a soft delete
    IF TG_TABLE_NAME = 'persons' AND OLD.deleted = false AND NEW.deleted = true THEN
      action_type := 'delete';
    ELSIF TG_TABLE_NAME = 'persons' AND OLD.deleted = true AND NEW.deleted = false THEN
      action_type := 'restore';
    ELSE
      action_type := 'update';
    END IF;
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    record_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    old_data := to_jsonb(OLD);
    new_data := NULL;
    record_id := OLD.id;
  END IF;

  INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (auth.uid(), action_type, TG_TABLE_NAME, record_id, old_data, new_data);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user role helper
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role_type AS $$
DECLARE
  r user_role_type;
BEGIN
  SELECT role INTO r FROM user_roles WHERE user_id = uid;
  RETURN COALESCE(r, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can edit
CREATE OR REPLACE FUNCTION can_edit(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(uid) IN ('admin', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(uid) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================
-- 5. TRIGGERS
-- ========================

-- updated_at triggers
CREATE TRIGGER set_updated_at_persons
  BEFORE UPDATE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_unions
  BEFORE UPDATE ON unions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_app_config
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Audit log triggers
CREATE TRIGGER audit_persons
  AFTER INSERT OR UPDATE OR DELETE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_unions
  AFTER INSERT OR UPDATE OR DELETE ON unions
  FOR EACH ROW
  EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_union_children
  AFTER INSERT OR UPDATE OR DELETE ON union_children
  FOR EACH ROW
  EXECUTE FUNCTION log_audit();

-- ========================
-- 6. ROW LEVEL SECURITY
-- ========================

ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE unions ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Public read policies keep the tree viewable without an account.
-- Write policies below remain restricted to authenticated editors/admins.
-- PERSONS policies
CREATE POLICY "Anyone can view non-deleted persons"
  ON persons FOR SELECT
  TO anon, authenticated
  USING (deleted = false);

CREATE POLICY "Editors and admins can insert persons"
  ON persons FOR INSERT
  TO authenticated
  WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Editors and admins can update persons"
  ON persons FOR UPDATE
  TO authenticated
  USING (can_edit(auth.uid()))
  WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Admins can delete persons"
  ON persons FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- UNIONS policies
CREATE POLICY "Anyone can view unions"
  ON unions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Editors and admins can insert unions"
  ON unions FOR INSERT
  TO authenticated
  WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Editors and admins can update unions"
  ON unions FOR UPDATE
  TO authenticated
  USING (can_edit(auth.uid()))
  WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Admins can delete unions"
  ON unions FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- UNION_CHILDREN policies
CREATE POLICY "Anyone can view union_children"
  ON union_children FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Editors and admins can insert union_children"
  ON union_children FOR INSERT
  TO authenticated
  WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Editors and admins can update union_children"
  ON union_children FOR UPDATE
  TO authenticated
  USING (can_edit(auth.uid()))
  WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Admins can delete union_children"
  ON union_children FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- USER_ROLES policies
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- AUDIT_LOG policies
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Insert is done via trigger (SECURITY DEFINER), no direct policy needed for insert

-- APP_CONFIG policies
CREATE POLICY "Anyone can view config"
  ON app_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Editors and admins can manage config"
  ON app_config FOR INSERT
  TO authenticated
  WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Editors and admins can update config"
  ON app_config FOR UPDATE
  TO authenticated
  USING (can_edit(auth.uid()))
  WITH CHECK (can_edit(auth.uid()));

-- ========================
-- 8. ADMIN USER MANAGEMENT
-- ========================

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
CREATE OR REPLACE FUNCTION public.list_app_users()
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

-- ========================
-- 9. INITIAL DATA
-- ========================

-- Insert a default app config (root_person_id will be set by the app)
-- No default root person is inserted; the first person added can be set as root.

-- ========================
-- SETUP COMPLETE
-- ========================
-- After running this script:
-- 1. Create your first user via Supabase Auth
-- 2. Insert a role for that user:
--    INSERT INTO user_roles (user_id, role) VALUES ('your-user-id', 'admin');
-- 3. Start adding persons through the application
-- 4. Existing projects that already ran an older schema should also run
--    migrations/supabase-admin-users.sql once for admin user management.
