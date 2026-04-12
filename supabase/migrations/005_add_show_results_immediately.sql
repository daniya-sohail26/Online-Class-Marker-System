-- Add show_results_immediately to test_templates
-- This allows teachers to configure whether results are shown immediately after submission
-- or only after manual review

ALTER TABLE test_templates
ADD COLUMN IF NOT EXISTS show_results_immediately BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN test_templates.show_results_immediately IS 
'If true, students see their results immediately after test submission. If false, results are hidden until teacher reviews them.';
