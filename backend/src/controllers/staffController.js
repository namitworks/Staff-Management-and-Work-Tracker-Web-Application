const pool = require('../../db/connection');
const bcrypt = require('bcrypt');
const generateStaffId = require('../utils/generateStaffId');

// Get all staff (Admin / Team Lead only)
const getAllStaff = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'team_lead') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.status, u.created_at,
             p.phone, p.department, p.joining_date, p.avatar_url
      FROM users u
      LEFT JOIN staff_profiles p ON u.id = p.user_id
      WHERE u.is_deleted = 0 AND u.role != 'admin'
      ORDER BY u.created_at DESC
    `);

    res.status(200).json({
      success: true,
      message: 'Staff fetched successfully',
      data: rows
    });
  } catch (error) {
    console.error('GetAllStaff Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Get staff by ID
const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permission: Admin and Team Lead can see all, staff can only see themselves
    if (req.user.role !== 'admin' && req.user.role !== 'team_lead' && req.user.id != id) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }

    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.status, u.created_at,
             p.phone, p.address, p.department, p.joining_date, p.emergency_contact, p.avatar_url
      FROM users u
      LEFT JOIN staff_profiles p ON u.id = p.user_id
      WHERE u.id = ? AND u.is_deleted = 0
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff not found', error: 'NOT_FOUND' });
    }

    res.status(200).json({
      success: true,
      message: 'Staff details fetched',
      data: rows[0]
    });
  } catch (error) {
    console.error('GetStaffById Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Create staff (Admin only)
const createStaff = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, email, password, role, phone, address, department, joining_date } = req.body;

    // Check if email exists
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Email already exists', error: 'DUPLICATE_EMAIL' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'Staff@123', 12);

    // Insert user
    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'staff']
    );

    const userId = userResult.insertId;

    const staffId = await generateStaffId();

    // Insert profile
    await connection.query(
      'INSERT INTO staff_profiles (user_id, staff_id, phone, address, department, joining_date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, staffId, phone, address, department, joining_date || new Date()]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: { id: userId, staff_id: staffId, name, email, role }
    });

  } catch (error) {
    await connection.rollback();
    console.error('CreateStaff Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  } finally {
    connection.release();
  }
};

// Update staff (Admin only)
const updateStaff = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, email, role, status, phone, address, department, joining_date } = req.body;

    // Update user
    await connection.query(
      'UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?',
      [name, email, role, status, id]
    );

    // Update profile
    await connection.query(
      'UPDATE staff_profiles SET phone = ?, address = ?, department = ?, joining_date = ? WHERE user_id = ?',
      [phone, address, department, joining_date, id]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Staff updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('UpdateStaff Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  } finally {
    connection.release();
  }
};

// Soft delete staff (Admin only)
const deleteStaff = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN' });
    }
    const { id } = req.params;
    await pool.query('UPDATE users SET is_deleted = 1 WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully (soft delete)'
    });
  } catch (error) {
    console.error('DeleteStaff Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff
};
