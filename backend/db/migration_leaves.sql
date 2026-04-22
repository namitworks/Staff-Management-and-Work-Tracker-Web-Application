USE ddinfoways_staff;

ALTER TABLE leaves
  ADD COLUMN IF NOT EXISTS total_days INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS leave_year INT,
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT 0;

-- Required for cancel flow
ALTER TABLE leaves
  MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS leave_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  year INT NOT NULL,
  annual_total INT DEFAULT 20,
  annual_used INT DEFAULT 0,
  sick_total INT DEFAULT 10,
  sick_used INT DEFAULT 0,
  personal_total INT DEFAULT 5,
  personal_used INT DEFAULT 0,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
  UNIQUE KEY unique_user_year (user_id, year),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
