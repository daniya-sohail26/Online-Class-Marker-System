-- Fix timezone conversion issue in test_schedules
-- The problem: TIMESTAMP columns were applying timezone conversion
-- The solution: Convert to TEXT to store exact ISO strings

-- Step 1: Check current column types and data
SELECT 
  column_name, 
  data_type, 
  udt_name 
FROM information_schema.columns 
WHERE table_name = 'test_schedules' 
AND column_name IN ('availability_start', 'availability_end');

-- Step 2: Backup current data with correct ISO format (no conversion)
CREATE TEMP TABLE test_schedules_backup AS
SELECT 
  id,
  test_id,
  availability_start::text as start_iso,
  availability_end::text as end_iso,
  is_active,
  time_zone,
  created_at
FROM test_schedules;

-- Step 3: Drop the old columns (with timezone interpretation)
ALTER TABLE test_schedules 
DROP COLUMN IF EXISTS availability_start,
DROP COLUMN IF EXISTS availability_end;

-- Step 4: Add new columns as TEXT (no timezone conversion)
ALTER TABLE test_schedules 
ADD COLUMN availability_start TEXT,
ADD COLUMN availability_end TEXT;

-- Step 5: Restore data from backup
UPDATE test_schedules ts
SET 
  availability_start = (SELECT start_iso FROM test_schedules_backup WHERE id = ts.id),
  availability_end = (SELECT end_iso FROM test_schedules_backup WHERE id = ts.id)
WHERE EXISTS (SELECT 1 FROM test_schedules_backup WHERE id = ts.id);

-- Step 6: Verify fix - should show times with correct hours
SELECT 
  test_id,
  availability_start,
  availability_end,
  substr(availability_start, 12, 5) as start_time_hm,
  substr(availability_end, 12, 5) as end_time_hm
FROM test_schedules
LIMIT 10;

-- SUCCESS: If start_time_hm and end_time_hm match your intended times, the fix worked
