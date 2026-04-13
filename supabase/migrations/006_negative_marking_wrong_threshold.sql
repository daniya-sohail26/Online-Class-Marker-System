-- Optional: which wrong answer (1-based count) first gets the penalty. Unattempted always penalized when negative marking is on.
ALTER TABLE templates ADD COLUMN IF NOT EXISTS negative_marking_wrong_threshold INTEGER NOT NULL DEFAULT 3;

COMMENT ON COLUMN templates.negative_marking_wrong_threshold IS 'Wrong answers before this index score 0; from this ordinal onward, apply negative_marking_penalty. Skipped questions always get the penalty.';
