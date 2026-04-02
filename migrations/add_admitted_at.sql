-- migrations/add_admitted_at.sql
-- Adds admitted_at timestamp to track when each applicant was admitted/verified.
-- Safe to run multiple times.

USE applicant_manager;

ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS admitted_at DATETIME NULL AFTER is_verified;

-- Back-fill: existing verified applicants get created_at as admitted_at estimate
UPDATE applicants
  SET admitted_at = created_at
  WHERE is_verified = 1 AND admitted_at IS NULL;

-- Index for fast date-based queries
ALTER TABLE applicants
  ADD INDEX IF NOT EXISTS idx_admitted_at (admitted_at);
