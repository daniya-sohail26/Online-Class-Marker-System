-- Add allowed_platform column to templates table
-- Values: 'web', 'mobile', 'both' (default: 'both')
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS allowed_platform TEXT NOT NULL DEFAULT 'both'
  CHECK (allowed_platform IN ('web', 'mobile', 'both'));
