-- =============================================================================
-- Delete only one person while preserving descendants
-- =============================================================================
-- Run once in the Supabase SQL Editor for existing projects.
-- mode:
--   'lineage' — reassign this person's direct children to their grandparents,
--               remove their unions/spouses, then soft-delete them
--   'spouse'  — keep shared children with the surviving partner, remove this
--               person from unions, then soft-delete them
-- Root person cannot be deleted with this function.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_person_only(
  target_person_id UUID,
  delete_mode TEXT DEFAULT 'spouse'
)
RETURNS public.persons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_person public.persons%ROWTYPE;
  root_value TEXT;
  incoming_link public.union_children%ROWTYPE;
  union_row public.unions%ROWTYPE;
  surviving_partner_id UUID;
  child_count INTEGER;
  has_direct_children BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_edit(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF target_person_id IS NULL THEN
    RAISE EXCEPTION 'Person is required';
  END IF;

  IF delete_mode IS NULL OR delete_mode NOT IN ('lineage', 'spouse') THEN
    RAISE EXCEPTION 'Invalid delete mode';
  END IF;

  SELECT *
  INTO target_person
  FROM public.persons
  WHERE id = target_person_id
  FOR UPDATE;

  IF NOT FOUND OR target_person.deleted THEN
    RAISE EXCEPTION 'Person not found';
  END IF;

  SELECT value
  INTO root_value
  FROM public.app_config
  WHERE key = 'root_person_id'
  FOR UPDATE;

  IF root_value IS NOT NULL AND root_value::UUID = target_person_id THEN
    RAISE EXCEPTION 'The root person cannot be deleted alone';
  END IF;

  SELECT *
  INTO incoming_link
  FROM public.union_children
  WHERE child_id = target_person_id
  FOR UPDATE;

  SELECT EXISTS (
    SELECT 1
    FROM public.unions u
    JOIN public.union_children uc ON uc.union_id = u.id
    JOIN public.persons child ON child.id = uc.child_id
    WHERE (u.partner1_id = target_person_id OR u.partner2_id = target_person_id)
      AND child.deleted = false
  )
  INTO has_direct_children;

  IF delete_mode = 'lineage' AND has_direct_children AND incoming_link.id IS NULL THEN
    RAISE EXCEPTION 'Cannot reassign children because this person has no parents';
  END IF;

  -- Process every union that includes the target person
  FOR union_row IN
    SELECT *
    FROM public.unions
    WHERE partner1_id = target_person_id OR partner2_id = target_person_id
    ORDER BY id
    FOR UPDATE
  LOOP
    SELECT COUNT(*)
    INTO child_count
    FROM public.union_children uc
    JOIN public.persons child ON child.id = uc.child_id
    WHERE uc.union_id = union_row.id
      AND child.deleted = false;

    IF delete_mode = 'lineage' THEN
      IF child_count > 0 THEN
        -- Move this generation under the target's parents; siblings stay put.
        UPDATE public.union_children
        SET union_id = incoming_link.union_id
        WHERE union_id = union_row.id;
      END IF;

      DELETE FROM public.unions WHERE id = union_row.id;
    ELSE
      -- Spouse / leaf mode: keep shared children with the other partner.
      IF union_row.partner1_id = target_person_id THEN
        surviving_partner_id := union_row.partner2_id;
      ELSE
        surviving_partner_id := union_row.partner1_id;
      END IF;

      IF surviving_partner_id IS NOT NULL
         AND EXISTS (
           SELECT 1
           FROM public.persons p
           WHERE p.id = surviving_partner_id
             AND p.deleted = false
         ) THEN
        IF union_row.partner1_id = target_person_id THEN
          UPDATE public.unions
          SET partner1_id = surviving_partner_id,
              partner2_id = NULL
          WHERE id = union_row.id;
        ELSE
          UPDATE public.unions
          SET partner2_id = NULL
          WHERE id = union_row.id;
        END IF;
      ELSIF child_count > 0 THEN
        IF incoming_link.id IS NULL THEN
          RAISE EXCEPTION 'Cannot delete person: children have no surviving parent or grandparents';
        END IF;

        UPDATE public.union_children
        SET union_id = incoming_link.union_id
        WHERE union_id = union_row.id;

        DELETE FROM public.unions WHERE id = union_row.id;
      ELSE
        DELETE FROM public.unions WHERE id = union_row.id;
      END IF;
    END IF;
  END LOOP;

  -- Detach the target from their own parents after children were reassigned.
  DELETE FROM public.union_children
  WHERE child_id = target_person_id;

  UPDATE public.persons
  SET deleted = true,
      updated_at = now()
  WHERE id = target_person_id
  RETURNING * INTO target_person;

  RETURN target_person;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_person_only(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_person_only(UUID, TEXT) TO authenticated;
