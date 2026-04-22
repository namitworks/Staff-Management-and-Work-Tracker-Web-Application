USE ddinfoways_staff;

ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS status ENUM('present','absent','half_day','late') DEFAULT 'present',
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
  ADD COLUMN IF NOT EXISTS notes TEXT;
