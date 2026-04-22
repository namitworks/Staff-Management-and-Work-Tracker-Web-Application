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
             p.phone, p.department, p.joining_date, p.avatar_url,
             p.staff_id, p.valid_until, p.id_card_generated_at, p.id_card_status
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

    const [userRows] = await pool.query(
      `SELECT id, name, email, role, status, created_at
       FROM users
       WHERE id = ? AND is_deleted = 0`,
      [id]
    );

    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'Staff not found', error: 'NOT_FOUND' });
    }

    const [profileRows] = await pool.query(
      'SELECT * FROM staff_profiles WHERE user_id = ?',
      [id]
    );

    const profile = profileRows[0] || {};
    const user = userRows[0];

    res.status(200).json({
      success: true,
      message: 'Staff details fetched',
      data: {
        ...profile,
        ...user,
        id: user.id
      }
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
  const connection = await pool.getConnection();
  let transactionStarted = false;
  try {
    const targetUserId = Number(req.params.id);
    const isAdmin = req.user.role === 'admin';
    const isSelf = Number(req.user.id) === targetUserId;

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff id',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile',
        error: 'FORBIDDEN'
      });
    }

    const [columnRows] = await connection.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'staff_profiles'`
    );
    const profileColumns = new Set(columnRows.map((row) => row.COLUMN_NAME));

    const userUpdates = [];
    const userParams = [];
    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      userUpdates.push('name = ?');
      userParams.push(req.body.name.trim());
    }
    if (typeof req.body.email === 'string' && req.body.email.trim()) {
      userUpdates.push('email = ?');
      userParams.push(req.body.email.trim().toLowerCase());
    }
    if (isAdmin && typeof req.body.role === 'string' && req.body.role.trim()) {
      userUpdates.push('role = ?');
      userParams.push(req.body.role.trim());
    }
    if (isAdmin && typeof req.body.status === 'string' && req.body.status.trim()) {
      userUpdates.push('status = ?');
      userParams.push(req.body.status.trim());
    }

    const personalFields = [
      'phone',
      'address',
      'emergency_contact_name',
      'emergency_contact_phone',
      'blood_group',
      'date_of_birth'
    ];
    const adminOnlyFields = [
      'department',
      'joining_date',
      'employment_type',
      'reporting_to',
      'ird_number',
      'tax_code',
      'kiwisaver_rate',
      'bank_name',
      'bank_account_number'
    ];

    const profileUpdates = [];
    const profileParams = [];
    const allowedProfileFields = isAdmin ? [...personalFields, ...adminOnlyFields] : personalFields;

    for (const field of allowedProfileFields) {
      if (!(field in req.body) || !profileColumns.has(field)) continue;
      profileUpdates.push(`${field} = ?`);
      profileParams.push(req.body[field] === '' ? null : req.body[field]);
    }

    if (!userUpdates.length && !profileUpdates.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
        error: 'VALIDATION_FAILED'
      });
    }

    await connection.beginTransaction();
    transactionStarted = true;

    if (userUpdates.length) {
      userParams.push(targetUserId);
      await connection.query(
        `UPDATE users
         SET ${userUpdates.join(', ')}
         WHERE id = ?`,
        userParams
      );
    }

    if (profileUpdates.length) {
      profileParams.push(targetUserId);
      await connection.query(
        `UPDATE staff_profiles
         SET ${profileUpdates.join(', ')}
         WHERE user_id = ?`,
        profileParams
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
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

const uploadAvatar = async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff id',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Avatar file is required',
        error: 'VALIDATION_FAILED'
      });
    }

    const [staffRows] = await pool.query(
      'SELECT user_id FROM staff_profiles WHERE user_id = ?',
      [targetUserId]
    );

    if (!staffRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found',
        error: 'NOT_FOUND'
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await pool.query(
      'UPDATE staff_profiles SET avatar_url = ? WHERE user_id = ?',
      [avatarUrl, targetUserId]
    );

    return res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatar_url: avatarUrl }
    });
  } catch (error) {
    console.error('UploadAvatar Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  uploadAvatar
};
