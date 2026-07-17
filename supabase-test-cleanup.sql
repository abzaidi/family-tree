-- =============================================================================
-- Zaidi Family Tree — Remove TEST Seed Data
-- =============================================================================
-- Run this in the Supabase SQL Editor after you finish testing.
--
-- It does two things, in one transaction:
--   1. Restores the app root to your real root person:
--        Prophet Muhammad (Peace Be Upon Him)
--        36bf8774-9c05-4032-8f91-e163dcfede5f
--   2. Deletes every person created by supabase-test-seed.sql
--      (english_name starting with 'TEST ' or notes starting with 'TEST').
--      Foreign keys cascade, so matching unions and union_children rows are
--      removed automatically.
-- =============================================================================

-- Preview what will be deleted (optional — run alone first if you want):
-- SELECT id, english_name, urdu_name, notes
-- FROM persons
-- WHERE english_name LIKE 'TEST %' OR notes LIKE 'TEST%';

BEGIN;

-- 1) Restore the real root person
UPDATE app_config
SET value = '36bf8774-9c05-4032-8f91-e163dcfede5f', updated_at = now()
WHERE key = 'root_person_id';

-- 2) Delete all TEST persons (cascades to unions / union_children)
DELETE FROM persons
WHERE english_name LIKE 'TEST %'
   OR notes LIKE 'TEST%';

COMMIT;

-- Refresh the app afterwards — the real tree should be back, TEST tree gone.
-- =============================================================================
