-- =============================================================================
-- Insert a missing generation between a direct parent and child
-- =============================================================================
-- Run this once in the Supabase SQL Editor for existing projects.
-- Prefer migrations/supabase-person-profile-fields.sql on upgraded databases:
-- that migration already includes this RPC with profile/private fields.
-- The entire relationship rewrite happens in one transaction.
-- =============================================================================

DROP FUNCTION IF EXISTS public.insert_person_in_middle(
  UUID, UUID, TEXT, TEXT, public.gender_type, INTEGER, INTEGER, TEXT
);

CREATE OR REPLACE FUNCTION public.insert_person_in_middle(
  selected_parent_id UUID,
  selected_child_id UUID,
  new_english_name TEXT,
  new_urdu_name TEXT,
  new_gender public.gender_type,
  new_birth_year INTEGER DEFAULT NULL,
  new_death_year INTEGER DEFAULT NULL,
  new_notes TEXT DEFAULT NULL,
  new_country_iso_code TEXT DEFAULT NULL,
  new_country_name TEXT DEFAULT NULL,
  new_state_province_code TEXT DEFAULT NULL,
  new_state_province TEXT DEFAULT NULL,
  new_city_name TEXT DEFAULT NULL,
  new_phone_country_code TEXT DEFAULT NULL,
  new_national_identity_number TEXT DEFAULT NULL
)
RETURNS public.persons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  original_link public.union_children%ROWTYPE;
  inserted_person public.persons%ROWTYPE;
  inserted_parent_union public.unions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_edit(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF selected_parent_id IS NULL OR selected_child_id IS NULL THEN
    RAISE EXCEPTION 'Parent and child are required';
  END IF;

  IF selected_parent_id = selected_child_id THEN
    RAISE EXCEPTION 'Parent and child cannot be the same person';
  END IF;

  IF COALESCE(BTRIM(new_english_name), '') = ''
     AND COALESCE(BTRIM(new_urdu_name), '') = '' THEN
    RAISE EXCEPTION 'At least one name is required';
  END IF;

  IF new_birth_year IS NOT NULL
     AND new_death_year IS NOT NULL
     AND new_death_year < new_birth_year THEN
    RAISE EXCEPTION 'Death year cannot be before birth year';
  END IF;

  -- A direct child has exactly one parent-union link. Lock it so two edits
  -- cannot rewrite the same relationship concurrently.
  SELECT uc.*
  INTO original_link
  FROM public.union_children uc
  JOIN public.unions u ON u.id = uc.union_id
  JOIN public.persons parent_person ON parent_person.id = selected_parent_id
  JOIN public.persons child_person ON child_person.id = selected_child_id
  WHERE uc.child_id = selected_child_id
    AND (
      u.partner1_id = selected_parent_id
      OR u.partner2_id = selected_parent_id
    )
    AND parent_person.deleted = false
    AND child_person.deleted = false
  FOR UPDATE OF uc;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected child is not a direct child of the selected parent';
  END IF;

  INSERT INTO public.persons (
    english_name,
    urdu_name,
    gender,
    birth_year,
    death_year,
    notes,
    country_iso_code,
    country_name,
    state_province_code,
    state_province,
    city_name,
    phone_country_code
  )
  VALUES (
    COALESCE(BTRIM(new_english_name), ''),
    COALESCE(BTRIM(new_urdu_name), ''),
    new_gender,
    new_birth_year,
    new_death_year,
    NULLIF(BTRIM(new_notes), ''),
    NULLIF(BTRIM(new_country_iso_code), ''),
    NULLIF(BTRIM(new_country_name), ''),
    NULLIF(BTRIM(new_state_province_code), ''),
    NULLIF(BTRIM(new_state_province), ''),
    NULLIF(BTRIM(new_city_name), ''),
    NULLIF(BTRIM(new_phone_country_code), '')
  )
  RETURNING * INTO inserted_person;

  IF NULLIF(BTRIM(new_national_identity_number), '') IS NOT NULL THEN
    INSERT INTO public.person_private_details (
      person_id,
      national_identity_number
    )
    VALUES (
      inserted_person.id,
      BTRIM(new_national_identity_number)
    );
  END IF;

  -- The selected child now belongs to a new single-parent union headed by the
  -- inserted person. Existing spouse/child unions of that child are untouched.
  INSERT INTO public.unions (partner1_id, partner2_id)
  VALUES (inserted_person.id, NULL)
  RETURNING * INTO inserted_parent_union;

  UPDATE public.union_children
  SET union_id = inserted_parent_union.id
  WHERE id = original_link.id;

  -- The inserted person takes the selected child's former place in the exact
  -- same parent union, preserving the other parent and all siblings.
  INSERT INTO public.union_children (union_id, child_id)
  VALUES (original_link.union_id, inserted_person.id);

  RETURN inserted_person;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_person_in_middle(
  UUID, UUID, TEXT, TEXT, public.gender_type, INTEGER, INTEGER, TEXT,
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.insert_person_in_middle(
  UUID, UUID, TEXT, TEXT, public.gender_type, INTEGER, INTEGER, TEXT,
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;
