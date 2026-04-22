const pool = require('../../db/connection');
const { createNotification } = require('../utils/notificationHelper');

// Apply for leave (Staff)
const applyLeave = async (req, res) => {
  try {
    const { type, from_date, to_date, reason } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    const [result] = await pool.query(
      'INSERT INTO leaves (user_id, type, from_date, to_date, reason, status) VALUES (?, ?, ?, ?, ?, "pending")',
      [userId, type, from_date, to_date, reason]
    );

    // Notify Admins
    const [admins] = await pool.query('SELECT id FROM users WHERE role = "admin" AND is_deleted = 0');
    for (const admin of admins) {
      await createNotification(
        admin.id,
        'New Leave Application',
        `${userName} has applied for ${type} leave from ${from_date} to ${to_date}.`,
        'info',
        'leave',
        '/leaves'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('ApplyLeave Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Get all leaves (Admin sees all, Staff sees own)
const getAllLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = `
      SELECT l.*, u.name as staff_name, r.name as reviewer_name 
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN users r ON l.reviewed_by = r.id
    `;
    let params = [];

    if (role !== 'admin' && role !== 'team_lead') {
      query += ' WHERE l.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY l.created_at DESC';

    const [rows] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      message: 'Leaves fetched successfully',
      data: rows
    });
  } catch (error) {
    console.error('GetAllLeaves Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Approve/Reject leave (Admin/Team Lead)
const updateLeaveStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'team_lead') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const reviewerId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status', error: 'VALIDATION_FAILED' });
    }

    // Get leave details before updating to know who to notify
    const [leaves] = await pool.query('SELECT user_id, type, from_date FROM leaves WHERE id = ?', [id]);
    if (leaves.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found', error: 'NOT_FOUND' });
    }
    const leave = leaves[0];

    const [result] = await pool.query(
      'UPDATE leaves SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [status, reviewerId, id]
    );

    // Notify the staff member
    await createNotification(
      leave.user_id,
      `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      `Your ${leave.type} leave request starting ${new Date(leave.from_date).toLocaleDateString()} has been ${status}.`,
      status === 'approved' ? 'success' : 'error',
      'leave',
      '/leaves'
    );

    res.status(200).json({
      success: true,
      message: `Leave ${status} successfully`
    });
  } catch (error) {
    console.error('UpdateLeaveStatus Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  applyLeave,
  getAllLeaves,
  updateLeaveStatus
};
