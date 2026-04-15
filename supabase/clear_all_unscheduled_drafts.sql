-- Remove all current unscheduled drafts (tests where is_published = false).
-- Run in Supabase SQL Editor.
--
-- This is intended as a reset so you can start test scheduling from a clean state.
-- Child rows are removed first to be safe in schemas without ON DELETE CASCADE.

BEGIN;

WITH draft_tests AS (
  SELECT id
  FROM public.tests
  WHERE COALESCE(is_published, false) = false
)
DELETE FROM public.answers a
USING public.attempts at
JOIN draft_tests d ON d.id = at.test_id
WHERE a.attempt_id = at.id;

WITH draft_tests AS (
  SELECT id
  FROM public.tests
  WHERE COALESCE(is_published, false) = false
)
DELETE FROM public.attempts at
USING draft_tests d
WHERE at.test_id = d.id;

WITH draft_tests AS (
  SELECT id
  FROM public.tests
  WHERE COALESCE(is_published, false) = false
)
DELETE FROM public.test_questions tq
USING draft_tests d
WHERE tq.test_id = d.id;

WITH draft_tests AS (
  SELECT id
  FROM public.tests
  WHERE COALESCE(is_published, false) = false
)
DELETE FROM public.test_schedules ts
USING draft_tests d
WHERE ts.test_id = d.id;

DELETE FROM public.tests
WHERE COALESCE(is_published, false) = false;

COMMIT;

-- Verify reset
SELECT
  COUNT(*) AS remaining_unscheduled_drafts
FROM public.tests
WHERE COALESCE(is_published, false) = false;
