ALTER TABLE staff_profiles 
ADD COLUMN staff_id VARCHAR(20) UNIQUE,
ADD COLUMN id_card_url VARCHAR(500) NULL,
ADD COLUMN id_card_generated_at DATETIME NULL;
