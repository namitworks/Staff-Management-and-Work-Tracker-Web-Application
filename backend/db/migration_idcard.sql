-- Migration: Add ID card related columns to staff_profiles table
-- Date: 2026-04-22
-- Description: Adds columns for ID card generation and emergency contact details

USE ddinfoways_staff;

-- Add columns one by one to avoid syntax errors
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff_profiles' AND COLUMN_NAME = 'staff_id') = 0,
  'ALTER TABLE staff_profiles ADD COLUMN staff_id VARCHAR(20) UNIQUE',
  'SELECT "Column staff_id already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff_profiles' AND COLUMN_NAME = 'id_card_generated_at') = 0,
  'ALTER TABLE staff_profiles ADD COLUMN id_card_generated_at DATETIME',
  'SELECT "Column id_card_generated_at already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff_profiles' AND COLUMN_NAME = 'id_card_url') = 0,
  'ALTER TABLE staff_profiles ADD COLUMN id_card_url VARCHAR(500)',
  'SELECT "Column id_card_url already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff_profiles' AND COLUMN_NAME = 'valid_until') = 0,
  'ALTER TABLE staff_profiles ADD COLUMN valid_until DATE',
  'SELECT "Column valid_until already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff_profiles' AND COLUMN_NAME = 'emergency_contact_name') = 0,
  'ALTER TABLE staff_profiles ADD COLUMN emergency_contact_name VARCHAR(100)',
  'SELECT "Column emergency_contact_name already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff_profiles' AND COLUMN_NAME = 'emergency_contact_phone') = 0,
  'ALTER TABLE staff_profiles ADD COLUMN emergency_contact_phone VARCHAR(20)',
  'SELECT "Column emergency_contact_phone already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff_profiles' AND COLUMN_NAME = 'blood_group') = 0,
  'ALTER TABLE staff_profiles ADD COLUMN blood_group VARCHAR(5)',
  'SELECT "Column blood_group already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create id_card_logs table for tracking ID card generations
CREATE TABLE IF NOT EXISTS id_card_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    generated_by INT NOT NULL,
    generated_at DATETIME DEFAULT NOW(),
    valid_until DATE,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (generated_by) REFERENCES users(id)
);
