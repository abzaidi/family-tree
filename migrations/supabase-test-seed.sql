-- =============================================================================
-- Zaidi Family Tree — Layout Test Seed
-- =============================================================================
-- Creates a dedicated TEST tree covering every important layout/relationship
-- edge case. Does NOT delete your real family data.
--
-- How to use:
-- 1. Run this entire script in the Supabase SQL Editor.
-- 2. Note the printed root id, OR look up person notes containing "TEST ROOT".
-- 3. Temporarily point the app at the test root:
--      UPDATE app_config SET value = '<test-root-uuid>' WHERE key = 'root_person_id';
-- 4. Refresh the app, Expand All, and walk through the checklist at the bottom.
-- 5. When done, restore your real root and optionally clean up with the
--    DELETE block at the end of this file.
-- =============================================================================

DO $$
DECLARE
  -- Generation 0
  v_root          UUID;
  v_root_spouse   UUID;

  -- Generation 1 — Scenario families under the root couple
  v_s1_a          UUID;  -- Scenario 1: single child, no spouse
  v_s2_a          UUID;  -- Scenario 2: couple with one child
  v_s2_spouse     UUID;
  v_s2_child      UUID;
  v_s3_a          UUID;  -- Scenario 3: two siblings, one has a spouse (overlap case)
  v_s3_b          UUID;
  v_s3_spouse     UUID;
  v_s4_a          UUID;  -- Scenario 4: three siblings, middle has spouse
  v_s4_b          UUID;
  v_s4_c          UUID;
  v_s4_spouse     UUID;
  v_s5_a          UUID;  -- Scenario 5: many siblings (wide row)
  v_s5_b          UUID;
  v_s5_c          UUID;
  v_s5_d          UUID;
  v_s5_e          UUID;
  v_s6_a          UUID;  -- Scenario 6: multiple spouses (multi-union)
  v_s6_spouse1    UUID;
  v_s6_spouse2    UUID;
  v_s6_child1     UUID;
  v_s6_child2     UUID;
  v_s7_a          UUID;  -- Scenario 7: single parent (no spouse) with children
  v_s7_child1     UUID;
  v_s7_child2     UUID;
  v_s8_a          UUID;  -- Scenario 8: deep chain (4 generations)
  v_s8_spouse     UUID;
  v_s8_child      UUID;
  v_s8_child_sp   UUID;
  v_s8_grand      UUID;
  v_s8_grand_sp   UUID;
  v_s8_great      UUID;
  v_s9_a          UUID;  -- Scenario 9: both siblings married, nested grandchildren
  v_s9_b          UUID;
  v_s9_a_sp       UUID;
  v_s9_b_sp       UUID;
  v_s9_a_c1       UUID;
  v_s9_a_c2       UUID;
  v_s9_b_c1       UUID;
  v_s10_a         UUID;  -- Scenario 10: long names + missing dates (fixed card size)
  v_s10_spouse    UUID;
  v_s11_a         UUID;  -- Scenario 11: half-siblings via shared parent, two unions
  v_s11_sp1       UUID;
  v_s11_sp2       UUID;
  v_s11_child1    UUID;
  v_s11_child2    UUID;

  -- Unions
  u_root          UUID;
  u_s2            UUID;
  u_s3            UUID;
  u_s4            UUID;
  u_s5            UUID;
  u_s6_1          UUID;
  u_s6_2          UUID;
  u_s7            UUID;
  u_s8_1          UUID;
  u_s8_2          UUID;
  u_s8_3          UUID;
  u_s9_root       UUID;
  u_s9_a          UUID;
  u_s9_b          UUID;
  u_s10           UUID;
  u_s11_1         UUID;
  u_s11_2         UUID;
