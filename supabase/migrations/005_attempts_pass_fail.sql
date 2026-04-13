-- Pass/fail and percentage on attempts (set by scoring / Edge Function)
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS passed BOOLEAN;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS score_percent NUMERIC(6, 2);

COMMENT ON COLUMN attempts.passed IS 'NULL = not scored; true = pass; false = fail (vs template passing_percentage)';
COMMENT ON COLUMN attempts.score_percent IS 'Score as percent of max marks for the test';
