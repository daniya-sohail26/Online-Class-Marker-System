-- Fix published tests that have missing availability window.
-- Run this in Supabase SQL Editor.
--
-- Behavior:
-- 1) Repairs missing windows in public.tests
-- 2) Repairs/creates corresponding rows in public.test_schedules
-- 3) Uses UTC timestamps (TIMESTAMPTZ)
-- 4) Falls back to created_at/now() + template duration (or 60 min)

DO $$
BEGIN
  -- Step A: normalize tests.start_time/end_time for published tests
  WITH fixed_windows AS (
    SELECT
      t.id,
      COALESCE(t.start_time, t.created_at, now()) AS fixed_start,
      COALESCE(
        t.end_time,
        COALESCE(t.start_time, t.created_at, now())
        + make_interval(mins => GREATEST(COALESCE(tp.duration_minutes, 60), 1))
      ) AS fixed_end
    FROM public.tests t
    LEFT JOIN public.templates tp ON tp.id = t.template_id
    WHERE t.is_published = true
  )
  UPDATE public.tests t
  SET
    start_time = fw.fixed_start,
    end_time = CASE
      WHEN fw.fixed_end <= fw.fixed_start THEN fw.fixed_start + interval '60 minutes'
      ELSE fw.fixed_end
    END
  FROM fixed_windows fw
  WHERE t.id = fw.id
    AND (
      t.start_time IS NULL
      OR t.end_time IS NULL
      OR t.end_time <= t.start_time
    );

  -- Step B: if there are multiple schedule rows for a test, keep only one by test_id
  -- (old data may have duplicates that break portal joins)
  DELETE FROM public.test_schedules ts
  USING public.test_schedules newer
  WHERE ts.test_id = newer.test_id
    AND ts.ctid < newer.ctid;

  -- Step C1: repair existing schedule rows for published tests
  UPDATE public.test_schedules ts
  SET
    availability_start = t.start_time,
    availability_end = t.end_time,
    time_zone = 'UTC',
    is_active = true
  FROM public.tests t
  WHERE ts.test_id = t.id
    AND t.is_published = true
    AND t.start_time IS NOT NULL
    AND t.end_time IS NOT NULL
    AND t.end_time > t.start_time;

  -- Step C2: insert missing schedule rows for published tests
  INSERT INTO public.test_schedules (test_id, availability_start, availability_end, time_zone, is_active)
  SELECT
    t.id,
    t.start_time,
    t.end_time,
    'UTC',
    true
  FROM public.tests t
  LEFT JOIN public.test_schedules ts ON ts.test_id = t.id
  WHERE t.is_published = true
    AND t.start_time IS NOT NULL
    AND t.end_time IS NOT NULL
    AND t.end_time > t.start_time
    AND ts.test_id IS NULL;
END $$;

-- Verify published tests and active schedule windows
SELECT
  t.id,
  t.name,
  t.is_published,
  t.start_time,
  t.end_time,
  ts.availability_start,
  ts.availability_end,
  ts.is_active,
  t.created_at
FROM public.tests t
LEFT JOIN public.test_schedules ts
  ON ts.test_id = t.id AND ts.is_active = true
WHERE t.is_published = true
ORDER BY t.created_at DESC;

-- This count should be 0 after running the fix
SELECT COUNT(*) AS published_with_missing_window
FROM public.tests t
LEFT JOIN public.test_schedules ts
  ON ts.test_id = t.id AND ts.is_active = true
WHERE t.is_published = true
  AND (
    t.start_time IS NULL
    OR t.end_time IS NULL
    OR t.end_time <= t.start_time
    OR ts.test_id IS NULL
    OR ts.availability_start IS NULL
    OR ts.availability_end IS NULL
    OR ts.availability_end <= ts.availability_start
  );
