const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedDummyData() {
  let connection;

  try {
    console.log('🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Connected to database successfully');

    console.log('🧹 Clearing existing data...');
    await connection.query(`
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
    `);

    console.log('🌱 Seeding dummy data...');

    // Insert users first
    await connection.query(`
      INSERT INTO users (name, email, password, role, status) VALUES
      ('Admin User', 'admin@ddinfoways.co.nz', '$2b$12$UmZN4tS6N7B3bMtK94NH/.V2pALiZmKWYBB.0f5zW7bgAJjLYs/m2', 'admin', 'active'),
      ('Sarah Johnson', 'sarah@ddinfoways.co.nz', '$2b$12$UmZN4tS6N7B3bMtK94NH/.V2pALiZmKWYBB.0f5zW7bgAJjLYs/m2', 'team_lead', 'active'),
      ('Mike Chen', 'mike@ddinfoways.co.nz', '$2b$12$UmZN4tS6N7B3bMtK94NH/.V2pALiZmKWYBB.0f5zW7bgAJjLYs/m2', 'staff', 'active'),
      ('Emma Wilson', 'emma@ddinfoways.co.nz', '$2b$12$UmZN4tS6N7B3bMtK94NH/.V2pALiZmKWYBB.0f5zW7bgAJjLYs/m2', 'staff', 'active'),
      ('David Brown', 'david@ddinfoways.co.nz', '$2b$12$UmZN4tS6N7B3bMtK94NH/.V2pALiZmKWYBB.0f5zW7bgAJjLYs/m2', 'staff', 'active');
    `);

    // Get the actual user IDs
    const [userRows] = await connection.query('SELECT id, email FROM users ORDER BY id');
    const userMap = {};
    userRows.forEach(user => {
      if (user.email === 'admin@ddinfoways.co.nz') userMap.admin = user.id;
      if (user.email === 'sarah@ddinfoways.co.nz') userMap.sarah = user.id;
      if (user.email === 'mike@ddinfoways.co.nz') userMap.mike = user.id;
      if (user.email === 'emma@ddinfoways.co.nz') userMap.emma = user.id;
      if (user.email === 'david@ddinfoways.co.nz') userMap.david = user.id;
    });

    console.log('User IDs:', userMap);

    // Insert staff profiles
    await connection.query(`
      INSERT INTO staff_profiles (user_id, phone, staff_id, address, department, joining_date, emergency_contact, avatar_url, ird_number, tax_code, kiwisaver_rate, bank_name, bank_account) VALUES
      (${userMap.sarah}, '+64 21 123 4567', 'DD-2025-001', '123 Queen Street, Auckland', 'Development', '2024-01-15', 'John Johnson +64 21 987 6543', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', '123456789', 'M', 3, 'ANZ Bank', '12-3456-7890123-00'),
      (${userMap.mike}, '+64 22 234 5678', 'DD-2025-002', '456 Victoria Street, Wellington', 'Development', '2024-03-01', 'Lisa Chen +64 22 876 5432', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', '234567890', 'M', 4, 'BNZ Bank', '02-4567-8901234-00'),
      (${userMap.emma}, '+64 27 345 6789', 'DD-2025-003', '789 Colombo Street, Christchurch', 'Design', '2024-06-15', 'Robert Wilson +64 27 765 4321', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', '345678901', 'M', 3, 'Westpac', '03-5678-9012345-00'),
      (${userMap.david}, '+64 29 456 7890', 'DD-2025-004', '321 Lambton Quay, Wellington', 'Support', '2024-09-01', 'Mary Brown +64 29 654 3210', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', '456789012', 'M', 6, 'Kiwibank', '38-6789-0123456-00');
    `);

    // Insert projects
    await connection.query(`
      INSERT INTO projects (name, type, status, start_date, end_date, description, created_by) VALUES
      ('DDinfoways Website Redesign', 'website', 'active', '2024-01-01', '2024-12-31', 'Complete redesign of company website with modern UI/UX', ${userMap.sarah}),
      ('Restaurant POS Integration', 'pos_onboarding', 'completed', '2024-02-01', '2024-04-30', 'POS system integration for Green Garden Restaurant', ${userMap.sarah}),
      ('Customer Support Portal', 'support', 'active', '2024-03-01', '2024-08-31', 'Build customer support ticketing system', ${userMap.sarah});
    `);

    // Get the actual project IDs
    const [projectRows] = await connection.query('SELECT id, name FROM projects ORDER BY id');
    const projectMap = {};
    projectRows.forEach(project => {
      if (project.name.includes('Website')) projectMap.website = project.id;
      if (project.name.includes('POS')) projectMap.pos = project.id;
      if (project.name.includes('Support')) projectMap.support = project.id;
    });

    console.log('Project IDs:', projectMap);

    // Insert tasks
    await connection.query(`
      INSERT INTO tasks (title, description, priority, status, assigned_to, project_id, deadline) VALUES
      ('Setup project structure', 'Initialize Next.js project with required dependencies', 'high', 'done', ${userMap.mike}, ${projectMap.website}, '2024-01-10'),
      ('Design homepage mockups', 'Create wireframes and mockups for homepage', 'medium', 'done', ${userMap.emma}, ${projectMap.website}, '2024-01-20'),
      ('Implement responsive layout', 'Build responsive CSS for all pages', 'high', 'in_progress', ${userMap.mike}, ${projectMap.website}, '2024-02-15'),
      ('POS API integration', 'Connect to restaurant POS system APIs', 'high', 'review', ${userMap.mike}, ${projectMap.pos}, '2024-04-15'),
      ('Database setup for POS', 'Create database schema for POS data', 'medium', 'done', ${userMap.mike}, ${projectMap.pos}, '2024-03-30'),
      ('User authentication', 'Implement login/signup for support portal', 'high', 'todo', ${userMap.david}, ${projectMap.support}, '2024-05-01'),
      ('Ticket creation form', 'Build form for creating support tickets', 'medium', 'in_progress', ${userMap.david}, ${projectMap.support}, '2024-04-30'),
      ('Admin dashboard', 'Create admin interface for ticket management', 'high', 'todo', ${userMap.sarah}, ${projectMap.support}, '2024-06-15'),
      ('Code review', 'Review and test all implemented features', 'medium', 'todo', ${userMap.sarah}, NULL, '2024-05-01'),
      ('Documentation', 'Write user and developer documentation', 'low', 'todo', ${userMap.emma}, NULL, '2024-05-15');
    `);

    // Insert attendance records
    const attendanceData = [];
    for (let userId of [userMap.sarah, userMap.mike, userMap.emma, userMap.david]) {
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        attendanceData.push(`(${userId}, '${dateStr}', '${dateStr} 09:00:00', '${dateStr} 17:30:00', 8.5)`);
      }
    }
    if (attendanceData.length > 0) {
      await connection.query(`
        INSERT INTO attendance (user_id, date, check_in, check_out, total_hours) VALUES
        ${attendanceData.slice(0, 50).join(', ')}
      `);
    }

    // Insert leave requests
    await connection.query(`
      INSERT INTO leaves (user_id, type, from_date, to_date, reason, status, reviewed_by) VALUES
      (${userMap.mike}, 'annual', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Family vacation', 'approved', ${userMap.sarah}),
      (${userMap.emma}, 'sick', DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Medical appointment', 'pending', NULL);
    `);

    // Insert performance reviews
    await connection.query(`
      INSERT INTO performance (user_id, note, rating, added_by, date) VALUES
      (${userMap.mike}, 'Excellent work on POS integration project. Shows great technical skills and attention to detail.', 5, ${userMap.sarah}, '2024-04-15'),
      (${userMap.emma}, 'Creative design solutions and good communication with team. Could improve on meeting deadlines.', 4, ${userMap.sarah}, '2024-04-10'),
      (${userMap.david}, 'Good problem-solving skills in support scenarios. Needs to work on response time.', 3, ${userMap.sarah}, '2024-04-05');
    `);

    // Insert sample salary records
    await connection.query(`
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
      (${userMap.sarah}, 4, 2024, 6250.00, 'paid', 'April 2024 payslip', '2024-04-25',
        6000.00, 200.00, 150.00, 100.00,
        5.00, 375.00, 500.00, 6325.00,
        793.13, 180.00, 180.00, 50.26, 0.00, 0.00, 1023.39, 5301.61,
        20.00, 22.00, 2.00,
        25250.00, 3172.52, 22077.48,
        23.50, 8.50,
        'M', '123456789', 3, 'ANZ Bank', '12-3456-7890123-00'),

      (${userMap.mike}, 4, 2024, 5750.00, 'paid', 'April 2024 payslip', '2024-04-25',
        5500.00, 150.00, 125.00, 75.00,
        3.00, 225.00, 300.00, 5375.00,
        672.19, 161.25, 165.00, 43.08, 0.00, 0.00, 876.52, 4498.48,
        19.00, 22.00, 3.00,
        21500.00, 2688.76, 18811.24,
        25.00, 10.00,
        'M', '234567890', 4, 'BNZ Bank', '02-4567-8901234-00');
    `);

    // Insert ID card logs
    await connection.query(`
      INSERT INTO id_card_logs (user_id, generated_by, generated_at, valid_until) VALUES
      (${userMap.sarah}, ${userMap.admin}, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
      (${userMap.mike}, ${userMap.admin}, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
      (${userMap.emma}, ${userMap.admin}, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
      (${userMap.david}, ${userMap.admin}, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR));
    `);

    console.log('✅ Dummy data seeded successfully!');

    // Verify data was inserted
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [staffCount] = await connection.query('SELECT COUNT(*) as count FROM staff_profiles');
    const [taskCount] = await connection.query('SELECT COUNT(*) as count FROM tasks');
    const [salaryCount] = await connection.query('SELECT COUNT(*) as count FROM salary');

    console.log('📊 Data verification:');
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Staff profiles: ${staffCount[0].count}`);
    console.log(`   Tasks: ${taskCount[0].count}`);
    console.log(`   Salary records: ${salaryCount[0].count}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  seedDummyData();
}

module.exports = seedDummyData;