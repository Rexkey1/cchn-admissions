-- Add tracking columns for status
ALTER TABLE applicants 
ADD COLUMN IF NOT EXISTS is_shortlisted TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_paid TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_comments TEXT,
ADD COLUMN IF NOT EXISTS interview_date DATE,
ADD COLUMN IF NOT EXISTS admitted_at TIMESTAMP NULL DEFAULT NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_phone ON applicants(phone_number);
CREATE INDEX IF NOT EXISTS idx_pin ON applicants(pin_moh);
CREATE INDEX IF NOT EXISTS idx_shortlisted ON applicants(is_shortlisted);
CREATE INDEX IF NOT EXISTS idx_verified ON applicants(is_verified);
CREATE INDEX IF NOT EXISTS idx_paid ON applicants(is_paid);
CREATE INDEX IF NOT EXISTS idx_interview ON applicants(interview_date);
CREATE INDEX IF NOT EXISTS idx_admitted ON applicants(admitted_at);