BEGIN
  -- -------------------------------------------------------------------------
  -- Persons
  -- -------------------------------------------------------------------------
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, death_year, notes)
  VALUES ('TEST Root Ancestor', 'ٹیسٹ جڑ', 'male', 1900, NULL, 'TEST ROOT — switch app_config.root_person_id to this id')
  RETURNING id INTO v_root;

  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST Root Spouse', 'ٹیسٹ جڑ شریک', 'female', 1902, 'TEST')
  RETURNING id INTO v_root_spouse;

  -- Scenario 1
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S1 Lone Child', '', 'male', 1925, 'TEST S1: leaf with no spouse')
  RETURNING id INTO v_s1_a;

  -- Scenario 2
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S2 Parent', '', 'male', 1926, 'TEST S2: couple + one child')
  RETURNING id INTO v_s2_a;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S2 Spouse', '', 'female', 1928, 'TEST S2')
  RETURNING id INTO v_s2_spouse;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S2 Child', '', 'male', 1950, 'TEST S2')
  RETURNING id INTO v_s2_child;

  -- Scenario 3 — classic overlap case (sibling + spouse of sibling)
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S3 Older Sibling', '', 'male', 1927, 'TEST S3: expand this — spouse must not overlap younger sibling')
  RETURNING id INTO v_s3_a;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S3 Younger Sibling', '', 'male', 1929, 'TEST S3')
  RETURNING id INTO v_s3_b;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S3 Spouse', '', 'female', 1930, 'TEST S3')
  RETURNING id INTO v_s3_spouse;

  -- Scenario 4 — middle sibling married
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S4 Left', '', 'female', 1931, 'TEST S4')
  RETURNING id INTO v_s4_a;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S4 Middle', '', 'male', 1932, 'TEST S4: expand — spouse between siblings')
  RETURNING id INTO v_s4_b;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S4 Right', '', 'female', 1933, 'TEST S4')
  RETURNING id INTO v_s4_c;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S4 Middle Spouse', '', 'female', 1934, 'TEST S4')
  RETURNING id INTO v_s4_spouse;

  -- Scenario 5 — wide sibling row
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S5 Child A', '', 'male', 1935, 'TEST S5: wide row')
  RETURNING id INTO v_s5_a;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S5 Child B', '', 'female', 1936, 'TEST S5')
  RETURNING id INTO v_s5_b;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S5 Child C', '', 'male', 1937, 'TEST S5')
  RETURNING id INTO v_s5_c;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S5 Child D', '', 'female', 1938, 'TEST S5')
  RETURNING id INTO v_s5_d;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S5 Child E', '', 'male', 1939, 'TEST S5')
  RETURNING id INTO v_s5_e;

  -- Scenario 6 — multiple spouses
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S6 Multi Spouse Parent', '', 'male', 1940, 'TEST S6: expand — two spouses left/right')
  RETURNING id INTO v_s6_a;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S6 Spouse One', '', 'female', 1941, 'TEST S6')
  RETURNING id INTO v_s6_spouse1;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S6 Spouse Two', '', 'female', 1942, 'TEST S6')
  RETURNING id INTO v_s6_spouse2;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S6 Child From Spouse One', '', 'male', 1960, 'TEST S6')
  RETURNING id INTO v_s6_child1;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S6 Child From Spouse Two', '', 'female', 1962, 'TEST S6')
  RETURNING id INTO v_s6_child2;

  -- Scenario 7 — single parent
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S7 Single Parent', '', 'female', 1943, 'TEST S7: no spouse, two children')
  RETURNING id INTO v_s7_a;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S7 Child One', '', 'male', 1965, 'TEST S7')
  RETURNING id INTO v_s7_child1;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S7 Child Two', '', 'female', 1967, 'TEST S7')
  RETURNING id INTO v_s7_child2;

  -- Scenario 8 — deep chain
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S8 Gen1', '', 'male', 1944, 'TEST S8: deep 4-generation chain')
  RETURNING id INTO v_s8_a;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S8 Gen1 Spouse', '', 'female', 1945, 'TEST S8')
  RETURNING id INTO v_s8_spouse;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S8 Gen2', '', 'male', 1968, 'TEST S8')
  RETURNING id INTO v_s8_child;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S8 Gen2 Spouse', '', 'female', 1970, 'TEST S8')
  RETURNING id INTO v_s8_child_sp;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S8 Gen3', '', 'female', 1992, 'TEST S8')
  RETURNING id INTO v_s8_grand;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S8 Gen3 Spouse', '', 'male', 1990, 'TEST S8')
  RETURNING id INTO v_s8_grand_sp;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S8 Gen4', '', 'male', 2015, 'TEST S8')
  RETURNING id INTO v_s8_great;

  -- Scenario 9 — both siblings married with kids
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S9 Sibling A', '', 'male', 1946, 'TEST S9: both siblings married')
  RETURNING id INTO v_s9_a;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S9 Sibling B', '', 'male', 1948, 'TEST S9')
  RETURNING id INTO v_s9_b;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S9 A Spouse', '', 'female', 1947, 'TEST S9')
  RETURNING id INTO v_s9_a_sp;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S9 B Spouse', '', 'female', 1949, 'TEST S9')
  RETURNING id INTO v_s9_b_sp;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S9 A Child 1', '', 'male', 1970, 'TEST S9')
  RETURNING id INTO v_s9_a_c1;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S9 A Child 2', '', 'female', 1972, 'TEST S9')
  RETURNING id INTO v_s9_a_c2;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S9 B Child 1', '', 'male', 1974, 'TEST S9')
  RETURNING id INTO v_s9_b_c1;

  -- Scenario 10 — long names / missing dates
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, death_year, notes)
  VALUES (
    'TEST S10 Person With An Extremely Long English Name That Must Clamp',
    'ٹیسٹ دس بہت لمبا اردو نام جو دو لائنوں میں محدود ہونا چاہیے',
    'male', 1950, 2020, 'TEST S10: fixed card size with long bilingual names'
  )
  RETURNING id INTO v_s10_a;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S10 Spouse No Dates', '', 'female', NULL, 'TEST S10: missing years — card still same height')
  RETURNING id INTO v_s10_spouse;

  -- Scenario 11 — half siblings
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S11 Shared Parent', '', 'male', 1951, 'TEST S11: half-siblings via two spouses')
  RETURNING id INTO v_s11_a;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S11 Spouse Alpha', '', 'female', 1952, 'TEST S11')
  RETURNING id INTO v_s11_sp1;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S11 Spouse Beta', '', 'female', 1955, 'TEST S11')
  RETURNING id INTO v_s11_sp2;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S11 Child Alpha', '', 'male', 1975, 'TEST S11: half-sibling of Beta child')
  RETURNING id INTO v_s11_child1;
  INSERT INTO persons (english_name, urdu_name, gender, birth_year, notes)
  VALUES ('TEST S11 Child Beta', '', 'female', 1980, 'TEST S11: half-sibling of Alpha child')
  RETURNING id INTO v_s11_child2;

  -- -------------------------------------------------------------------------
  -- Unions + children
  -- -------------------------------------------------------------------------

  -- Root couple → all scenario heads as children
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_root, v_root_spouse) RETURNING id INTO u_root;
  INSERT INTO union_children (union_id, child_id) VALUES
    (u_root, v_s1_a),
    (u_root, v_s2_a),
    (u_root, v_s3_a),
    (u_root, v_s3_b),
    (u_root, v_s4_a),
    (u_root, v_s4_b),
    (u_root, v_s4_c),
    (u_root, v_s5_a),
    (u_root, v_s5_b),
    (u_root, v_s5_c),
    (u_root, v_s5_d),
    (u_root, v_s5_e),
    (u_root, v_s6_a),
    (u_root, v_s7_a),
    (u_root, v_s8_a),
    (u_root, v_s9_a),
    (u_root, v_s9_b),
    (u_root, v_s10_a),
    (u_root, v_s11_a);

  -- S2
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s2_a, v_s2_spouse) RETURNING id INTO u_s2;
  INSERT INTO union_children (union_id, child_id) VALUES (u_s2, v_s2_child);

  -- S3: older sibling + spouse (younger sibling is sibling under root, not under this union)
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s3_a, v_s3_spouse) RETURNING id INTO u_s3;

  -- S4: middle sibling + spouse
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s4_b, v_s4_spouse) RETURNING id INTO u_s4;

  -- S5 has no further unions — just a wide sibling row under root

  -- S6 multi-spouse
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s6_a, v_s6_spouse1) RETURNING id INTO u_s6_1;
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s6_a, v_s6_spouse2) RETURNING id INTO u_s6_2;
  INSERT INTO union_children (union_id, child_id) VALUES (u_s6_1, v_s6_child1);
  INSERT INTO union_children (union_id, child_id) VALUES (u_s6_2, v_s6_child2);

  -- S7 single parent
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s7_a, NULL) RETURNING id INTO u_s7;
  INSERT INTO union_children (union_id, child_id) VALUES
    (u_s7, v_s7_child1),
    (u_s7, v_s7_child2);

  -- S8 deep chain
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s8_a, v_s8_spouse) RETURNING id INTO u_s8_1;
  INSERT INTO union_children (union_id, child_id) VALUES (u_s8_1, v_s8_child);
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s8_child, v_s8_child_sp) RETURNING id INTO u_s8_2;
  INSERT INTO union_children (union_id, child_id) VALUES (u_s8_2, v_s8_grand);
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s8_grand, v_s8_grand_sp) RETURNING id INTO u_s8_3;
  INSERT INTO union_children (union_id, child_id) VALUES (u_s8_3, v_s8_great);

  -- S9 both siblings married
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s9_a, v_s9_a_sp) RETURNING id INTO u_s9_a;
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s9_b, v_s9_b_sp) RETURNING id INTO u_s9_b;
  INSERT INTO union_children (union_id, child_id) VALUES
    (u_s9_a, v_s9_a_c1),
    (u_s9_a, v_s9_a_c2),
    (u_s9_b, v_s9_b_c1);

  -- S10 long names
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s10_a, v_s10_spouse) RETURNING id INTO u_s10;

  -- S11 half-siblings
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s11_a, v_s11_sp1) RETURNING id INTO u_s11_1;
  INSERT INTO unions (partner1_id, partner2_id) VALUES (v_s11_a, v_s11_sp2) RETURNING id INTO u_s11_2;
  INSERT INTO union_children (union_id, child_id) VALUES (u_s11_1, v_s11_child1);
  INSERT INTO union_children (union_id, child_id) VALUES (u_s11_2, v_s11_child2);

  -- Point the app at the test root (comment this out if you want to switch manually)
  INSERT INTO app_config (key, value)
  VALUES ('root_person_id', v_root::text)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

  RAISE NOTICE 'TEST ROOT ID = %', v_root;
  RAISE NOTICE 'App root_person_id has been switched to the TEST tree. Restore your real root when done.';
