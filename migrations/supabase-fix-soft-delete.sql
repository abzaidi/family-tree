-- =============================================================================
-- Fix: soft delete fails with "new row violates row-level security policy"
-- =============================================================================
-- The app soft-deletes by setting persons.deleted = true. The SELECT policy
-- only allowed rows with deleted = false, so the updated row became invisible
-- to the editor performing the update and PostgREST rejected the write (42501).
-- Editors/admins may now also see deleted rows; anon and viewers still see
-- only non-deleted persons. The app already filters deleted rows in its UI.
-- Run this once in the Supabase SQL Editor.
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can view non-deleted persons" ON persons;
CREATE POLICY "Anyone can view non-deleted persons"
  ON persons FOR SELECT
  TO anon, authenticated
  USING (deleted = false OR can_edit(auth.uid()));
