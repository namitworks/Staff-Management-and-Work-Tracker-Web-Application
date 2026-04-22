const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../../db/connection');

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND is_deleted = 0', [email]);
    if (rows.length === 0) {
      console.log(`Login failed: User with email ${email} not found.`);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
        error: 'AUTH_FAILED'
      });
    }

    const user = rows[0];

    // Check status
    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
        error: 'FORBIDDEN'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`Login failed: Password mismatch for user ${email}.`);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
        error: 'AUTH_FAILED'
      });
    }

    // Generate Tokens
    const payload = { id: user.id, email: user.email, role: user.role };
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
    
    // In a real prod scenario, refresh token goes to DB. 
    // Simplified for now based on rules unless DB schema mandates storing it (not in schema.sql yet).
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: 'SERVER_ERROR'
    });
  }
};

// Refresh Token
const refresh = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required', error: 'UNAUTHORISED' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: { accessToken }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: 'TOKEN_INVALID'
    });
  }
};

// Logout
const logout = (req, res) => {
  // If refresh tokens were in DB, delete them here.
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Get Me
const me = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.status, p.avatar_url 
      FROM users u
      LEFT JOIN staff_profiles p ON u.id = p.user_id
      WHERE u.id = ? AND u.is_deleted = 0
    `, [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found', error: 'NOT_FOUND' });
    }

    res.status(200).json({
      success: true,
      message: 'User fetched',
      data: rows[0]
    });
  } catch (error) {
    console.error('Me Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { name, email, phone, address, department } = req.body;
    const userId = req.user.id;

    // Update basic info
    await connection.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, userId]
    );

    // Update profile info
    await connection.query(
      'UPDATE staff_profiles SET phone = ?, address = ?, department = ? WHERE user_id = ?',
      [phone, address, department, userId]
    );

    await connection.commit();
    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('UpdateProfile Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  } finally {
    connection.release();
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Current password incorrect', error: 'AUTH_FAILED' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('ChangePassword Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  login,
  refresh,
  logout,
  me,
  updateProfile,
  changePassword
};
