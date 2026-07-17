-- Apply this once to an existing Supabase project to make the family tree
-- publicly readable while keeping all writes restricted by existing policies.

DROP POLICY IF EXISTS "Anyone authenticated can view non-deleted persons" ON persons;
DROP POLICY IF EXISTS "Anyone can view non-deleted persons" ON persons;
CREATE POLICY "Anyone can view non-deleted persons"
  ON persons FOR SELECT
  TO anon, authenticated
  USING (deleted = false);

DROP POLICY IF EXISTS "Anyone authenticated can view unions" ON unions;
DROP POLICY IF EXISTS "Anyone can view unions" ON unions;
CREATE POLICY "Anyone can view unions"
  ON unions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone authenticated can view union_children" ON union_children;
DROP POLICY IF EXISTS "Anyone can view union_children" ON union_children;
CREATE POLICY "Anyone can view union_children"
  ON union_children FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone authenticated can view config" ON app_config;
DROP POLICY IF EXISTS "Anyone can view config" ON app_config;
CREATE POLICY "Anyone can view config"
  ON app_config FOR SELECT
  TO anon, authenticated
  USING (true);
