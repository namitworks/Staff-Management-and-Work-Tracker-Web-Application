const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
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

    // Run payslip migration
    console.log('📋 Running payslip migration...');
    const payslipMigrationPath = path.join(__dirname, 'migration_payslip.sql');
    if (fs.existsSync(payslipMigrationPath)) {
      const payslipSql = fs.readFileSync(payslipMigrationPath, 'utf8');
      await connection.query(payslipSql);
      console.log('✅ Payslip migration completed');
    } else {
      console.log('⚠️  Payslip migration file not found, skipping...');
    }

    // Run ID card migration
    console.log('🆔 Running ID card migration...');
    const idcardMigrationPath = path.join(__dirname, 'migration_idcard.sql');
    if (fs.existsSync(idcardMigrationPath)) {
      const idcardSql = fs.readFileSync(idcardMigrationPath, 'utf8');
      await connection.query(idcardSql);
      console.log('✅ ID card migration completed');
    } else {
      console.log('⚠️  ID card migration file not found, skipping...');
    }

    // Verify columns exist
    console.log('🔍 Verifying database schema...');
    const [salaryColumns] = await connection.query('DESCRIBE salary');
    const salaryColumnNames = salaryColumns.map(col => col.Field);

    const requiredSalaryColumns = [
      'basic_salary', 'housing_allowance', 'transport_allowance', 'special_allowance',
      'overtime_hours', 'overtime_amount', 'bonus', 'gross_salary', 'paye_tax',
      'kiwisaver_employee', 'kiwisaver_employer', 'acc_levy', 'student_loan',
      'other_deductions', 'total_deductions', 'net_salary', 'days_worked',
      'working_days', 'leaves_taken', 'ytd_gross', 'ytd_tax', 'ytd_net',
      'annual_leave_balance', 'sick_leave_balance', 'tax_code', 'ird_number',
      'kiwisaver_rate', 'bank_name', 'bank_account', 'pay_date'
    ];

    const missingSalaryColumns = requiredSalaryColumns.filter(col => !salaryColumnNames.includes(col));
    if (missingSalaryColumns.length > 0) {
      console.log('⚠️  Missing salary columns:', missingSalaryColumns.join(', '));
    } else {
      console.log('✅ All salary columns present');
    }

    const [profileColumns] = await connection.query('DESCRIBE staff_profiles');
    const profileColumnNames = profileColumns.map(col => col.Field);

    const requiredProfileColumns = [
      'staff_id', 'ird_number', 'tax_code', 'kiwisaver_rate', 'bank_name', 'bank_account',
      'id_card_generated_at', 'id_card_url', 'valid_until', 'emergency_contact_name',
      'emergency_contact_phone', 'blood_group'
    ];

    const missingProfileColumns = requiredProfileColumns.filter(col => !profileColumnNames.includes(col));
    if (missingProfileColumns.length > 0) {
      console.log('⚠️  Missing profile columns:', missingProfileColumns.join(', '));
    } else {
      console.log('✅ All profile columns present');
    }

    console.log('🎉 All migrations completed successfully!');
    console.log('💡 You can now run: node db/seed_dummy.sql');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
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
  runMigrations();
}

module.exports = runMigrations;