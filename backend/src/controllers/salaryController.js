const pool = require('../../db/connection');

// Add salary record (Admin only)
const addSalaryRecord = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'team_lead') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }
    const { user_id, month, year, amount, status, notes } = req.body;

    const [result] = await pool.query(
      'INSERT INTO salary (user_id, month, year, amount, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, month, year, amount, status || 'unpaid', notes]
    );

    res.status(201).json({
      success: true,
      message: 'Salary record added successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('AddSalary Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Get salary history
const getSalaryByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== 'admin' && req.user.id != userId) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM salary WHERE user_id = ? ORDER BY year DESC, month DESC',
      [userId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('GetSalary Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Update salary status (Admin only)
const updateSalaryStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'team_lead') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }
    const { id } = req.params;
    const { status, paid_on } = req.body;

    await pool.query(
      'UPDATE salary SET status = ?, paid_on = ? WHERE id = ?',
      [status, paid_on || (status === 'paid' ? new Date() : null), id]
    );

    res.status(200).json({ success: true, message: 'Salary status updated' });
  } catch (error) {
    console.error('UpdateSalary Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  addSalaryRecord,
  getSalaryByUserId,
  updateSalaryStatus
};
