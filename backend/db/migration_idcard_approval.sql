-- Add ID Card Approval Status
ALTER TABLE staff_profiles 
ADD COLUMN IF NOT EXISTS id_card_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER id_card_generated_at,
ADD COLUMN IF NOT EXISTS id_card_approved_by INT AFTER id_card_status,
ADD COLUMN IF NOT EXISTS id_card_approved_at DATETIME AFTER id_card_approved_by,
ADD COLUMN IF NOT EXISTS id_card_rejection_reason TEXT AFTER id_card_approved_at,
ADD FOREIGN KEY (id_card_approved_by) REFERENCES users(id) ON DELETE SET NULL;
