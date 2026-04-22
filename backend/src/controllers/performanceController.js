const pool = require('../../db/connection');

// Add performance record (Admin)
const addPerformanceRecord = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'team_lead') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }
    const { user_id, note, rating, date } = req.body;
    const adminId = req.user.id;

    const [result] = await pool.query(
      'INSERT INTO performance (user_id, note, rating, added_by, date) VALUES (?, ?, ?, ?, ?)',
      [user_id, note, rating, adminId, date || new Date()]
    );

    res.status(201).json({
      success: true,
      message: 'Performance record added successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('AddPerformance Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Get performance records (Admin or own)
const getPerformanceByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'team_lead' && req.user.id != userId) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }

    const [rows] = await pool.query(
      'SELECT p.*, u.name as added_by_name FROM performance p JOIN users u ON p.added_by = u.id WHERE p.user_id = ? ORDER BY p.date DESC',
      [userId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('GetPerformance Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  addPerformanceRecord,
  getPerformanceByUserId
};
