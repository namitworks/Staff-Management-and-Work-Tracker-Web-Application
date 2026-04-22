USE ddinfoways_staff;

-- Clean up existing data to avoid duplicates during seeding
DELETE FROM staff_profiles;
DELETE FROM users;

-- Hash for "Admin@123" with bcrypt (12 rounds)
-- Note: Replace with actual generated bcrypt hash if manual hashing needed.
-- $2b$12$6t6LwH4r/ZlK78zH.DXZkON9R0qX4Vw4e.fN5V1QOa6N.hHqRTRT. is an example hash for Admin@123
INSERT INTO users (name, email, password, role, status) VALUES 
('System Admin', 'admin@ddinfoways.co.nz', '$2b$12$AKPI6r0tLN/y24rKysrR8ue2MSZ39feOFJcLzb5.kfGkMPSQ1oWnu', 'admin', 'active');
-- Note: the password above is bcrypt hash for 'Admin@123'

SET @admin_id = LAST_INSERT_ID();

INSERT INTO staff_profiles (user_id, staff_id, phone, address, department, joining_date) VALUES 
(@admin_id, 'DD-2020-001', '0210000000', 'Auckland, NZ', 'Management', '2020-01-01');

-- Additional staff can be added here
