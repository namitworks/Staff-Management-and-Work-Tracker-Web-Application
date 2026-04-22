-- Seed dummy data for development testing
-- Run after migrations: mysql -u username -p ddinfoways_staff < db/seed_dummy.sql

USE ddinfoways_staff;

-- Clear existing data (for development only)
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM id_card_logs;
DELETE FROM salary;
DELETE FROM performance;
DELETE FROM attendance;
DELETE FROM leaves;
DELETE FROM tasks;
DELETE FROM projects;
DELETE FROM staff_profiles;
DELETE FROM users;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert admin user
INSERT INTO users (name, email, password, role, status) VALUES
('Admin User', 'admin@ddinfoways.co.nz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYwcX9j0yMo9B7qYm6kpYvXu', 'admin', 'active');

-- Insert staff users (password: Password@123)
INSERT INTO users (name, email, password, role, status) VALUES
('Sarah Johnson', 'sarah@ddinfoways.co.nz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYwcX9j0yMo9B7qYm6kpYvXu', 'team_lead', 'active'),
('Mike Chen', 'mike@ddinfoways.co.nz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYwcX9j0yMo9B7qYm6kpYvXu', 'staff', 'active'),
('Emma Wilson', 'emma@ddinfoways.co.nz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYwcX9j0yMo9B7qYm6kpYvXu', 'staff', 'active'),
('David Brown', 'david@ddinfoways.co.nz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYwcX9j0yMo9B7qYm6kpYvXu', 'staff', 'active');

