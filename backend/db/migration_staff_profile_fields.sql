USE ddinfoways_staff;

ALTER TABLE staff_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS employment_type ENUM('full_time', 'part_time', 'contract') DEFAULT 'full_time',
  ADD COLUMN IF NOT EXISTS reporting_to INT,
  ADD COLUMN IF NOT EXISTS ird_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tax_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS kiwisaver_rate VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);
