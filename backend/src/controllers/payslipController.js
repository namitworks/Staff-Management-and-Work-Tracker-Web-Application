const pool = require('../../db/connection');

// NZ PAYE Tax Brackets 2025-26 (Annual)
const TAX_BRACKETS = [
  { min: 0, max: 14000, rate: 0.105 },
  { min: 14001, max: 48000, rate: 0.175 },
  { min: 48001, max: 70000, rate: 0.30 },
  { min: 70001, max: 180000, rate: 0.33 },
  { min: 180001, max: Infinity, rate: 0.39 }
];

// Calculate PAYE tax based on annual income
const calculatePAYE = (annualIncome) => {
  let tax = 0;
  let remainingIncome = annualIncome;

  for (const bracket of TAX_BRACKETS) {
    if (remainingIncome <= 0) break;

    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min + 1);
    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  return tax / 12; // Convert to monthly
};

// Generate payslip with calculations
const generatePayslip = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'team_lead') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }

    const {
      user_id,
      month,
      year,
      basic_salary,
      housing_allowance = 0,
      transport_allowance = 0,
      special_allowance = 0,
      overtime_hours = 0,
      bonus = 0,
      kiwisaver_rate = 0,
      tax_code,
      days_worked = 0,
      working_days = 0,
      leaves_taken = 0
    } = req.body;

    // Get staff profile data
    const [profileRows] = await pool.query(
      'SELECT COALESCE(ird_number, NULL) as ird_number, COALESCE(tax_code, NULL) as tax_code, COALESCE(kiwisaver_rate, 0) as kiwisaver_rate, COALESCE(bank_name, NULL) as bank_name, COALESCE(bank_account, NULL) as bank_account FROM staff_profiles WHERE user_id = ?',
      [user_id]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff profile not found', error: 'NOT_FOUND' });
    }

    const profile = profileRows[0];

    // Calculate earnings
    const overtime_rate = basic_salary / (working_days * 8); // Assuming 8 hours per day
    const overtime_amount = overtime_hours * overtime_rate;
    const gross_salary = basic_salary + housing_allowance + transport_allowance + special_allowance + overtime_amount + bonus;

    // Calculate deductions
    const acc_levy = gross_salary * 0.0139; // 1.39% ACC Levy
    const kiwisaver_employee = basic_salary * (kiwisaver_rate / 100);
    const kiwisaver_employer = basic_salary * 0.03; // 3% employer contribution
    const student_loan = 0; // Not provided in input, default to 0
    const other_deductions = 0; // Not provided in input, default to 0

    // Calculate PAYE tax (annual then monthly)
    const annual_gross = gross_salary * 12;
    const annual_paye = calculatePAYE(annual_gross);
    const paye_tax = annual_paye;

    const total_deductions = paye_tax + kiwisaver_employee + acc_levy + student_loan + other_deductions;
    const net_salary = gross_salary - total_deductions;

    // Calculate YTD values (sum of previous months in same year)
    const [ytdRows] = await pool.query(
      'SELECT SUM(gross_salary) as ytd_gross, SUM(paye_tax) as ytd_tax, SUM(net_salary) as ytd_net FROM salary WHERE user_id = ? AND year = ? AND month < ?',
      [user_id, year, month]
    );

    const ytd_gross = (ytdRows[0].ytd_gross || 0) + gross_salary;
    const ytd_tax = (ytdRows[0].ytd_tax || 0) + paye_tax;
    const ytd_net = (ytdRows[0].ytd_net || 0) + net_salary;

    // Get leave balances (simplified - in real app would calculate from leave records)
    const annual_leave_balance = 25; // Default annual leave
    const sick_leave_balance = 10; // Default sick leave

    // Insert payslip record
    const [result] = await pool.query(`
      INSERT INTO salary (
        user_id, month, year, amount, status, notes, pay_date,
        basic_salary, housing_allowance, transport_allowance, special_allowance,
        overtime_hours, overtime_amount, bonus, gross_salary,
        paye_tax, kiwisaver_employee, kiwisaver_employer, acc_levy, student_loan, other_deductions, total_deductions, net_salary,
        days_worked, working_days, leaves_taken,
        ytd_gross, ytd_tax, ytd_net,
        annual_leave_balance, sick_leave_balance,
        tax_code, ird_number, kiwisaver_rate, bank_name, bank_account
      ) VALUES (?, ?, ?, ?, 'paid', 'Generated payslip', CURDATE(),
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?
      )`, [
        user_id, month, year, net_salary,
        basic_salary, housing_allowance, transport_allowance, special_allowance,
        overtime_hours, overtime_amount, bonus, gross_salary,
        paye_tax, kiwisaver_employee, kiwisaver_employer, acc_levy, student_loan, other_deductions, total_deductions, net_salary,
        days_worked, working_days, leaves_taken,
        ytd_gross, ytd_tax, ytd_net,
        annual_leave_balance, sick_leave_balance,
        tax_code || profile.tax_code, profile.ird_number, kiwisaver_rate || profile.kiwisaver_rate, profile.bank_name, profile.bank_account
      ]);

    // Get the complete payslip data
    const [payslipRows] = await pool.query(`
      SELECT s.*, u.name, u.email, p.staff_id, p.department
      FROM salary s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN staff_profiles p ON u.id = p.user_id
      WHERE s.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Payslip generated successfully',
      data: payslipRows[0]
    });

  } catch (error) {
    console.error('GeneratePayslip Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Get single payslip by ID
const getPayslip = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT s.*, u.name, u.email, COALESCE(p.staff_id, NULL) as staff_id, p.department
      FROM salary s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN staff_profiles p ON u.id = p.user_id
      WHERE s.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payslip not found', error: 'NOT_FOUND' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'team_lead' && req.user.id != rows[0].user_id) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }

    res.status(200).json({
      success: true,
      message: 'Payslip retrieved successfully',
      data: rows[0]
    });

  } catch (error) {
    console.error('GetPayslip Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Get all payslips for a staff member
const getPayslipsByStaff = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'team_lead' && req.user.id != userId) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }

    const [rows] = await pool.query(`
      SELECT s.*, u.name, u.email, COALESCE(p.staff_id, NULL) as staff_id, p.department
      FROM salary s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN staff_profiles p ON u.id = p.user_id
      WHERE s.user_id = ?
      ORDER BY s.year DESC, s.month DESC
    `, [userId]);

    res.status(200).json({
      success: true,
      message: 'Payslips retrieved successfully',
      data: rows
    });

  } catch (error) {
    console.error('GetPayslipsByStaff Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Delete payslip (Admin only)
const deletePayslip = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }

    const { id } = req.params;

    // Check if payslip exists
    const [existingRows] = await pool.query('SELECT id FROM salary WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payslip not found', error: 'NOT_FOUND' });
    }

    // Delete the payslip
    await pool.query('DELETE FROM salary WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Payslip deleted successfully'
    });

  } catch (error) {
    console.error('DeletePayslip Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  generatePayslip,
  getPayslip,
  getPayslipsByStaff,
  deletePayslip
};