-- Insert staff profiles (using auto-increment IDs)
INSERT INTO staff_profiles (user_id, phone, staff_id, address, department, joining_date, emergency_contact, avatar_url, ird_number, tax_code, kiwisaver_rate, bank_name, bank_account) VALUES
(2, '+64 21 123 4567', 'DD-2025-001', '123 Queen Street, Auckland', 'Development', '2024-01-15', 'John Johnson +64 21 987 6543', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', '123456789', 'M', 3, 'ANZ Bank', '12-3456-7890123-00'),
(3, '+64 22 234 5678', 'DD-2025-002', '456 Victoria Street, Wellington', 'Development', '2024-03-01', 'Lisa Chen +64 22 876 5432', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', '234567890', 'M', 4, 'BNZ Bank', '02-4567-8901234-00'),
(4, '+64 27 345 6789', 'DD-2025-003', '789 Colombo Street, Christchurch', 'Design', '2024-06-15', 'Robert Wilson +64 27 765 4321', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', '345678901', 'M', 3, 'Westpac', '03-5678-9012345-00'),
(5, '+64 29 456 7890', 'DD-2025-004', '321 Lambton Quay, Wellington', 'Support', '2024-09-01', 'Mary Brown +64 29 654 3210', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', '456789012', 'M', 6, 'Kiwibank', '38-6789-0123456-00');

-- Insert projects
INSERT INTO projects (name, type, status, start_date, end_date, description, created_by) VALUES
('DDinfoways Website Redesign', 'website', 'in_progress', '2024-01-01', '2024-12-31', 'Complete redesign of company website with modern UI/UX', 2),
('Restaurant POS Integration', 'pos_onboarding', 'completed', '2024-02-01', '2024-04-30', 'POS system integration for Green Garden Restaurant', 2),
('Customer Support Portal', 'support', 'active', '2024-03-01', '2024-08-31', 'Build customer support ticketing system', 2);

-- Insert tasks
INSERT INTO tasks (title, description, priority, status, assigned_to, project_id, due_date) VALUES
('Setup project structure', 'Initialize Next.js project with required dependencies', 'high', 'done', 3, 1, '2024-01-10'),
('Design homepage mockups', 'Create wireframes and mockups for homepage', 'medium', 'done', 4, 1, '2024-01-20'),
('Implement responsive layout', 'Build responsive CSS for all pages', 'high', 'in_progress', 3, 1, '2024-02-15'),
('POS API integration', 'Connect to restaurant POS system APIs', 'high', 'review', 3, 2, '2024-04-15'),
('Database setup for POS', 'Create database schema for POS data', 'medium', 'done', 3, 2, '2024-03-30'),
('User authentication', 'Implement login/signup for support portal', 'high', 'todo', 5, 3, '2024-05-01'),
('Ticket creation form', 'Build form for creating support tickets', 'medium', 'in_progress', 5, 3, '2024-04-30'),
('Admin dashboard', 'Create admin interface for ticket management', 'high', 'todo', 2, 3, '2024-06-15'),
('Code review', 'Review and test all implemented features', 'medium', 'todo', 2, NULL, '2024-05-01'),
('Documentation', 'Write user and developer documentation', 'low', 'todo', 4, NULL, '2024-05-15');

-- Insert attendance records for last 14 days
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours) VALUES
-- Sarah Johnson (user_id: 2)
(2, DATE_SUB(CURDATE(), INTERVAL 13 DAY), '09:00:00', '17:30:00', 8.5),
(2, DATE_SUB(CURDATE(), INTERVAL 12 DAY), '08:45:00', '17:15:00', 8.5),
(2, DATE_SUB(CURDATE(), INTERVAL 11 DAY), '09:15:00', '17:45:00', 8.5),
(2, DATE_SUB(CURDATE(), INTERVAL 10 DAY), '08:30:00', '16:30:00', 8.0),
(2, DATE_SUB(CURDATE(), INTERVAL 9 DAY), '09:00:00', '17:00:00', 8.0),
(2, DATE_SUB(CURDATE(), INTERVAL 8 DAY), '08:45:00', '17:15:00', 8.5),
(2, DATE_SUB(CURDATE(), INTERVAL 7 DAY), '09:30:00', '18:00:00', 8.5),
(2, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '08:15:00', '16:45:00', 8.5),
(2, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '09:00:00', '17:30:00', 8.5),
(2, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '08:45:00', '17:15:00', 8.5),
(2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:15:00', '17:45:00', 8.5),
(2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:30:00', '16:30:00', 8.0),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00', '17:00:00', 8.0),
(2, CURDATE(), '08:45:00', '17:15:00', 8.5),

-- Mike Chen (user_id: 3)
(3, DATE_SUB(CURDATE(), INTERVAL 13 DAY), '09:00:00', '17:30:00', 8.5),
(3, DATE_SUB(CURDATE(), INTERVAL 12 DAY), '08:45:00', '17:15:00', 8.5),
(3, DATE_SUB(CURDATE(), INTERVAL 11 DAY), '09:15:00', '17:45:00', 8.5),
(3, DATE_SUB(CURDATE(), INTERVAL 10 DAY), '08:30:00', '16:30:00', 8.0),
(3, DATE_SUB(CURDATE(), INTERVAL 9 DAY), '09:00:00', '17:00:00', 8.0),
(3, DATE_SUB(CURDATE(), INTERVAL 8 DAY), '08:45:00', '17:15:00', 8.5),
(3, DATE_SUB(CURDATE(), INTERVAL 7 DAY), '09:30:00', '18:00:00', 8.5),
(3, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '08:15:00', '16:45:00', 8.5),
(3, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '09:00:00', '17:30:00', 8.5),
(3, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '08:45:00', '17:15:00', 8.5),
(3, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:15:00', '17:45:00', 8.5),
(3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:30:00', '16:30:00', 8.0),
(3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00', '17:00:00', 8.0),
(3, CURDATE(), '08:45:00', '17:15:00', 8.5),

-- Emma Wilson (user_id: 4)
(4, DATE_SUB(CURDATE(), INTERVAL 13 DAY), '09:00:00', '17:30:00', 8.5),
(4, DATE_SUB(CURDATE(), INTERVAL 12 DAY), '08:45:00', '17:15:00', 8.5),
(4, DATE_SUB(CURDATE(), INTERVAL 11 DAY), '09:15:00', '17:45:00', 8.5),
(4, DATE_SUB(CURDATE(), INTERVAL 10 DAY), '08:30:00', '16:30:00', 8.0),
(4, DATE_SUB(CURDATE(), INTERVAL 9 DAY), '09:00:00', '17:00:00', 8.0),
(4, DATE_SUB(CURDATE(), INTERVAL 8 DAY), '08:45:00', '17:15:00', 8.5),
(4, DATE_SUB(CURDATE(), INTERVAL 7 DAY), '09:30:00', '18:00:00', 8.5),
(4, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '08:15:00', '16:45:00', 8.5),
(4, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '09:00:00', '17:30:00', 8.5),
(4, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '08:45:00', '17:15:00', 8.5),
(4, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:15:00', '17:45:00', 8.5),
(4, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:30:00', '16:30:00', 8.0),
(4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00', '17:00:00', 8.0),
(4, CURDATE(), '08:45:00', '17:15:00', 8.5),

-- David Brown (user_id: 5)
(5, DATE_SUB(CURDATE(), INTERVAL 13 DAY), '09:00:00', '17:30:00', 8.5),
(5, DATE_SUB(CURDATE(), INTERVAL 12 DAY), '08:45:00', '17:15:00', 8.5),
(5, DATE_SUB(CURDATE(), INTERVAL 11 DAY), '09:15:00', '17:45:00', 8.5),
(5, DATE_SUB(CURDATE(), INTERVAL 10 DAY), '08:30:00', '16:30:00', 8.0),
(5, DATE_SUB(CURDATE(), INTERVAL 9 DAY), '09:00:00', '17:00:00', 8.0),
(5, DATE_SUB(CURDATE(), INTERVAL 8 DAY), '08:45:00', '17:15:00', 8.5),
(5, DATE_SUB(CURDATE(), INTERVAL 7 DAY), '09:30:00', '18:00:00', 8.5),
(5, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '08:15:00', '16:45:00', 8.5),
(5, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '09:00:00', '17:30:00', 8.5),
(5, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '08:45:00', '17:15:00', 8.5),
(5, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:15:00', '17:45:00', 8.5),
(5, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:30:00', '16:30:00', 8.0),
(5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00', '17:00:00', 8.0),
(5, CURDATE(), '08:45:00', '17:15:00', 8.5);

-- Insert leave requests
INSERT INTO leaves (user_id, type, from_date, to_date, reason, status, reviewed_by) VALUES
(3, 'annual', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Family vacation', 'approved', 2),
(4, 'sick', DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Medical appointment', 'pending', NULL);

-- Insert performance reviews
INSERT INTO performance (user_id, note, rating, added_by, date) VALUES
(3, 'Excellent work on POS integration project. Shows great technical skills and attention to detail.', 5, 2, '2024-04-15'),
(4, 'Creative design solutions and good communication with team. Could improve on meeting deadlines.', 4, 2, '2024-04-10'),
(5, 'Good problem-solving skills in support scenarios. Needs to work on response time.', 3, 2, '2024-04-05');

-- Insert sample salary/payslip records
INSERT INTO salary (
  user_id, month, year, amount, status, notes, pay_date,
  basic_salary, housing_allowance, transport_allowance, special_allowance,
  overtime_hours, overtime_amount, bonus, gross_salary,
  paye_tax, kiwisaver_employee, kiwisaver_employer, acc_levy, student_loan, other_deductions, total_deductions, net_salary,
  days_worked, working_days, leaves_taken,
  ytd_gross, ytd_tax, ytd_net,
  annual_leave_balance, sick_leave_balance,
  tax_code, ird_number, kiwisaver_rate, bank_name, bank_account
) VALUES
(2, 4, 2024, 6250.00, 'paid', 'April 2024 payslip', '2024-04-25',
  6000.00, 200.00, 150.00, 100.00,
  5.00, 375.00, 500.00, 6325.00,
  793.13, 180.00, 180.00, 50.26, 0.00, 0.00, 1023.39, 5301.61,
  20.00, 22.00, 2.00,
  25250.00, 3172.52, 22077.48,
  23.50, 8.50,
  'M', '123456789', 3, 'ANZ Bank', '12-3456-7890123-00'),

(3, 4, 2024, 5750.00, 'paid', 'April 2024 payslip', '2024-04-25',
  5500.00, 150.00, 125.00, 75.00,
  3.00, 225.00, 300.00, 5375.00,
  672.19, 161.25, 165.00, 43.08, 0.00, 0.00, 876.52, 4498.48,
  19.00, 22.00, 3.00,
  21500.00, 2688.76, 18811.24,
  25.00, 10.00,
  'M', '234567890', 4, 'BNZ Bank', '02-4567-8901234-00');

-- Insert ID card logs
INSERT INTO id_card_logs (user_id, generated_by, generated_at, valid_until) VALUES
(2, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
(3, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
(4, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
(5, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR));

SELECT 'Dummy data seeded successfully!' as message;