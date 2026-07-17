-- =============================================================================
-- Normalize national identity numbers to digits-only storage
-- =============================================================================
-- Run this once in the Supabase SQL Editor for existing projects.
-- Fresh installs that used the current supabase-schema.sql already include this.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.normalize_national_identity_number(raw TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits TEXT;
BEGIN
  IF raw IS NULL THEN
    RETURN NULL;
  END IF;
  digits := regexp_replace(raw, '[^0-9]', '', 'g');
  RETURN NULLIF(digits, '');
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_person_private_details_national_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.national_identity_number :=
    public.normalize_national_identity_number(NEW.national_identity_number);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_national_id_person_private_details
  ON public.person_private_details;

CREATE TRIGGER normalize_national_id_person_private_details
  BEFORE INSERT OR UPDATE OF national_identity_number
  ON public.person_private_details
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_person_private_details_national_id();

-- Backfill existing values (and remove empty leftover rows)
UPDATE public.person_private_details
SET national_identity_number =
  public.normalize_national_identity_number(national_identity_number)
WHERE national_identity_number IS NOT NULL;

DELETE FROM public.person_private_details
WHERE national_identity_number IS NULL;

-- Keep middle-insert RPC in sync: pass raw value; trigger normalizes on insert.
-- Replacing the insert body is unnecessary when the trigger is present, but
-- we still normalize explicitly so SECURITY DEFINER inserts stay consistent
-- even if trigger order changes.
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
  normalized_nic TEXT;
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

  normalized_nic := public.normalize_national_identity_number(
    new_national_identity_number
  );

  IF normalized_nic IS NOT NULL THEN
    INSERT INTO public.person_private_details (
      person_id,
      national_identity_number
    )
    VALUES (
      inserted_person.id,
      normalized_nic
    );
  END IF;

  INSERT INTO public.unions (partner1_id, partner2_id)
  VALUES (inserted_person.id, NULL)
  RETURNING * INTO inserted_parent_union;

  UPDATE public.union_children
  SET union_id = inserted_parent_union.id
  WHERE id = original_link.id;

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
