-- =============================================================================
-- Fix: audit trigger fails on UPDATE of tables without a "deleted" column
-- =============================================================================
-- log_audit() referenced OLD.deleted for every UPDATE, but only "persons" has
-- that column. Updating "unions" (e.g. linking a spouse to a single-parent
-- union) raised: record "old" has no field "deleted".
-- Run this once in the Supabase SQL Editor.
-- =============================================================================

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
    action_type := 'update';
    -- Only "persons" has a "deleted" column; guard the field access so
    -- updates on other audited tables (unions, union_children) don't fail.
    IF TG_TABLE_NAME = 'persons' THEN
      IF OLD.deleted = false AND NEW.deleted = true THEN
        action_type := 'delete';
      ELSIF OLD.deleted = true AND NEW.deleted = false THEN
        action_type := 'restore';
      END IF;
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
