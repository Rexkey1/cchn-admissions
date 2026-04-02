-- migrations/upgrade.sql
-- Additive migration: adds any missing columns to support the React API
-- Safe to run multiple times (IF NOT EXISTS / IF column not present)

USE applicant_manager;

-- Add missing columns to applicants (safe: uses IF NOT EXISTS pattern via ALTER IGNORE)
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS is_shortlisted  TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified     TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_paid         TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_comments  TEXT         NULL;

-- Indexes for fast filtering
ALTER TABLE applicants
  ADD INDEX IF NOT EXISTS idx_shortlisted (is_shortlisted),
  ADD INDEX IF NOT EXISTS idx_verified    (is_verified),
  ADD INDEX IF NOT EXISTS idx_paid        (is_paid),
  ADD INDEX IF NOT EXISTS idx_program     (program);
