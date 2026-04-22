const pool = require('../../db/connection');

// Check-in
const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Check if already checked in today
    const [rows] = await pool.query('SELECT id FROM attendance WHERE user_id = ? AND date = ?', [userId, today]);
    if (rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Already checked in today', error: 'ALREADY_CHECKED_IN' });
    }

    await pool.query(
      'INSERT INTO attendance (user_id, date, check_in) VALUES (?, ?, ?)',
      [userId, today, now]
    );

    res.status(200).json({ success: true, message: 'Checked in successfully', data: { check_in: now } });
  } catch (error) {
    console.error('CheckIn Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Check-out
const checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Get today's check-in
    const [rows] = await pool.query('SELECT id, check_in FROM attendance WHERE user_id = ? AND date = ?', [userId, today]);
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No check-in found for today', error: 'NOT_CHECKED_IN' });
    }

    const { id, check_in } = rows[0];
    
    // Calculate hours
    const durationMs = now - new Date(check_in);
    const totalHours = (durationMs / (1000 * 60 * 60)).toFixed(2);

    await pool.query(
      'UPDATE attendance SET check_out = ?, total_hours = ? WHERE id = ?',
      [now, totalHours, id]
    );

    res.status(200).json({ success: true, message: 'Checked out successfully', data: { check_out: now, total_hours: totalHours } });
  } catch (error) {
    console.error('CheckOut Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Get today's status
const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [rows] = await pool.query('SELECT * FROM attendance WHERE user_id = ? AND date = ?', [userId, today]);
    
    res.status(200).json({
      success: true,
      data: rows.length > 0 ? rows[0] : null
    });
  } catch (error) {
    console.error('GetTodayStatus Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Get attendance history
const getAttendanceHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Permission check: Admin and Team Lead can see others, staff only themselves
    if (req.user.role !== 'admin' && req.user.role !== 'team_lead' && req.user.id != userId) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC LIMIT 30',
      [userId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('GetAttendanceHistory Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getAttendanceHistory
};