END $$;

-- =============================================================================
-- Visual checklist (after Expand All)
-- =============================================================================
-- S1  Lone child sits alone under root; no orphan connector under them.
-- S2  Couple centered; one child centered under the junction; solid gray lines.
-- S3  Expand Older Sibling: their spouse does NOT overlap Younger Sibling.
-- S4  Expand Middle: spouse sits between Left and Right with clear gaps.
-- S5  Five siblings in one row with even gaps; no collisions.
-- S6  Expand Multi Spouse Parent: Spouse One and Spouse Two on opposite sides;
--     each child hangs under the correct union; no overlapping subtrees.
-- S7  Single parent (no spouse card): two children under one junction; no orphan stub.
-- S8  Expand Gen1 → Gen2 → Gen3: four generations deep, vertically stacked, no kinks.
-- S9  Expand both siblings: their spouse/child blocks do not collide with each other.
-- S10 Long-name card and no-dates card are the SAME size; names clamp to 2 lines.
-- S11 Expand Shared Parent: two spouses + half-siblings; drawer shows half-siblings
--     when you open either child's detail panel.
--
-- Also re-check after Collapse All / selective expand, and after searching for
-- "TEST S8 Gen4" (should pan to that node without opening the drawer).
-- =============================================================================

-- =============================================================================
-- Cleanup (run when finished testing)
-- =============================================================================
-- WARNING: restores nothing automatically — set your real root first!
--
-- -- 1) Restore your real root (replace with your real person UUID):
-- -- UPDATE app_config SET value = '<YOUR-REAL-ROOT-UUID>' WHERE key = 'root_person_id';
--
-- -- 2) Delete all TEST persons (cascades unions / union_children via FKs):
-- -- DELETE FROM persons WHERE english_name LIKE 'TEST %' OR notes LIKE 'TEST%';
-- =============================================================================
