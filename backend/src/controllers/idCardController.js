const pool = require('../../db/connection');
const { generateStaffId } = require('../utils/generateStaffId');

// Helper to calculate 2 years from today
const getTwoYearsFromToday = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().split('T')[0];
};

const generateIdCard = async (req, res) => {
  try {
    const { user_id, valid_until } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required',
        error: 'VALIDATION_FAILED'
      });
    }

    // Check if staff profile exists
    const [profileRows] = await pool.query(
      'SELECT id, staff_id FROM staff_profiles WHERE user_id = ?',
      [user_id]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found',
        error: 'NOT_FOUND'
      });
    }

    let staffId = profileRows[0].staff_id;

    // Generate new staff_id if null
    if (!staffId) {
      staffId = await generateStaffId();
    }

    const validUntilDate = valid_until || getTwoYearsFromToday();
    const generatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Update staff_profiles - set status to pending until approved
    await pool.query(
      `UPDATE staff_profiles 
       SET staff_id = ?, id_card_generated_at = ?, valid_until = ?, id_card_status = 'pending', id_card_approved_by = NULL, id_card_approved_at = NULL, id_card_rejection_reason = NULL
       WHERE user_id = ?`,
      [staffId, generatedAt, validUntilDate, user_id]
    );

    // Insert into id_card_logs
    await pool.query(
      `INSERT INTO id_card_logs (user_id, generated_by, valid_until) 
       VALUES (?, ?, ?)`,
      [user_id, req.user.id, validUntilDate]
    );

    // Fetch updated data to return
    const [staffData] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, 
              s.department, s.staff_id, s.phone, s.avatar_url, 
              s.joining_date, s.valid_until, s.blood_group,
              s.emergency_contact_name, s.emergency_contact_phone,
              s.id_card_generated_at, s.id_card_status, s.id_card_approved_by, s.id_card_approved_at, s.id_card_rejection_reason
       FROM users u
       JOIN staff_profiles s ON u.id = s.user_id
       WHERE u.id = ? AND u.is_deleted = 0`,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      message: 'ID card generated successfully',
      data: staffData[0]
    });

  } catch (error) {
    console.error('Error generating ID card:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate ID card',
      error: 'SERVER_ERROR'
    });
  }
};

const getStaffIdCardData = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permission: admin or own staff
    if (req.user.role !== 'admin' && req.user.id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to do this',
        error: 'FORBIDDEN'
      });
    }

    const [staffData] = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, 
                s.department, s.staff_id, s.phone, s.avatar_url, 
                s.joining_date, s.valid_until, s.blood_group,
                s.emergency_contact_name, s.emergency_contact_phone,
                s.id_card_generated_at, s.id_card_status, s.id_card_approved_by, s.id_card_approved_at, s.id_card_rejection_reason
         FROM users u
         JOIN staff_profiles s ON u.id = s.user_id
         WHERE u.id = ? AND u.is_deleted = 0`,
        [userId]
    );

    if (staffData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
        error: 'NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'ID card data fetched successfully',
      data: staffData[0]
    });

  } catch (error) {
    console.error('Error fetching ID card data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ID card data',
      error: 'SERVER_ERROR'
    });
  }
};

const getIdCardHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const [logs] = await pool.query(
      `SELECT l.id, l.generated_at, l.valid_until, u.name as generated_by_name
       FROM id_card_logs l
       JOIN users u ON l.generated_by = u.id
       WHERE l.user_id = ? AND l.is_deleted = 0
       ORDER BY l.generated_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'ID card history fetched successfully',
      data: logs
    });

  } catch (error) {
    console.error('Error fetching ID card history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ID card history',
      error: 'SERVER_ERROR'
    });
  }
};

// Approve or reject an ID card (admin or team_lead)
const approveIdCard = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body; // action: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action', error: 'VALIDATION_FAILED' });
    }

    // Only admin or team_lead allowed
    if (req.user.role !== 'admin' && req.user.role !== 'team_lead') {
      return res.status(403).json({ success: false, message: 'You do not have permission to do this', error: 'FORBIDDEN' });
    }

    const approvedBy = req.user.id;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (action === 'approved') {
      await pool.query(
        `UPDATE staff_profiles SET id_card_status = 'approved', id_card_approved_by = ?, id_card_approved_at = ?, id_card_rejection_reason = NULL WHERE user_id = ?`,
        [approvedBy, now, userId]
      );
    } else {
      await pool.query(
        `UPDATE staff_profiles SET id_card_status = 'rejected', id_card_approved_by = ?, id_card_approved_at = ?, id_card_rejection_reason = ? WHERE user_id = ?`,
        [approvedBy, now, reason || null, userId]
      );
    }

    return res.status(200).json({ success: true, message: `ID card ${action} successfully` });
  } catch (error) {
    console.error('Error approving/rejecting ID card:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  generateIdCard,
  getStaffIdCardData,
  getIdCardHistory
};

