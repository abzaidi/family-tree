-- =============================================================================
-- Person profile fields, serial numbers, and private identity details
-- =============================================================================
-- Run this once in the Supabase SQL Editor for existing projects.
-- Fresh installs that used the current supabase-schema.sql already include these.
-- =============================================================================

-- Public profile columns on persons
ALTER TABLE public.persons
  ADD COLUMN IF NOT EXISTS serial_number BIGINT,
  ADD COLUMN IF NOT EXISTS country_iso_code TEXT,
  ADD COLUMN IF NOT EXISTS country_name TEXT,
  ADD COLUMN IF NOT EXISTS state_province_code TEXT,
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS city_name TEXT,
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT;

-- Sequence-backed serial numbers (not MAX+1) for concurrent safety
CREATE SEQUENCE IF NOT EXISTS public.persons_serial_number_seq;

-- Backfill without noisy audit/updated_at churn
ALTER TABLE public.persons DISABLE TRIGGER set_updated_at_persons;
ALTER TABLE public.persons DISABLE TRIGGER audit_persons;

WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM public.persons
  WHERE serial_number IS NULL
),
baseline AS (
  SELECT COALESCE(MAX(serial_number), 0) AS max_serial
  FROM public.persons
)
UPDATE public.persons p
SET serial_number = baseline.max_serial + ordered.rn
FROM ordered, baseline
WHERE p.id = ordered.id;

-- setval(max) means the next nextval() returns max+1 (including empty → 1)
SELECT setval(
  'public.persons_serial_number_seq',
  COALESCE((SELECT MAX(serial_number) FROM public.persons), 0)
);

ALTER TABLE public.persons ENABLE TRIGGER set_updated_at_persons;
ALTER TABLE public.persons ENABLE TRIGGER audit_persons;

ALTER TABLE public.persons
  ALTER COLUMN serial_number SET DEFAULT nextval('public.persons_serial_number_seq');

ALTER TABLE public.persons
  ALTER COLUMN serial_number SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'persons_serial_number_key'
      AND conrelid = 'public.persons'::regclass
  ) THEN
    ALTER TABLE public.persons
      ADD CONSTRAINT persons_serial_number_key UNIQUE (serial_number);
  END IF;
END $$;

ALTER SEQUENCE public.persons_serial_number_seq OWNED BY public.persons.serial_number;

-- Editor-only private identity details (id kept for shared audit trigger)
CREATE TABLE IF NOT EXISTS public.person_private_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL UNIQUE REFERENCES public.persons(id) ON DELETE CASCADE,
  national_identity_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_persons_serial_number ON public.persons(serial_number);
CREATE INDEX IF NOT EXISTS idx_persons_country_iso_code ON public.persons(country_iso_code);
CREATE INDEX IF NOT EXISTS idx_persons_state_province ON public.persons(state_province);
CREATE INDEX IF NOT EXISTS idx_persons_city_name ON public.persons(city_name);
CREATE INDEX IF NOT EXISTS idx_person_private_details_nic
  ON public.person_private_details(national_identity_number);

DROP TRIGGER IF EXISTS set_updated_at_person_private_details ON public.person_private_details;
CREATE TRIGGER set_updated_at_person_private_details
  BEFORE UPDATE ON public.person_private_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS audit_person_private_details ON public.person_private_details;
CREATE TRIGGER audit_person_private_details
  AFTER INSERT OR UPDATE OR DELETE ON public.person_private_details
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit();

ALTER TABLE public.person_private_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Editors and admins can view private details"
  ON public.person_private_details;
CREATE POLICY "Editors and admins can view private details"
  ON public.person_private_details FOR SELECT
  TO authenticated
  USING (public.can_edit(auth.uid()));

DROP POLICY IF EXISTS "Editors and admins can insert private details"
  ON public.person_private_details;
CREATE POLICY "Editors and admins can insert private details"
  ON public.person_private_details FOR INSERT
  TO authenticated
  WITH CHECK (public.can_edit(auth.uid()));

DROP POLICY IF EXISTS "Editors and admins can update private details"
  ON public.person_private_details;
CREATE POLICY "Editors and admins can update private details"
  ON public.person_private_details FOR UPDATE
  TO authenticated
  USING (public.can_edit(auth.uid()))
  WITH CHECK (public.can_edit(auth.uid()));

DROP POLICY IF EXISTS "Editors and admins can delete private details"
  ON public.person_private_details;
CREATE POLICY "Editors and admins can delete private details"
  ON public.person_private_details FOR DELETE
  TO authenticated
  USING (public.can_edit(auth.uid()));

-- Replace middle-insert RPC so profile/private fields persist atomically
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

  -- Digits-only normalization is enforced by the private-details trigger once
  -- migrations/supabase-normalize-national-id.sql has been applied.
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
