USE ddinfoways_staff;

-- Development-only reset
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM attendance;
DELETE FROM leaves;
DELETE FROM performance;
DELETE FROM salary;
DELETE FROM tasks;
DELETE FROM projects;
DELETE FROM staff_profiles;
DELETE FROM users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users (password: Password@123)
INSERT INTO users (name, email, password, role, status) VALUES
('Admin User', 'admin@ddinfoways.co.nz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYwcX9j0yMo9B7qYm6kpYvXu', 'admin', 'active'),
('Sarah Johnson', 'sarah@ddinfoways.co.nz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYwcX9j0yMo9B7qYm6kpYvXu', 'team_lead', 'active'),
('Mike Chen', 'mike@ddinfoways.co.nz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYwcX9j0yMo9B7qYm6kpYvXu', 'staff', 'active'),
('Emma Wilson', 'emma@ddinfoways.co.nz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYwcX9j0yMo9B7qYm6kpYvXu', 'staff', 'active'),
('David Brown', 'david@ddinfoways.co.nz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYwcX9j0yMo9B7qYm6kpYvXu', 'staff', 'active');

-- Staff profiles
INSERT INTO staff_profiles (user_id, phone, staff_id, address, department, joining_date, emergency_contact, avatar_url) VALUES
(2, '+64 21 123 4567', 'DD-2025-001', '123 Queen Street, Auckland', 'Development', '2024-01-15', 'John Johnson +64 21 987 6543', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'),
(3, '+64 22 234 5678', 'DD-2025-002', '456 Victoria Street, Wellington', 'Development', '2024-03-01', 'Lisa Chen +64 22 876 5432', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'),
(4, '+64 27 345 6789', 'DD-2025-003', '789 Colombo Street, Christchurch', 'Design', '2024-06-15', 'Robert Wilson +64 27 765 4321', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'),
(5, '+64 29 456 7890', 'DD-2025-004', '321 Lambton Quay, Wellington', 'Support', '2024-09-01', 'Mary Brown +64 29 654 3210', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David');

-- Projects
INSERT INTO projects (name, type, status, start_date, end_date, description, created_by) VALUES
('DDinfoways Website Redesign', 'website', 'active', '2024-01-01', '2024-12-31', 'Complete redesign of company website with modern UI/UX', 2),
('Restaurant POS Integration', 'pos_onboarding', 'completed', '2024-02-01', '2024-04-30', 'POS system integration for Green Garden Restaurant', 2),
('Customer Support Portal', 'support', 'on_hold', '2024-03-01', '2024-08-31', 'Build customer support ticketing system', 2);

-- Tasks
INSERT INTO tasks (title, description, priority, status, assigned_to, project_id, deadline, created_by, is_deleted) VALUES
('Setup project structure', 'Initialize Next.js project with required dependencies', 'high', 'done', 3, 1, '2024-01-10', 2, 0),
('Design homepage mockups', 'Create wireframes and mockups for homepage', 'medium', 'done', 4, 1, '2024-01-20', 2, 0),
('Implement responsive layout', 'Build responsive CSS for all pages', 'high', 'in_progress', 3, 1, '2024-02-15', 2, 0),
('POS API integration', 'Connect to restaurant POS system APIs', 'high', 'review', 3, 2, '2024-04-15', 2, 0),
('Database setup for POS', 'Create database schema for POS data', 'medium', 'done', 3, 2, '2024-03-30', 2, 0),
('User authentication', 'Implement login/signup for support portal', 'high', 'todo', 5, 3, '2024-05-01', 2, 0),
('Ticket creation form', 'Build form for creating support tickets', 'medium', 'in_progress', 5, 3, '2024-04-30', 2, 0),
('Admin dashboard', 'Create admin interface for ticket management', 'high', 'todo', 2, 3, '2024-06-15', 2, 0),
('Code review', 'Review and test all implemented features', 'medium', 'todo', 2, NULL, '2024-05-01', 2, 0),
('Documentation', 'Write user and developer documentation', 'low', 'todo', 4, NULL, '2024-05-15', 2, 0);

-- Attendance records (last 30 days, weekdays only; weekends remain absent by no-record)
-- Status mix:
--   present: regular check-in (08:30-09:20) / check-out (17:00-18:30)
--   late: check-in (09:31-09:45)
--   half_day: shorter shift (< 4 hours)
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status, ip_address, notes)
SELECT
  calc.user_id,
  calc.work_date,
  calc.check_in,
  calc.check_out,
  ROUND(TIMESTAMPDIFF(MINUTE, calc.check_in, calc.check_out) / 60, 2) AS total_hours,
  calc.status,
  CONCAT('192.168.1.', 20 + calc.user_id) AS ip_address,
  CASE
    WHEN calc.status = 'late' THEN 'Late arrival due to traffic'
    WHEN calc.status = 'half_day' THEN 'Half day approved'
    ELSE NULL
  END AS notes
FROM (
  SELECT
    u.id AS user_id,
    DATE_SUB(CURDATE(), INTERVAL d.n DAY) AS work_date,
    CASE
      WHEN MOD(d.n + u.id, 19) = 0 THEN 'half_day'
      WHEN MOD(d.n + u.id * 3, 11) = 0 THEN 'late'
      ELSE 'present'
    END AS status,
    CASE
      WHEN MOD(d.n + u.id, 19) = 0 THEN TIMESTAMP(
        DATE_SUB(CURDATE(), INTERVAL d.n DAY),
        SEC_TO_TIME((9 * 3600) + (5 * 60) + MOD((d.n * 7) + u.id, 20) * 60)
      )
      WHEN MOD(d.n + u.id * 3, 11) = 0 THEN TIMESTAMP(
        DATE_SUB(CURDATE(), INTERVAL d.n DAY),
        SEC_TO_TIME((9 * 3600) + (31 * 60) + MOD(d.n + u.id, 15) * 60)
      )
      ELSE TIMESTAMP(
        DATE_SUB(CURDATE(), INTERVAL d.n DAY),
        SEC_TO_TIME((8 * 3600) + (30 * 60) + MOD((d.n * 5) + u.id, 50) * 60)
      )
    END AS check_in,
    CASE
      WHEN MOD(d.n + u.id, 19) = 0 THEN TIMESTAMP(
        DATE_SUB(CURDATE(), INTERVAL d.n DAY),
        SEC_TO_TIME((12 * 3600) + (20 * 60) + MOD(d.n + u.id, 20) * 60)
      )
      ELSE TIMESTAMP(
        DATE_SUB(CURDATE(), INTERVAL d.n DAY),
        SEC_TO_TIME((17 * 3600) + MOD((d.n * 13) + u.id, 91) * 60)
      )
    END AS check_out
  FROM users u
  JOIN (
    SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
    UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
    UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
    UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24
    UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29
  ) d
  WHERE u.email IN (
    'sarah@ddinfoways.co.nz',
    'mike@ddinfoways.co.nz',
    'emma@ddinfoways.co.nz',
    'david@ddinfoways.co.nz'
  )
  AND WEEKDAY(DATE_SUB(CURDATE(), INTERVAL d.n DAY)) < 5
) calc
ORDER BY calc.user_id, calc.work_date;

-- Leave requests
INSERT INTO leaves (user_id, type, from_date, to_date, reason, status, reviewed_by, reviewed_at) VALUES
(3, 'annual', DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'Family vacation', 'approved', 2, NOW()),
(4, 'sick', DATE_SUB(CURDATE(), INTERVAL 8 DAY), DATE_SUB(CURDATE(), INTERVAL 8 DAY), 'Medical appointment', 'approved', 2, NOW()),
(5, 'personal', DATE_ADD(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Family event', 'pending', NULL, NULL);

-- Leave balances for current year
INSERT INTO leave_balances (user_id, year, annual_total, annual_used, sick_total, sick_used, personal_total, personal_used) VALUES
(2, YEAR(CURDATE()), 20, 0, 10, 0, 5, 0),
(3, YEAR(CURDATE()), 20, 3, 10, 0, 5, 0),
(4, YEAR(CURDATE()), 20, 0, 10, 1, 5, 0),
(5, YEAR(CURDATE()), 20, 0, 10, 0, 5, 0);

-- Performance notes
INSERT INTO performance (user_id, note, rating, added_by, date) VALUES
(3, 'Excellent work on POS integration project. Shows strong technical depth and ownership.', 5, 2, DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
(4, 'Creative design solutions and strong communication with product stakeholders.', 4, 2, DATE_SUB(CURDATE(), INTERVAL 12 DAY)),
(5, 'Reliable support handling and good client communication. Keep improving response speed.', 4, 2, DATE_SUB(CURDATE(), INTERVAL 6 DAY));

-- Salary records (base schema compatible)
INSERT INTO salary (user_id, month, year, amount, status, paid_on, notes) VALUES
(2, MONTH(CURDATE()), YEAR(CURDATE()), 6250.00, 'paid', CURDATE(), 'Monthly payroll processed'),
(3, MONTH(CURDATE()), YEAR(CURDATE()), 5750.00, 'paid', CURDATE(), 'Monthly payroll processed'),
(4, MONTH(CURDATE()), YEAR(CURDATE()), 5200.00, 'unpaid', NULL, 'Pending processing'),
(5, MONTH(CURDATE()), YEAR(CURDATE()), 5100.00, 'partial', CURDATE(), 'Partial payment processed');
