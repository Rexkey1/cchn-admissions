-- migrations/upgrade.sql
-- Add missing columns for modernized system
ALTER TABLE applicants 
  ADD COLUMN IF NOT EXISTS is_shortlisted TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_paid TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_comments TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS interview_date DATE DEFAULT NULL;

-- Indexes for performance
ALTER TABLE applicants
  ADD INDEX IF NOT EXISTS idx_program (program),
  ADD INDEX IF NOT EXISTS idx_shortlisted (is_shortlisted),
  ADD INDEX IF NOT EXISTS idx_verified (is_verified),
  ADD INDEX IF NOT EXISTS idx_paid (is_paid),
  ADD INDEX IF NOT EXISTS idx_interview_date (interview_date);
