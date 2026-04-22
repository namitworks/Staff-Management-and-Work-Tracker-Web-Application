const pool = require('../../db/connection');
const { generateStaffId } = require('../utils/generateStaffId');
const { createNotification } = require('../utils/notificationHelper');

// Helper to calculate 2 years from today
const getTwoYearsFromToday = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().split('T')[0];
};

const fetchStaffIdCardDataByUserId = async (userId) => {
  const [rows] = await pool.query(
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

  return rows[0] || null;
};

const requestIdCard = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admins can generate ID cards directly',
        error: 'VALIDATION_FAILED'
      });
    }

    const requestedUserId = Number(req.body.user_id || req.user.id);

    if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'user_id must be a valid positive number',
        error: 'VALIDATION_FAILED'
      });
    }

    if (Number(req.user.id) !== requestedUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only request an ID card for your own profile',
        error: 'FORBIDDEN'
      });
    }

    const existingData = await fetchStaffIdCardDataByUserId(requestedUserId);

    if (!existingData) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found',
        error: 'NOT_FOUND'
      });
    }

    if (existingData.id_card_generated_at && existingData.id_card_status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'ID card is already generated for your profile',
        error: 'ID_CARD_ALREADY_GENERATED'
      });
    }

    if (existingData.id_card_status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Your ID card request is already pending approval',
        error: 'ID_CARD_REQUEST_PENDING'
      });
    }

    await pool.query(
      `UPDATE staff_profiles
       SET id_card_status = 'pending',
           id_card_rejection_reason = NULL,
           id_card_approved_by = NULL,
           id_card_approved_at = NULL
       WHERE user_id = ?`,
      [requestedUserId]
    );

    const [adminRows] = await pool.query(
      `SELECT id
       FROM users
       WHERE role = 'admin' AND is_deleted = 0`
    );

    for (const admin of adminRows) {
      await createNotification(
        admin.id,
        'ID Card Request Received',
        `${existingData.name} requested ID card generation.`,
        'info',
        'system',
        '/staff/idcards'
      );
    }

    const updatedData = await fetchStaffIdCardDataByUserId(requestedUserId);

    return res.status(200).json({
      success: true,
      message: 'ID card request submitted successfully',
      data: updatedData
    });
  } catch (error) {
    console.error('POST /api/idcards/request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit ID card request',
      error: 'SERVER_ERROR'
    });
  }
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

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to generate ID cards',
        error: 'FORBIDDEN'
      });
    }

    const requestedUserId = Number(user_id);
    if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'user_id must be a valid positive number',
        error: 'VALIDATION_FAILED'
      });
    }

    const [profileRows] = await pool.query(
      'SELECT id, staff_id FROM staff_profiles WHERE user_id = ?',
      [requestedUserId]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found',
        error: 'NOT_FOUND'
      });
    }

    let staffId = profileRows[0].staff_id;

    if (!staffId) {
      staffId = await generateStaffId();
    }

    const validUntilDate = valid_until || getTwoYearsFromToday();
    const generatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      `UPDATE staff_profiles
       SET staff_id = ?,
           id_card_generated_at = ?,
           valid_until = ?,
           id_card_status = 'approved',
           id_card_approved_by = ?,
           id_card_approved_at = ?,
           id_card_rejection_reason = NULL
       WHERE user_id = ?`,
      [staffId, generatedAt, validUntilDate, req.user.id, generatedAt, requestedUserId]
    );

    await pool.query(
      `INSERT INTO id_card_logs (user_id, generated_by, valid_until)
       VALUES (?, ?, ?)`,
      [requestedUserId, req.user.id, validUntilDate]
    );

    const updatedData = await fetchStaffIdCardDataByUserId(requestedUserId);

    if (updatedData && Number(updatedData.id) !== Number(req.user.id)) {
      await createNotification(
        requestedUserId,
        'ID Card Generated',
        'Your ID card has been generated and is ready for download.',
        'success',
        'system',
        `/staff/${requestedUserId}`
      );
    }

    return res.status(200).json({
      success: true,
      message: 'ID card generated successfully',
      data: updatedData
    });
  } catch (error) {
    console.error('POST /api/idcards/generate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate ID card',
      error: 'SERVER_ERROR'
    });
  }
};

const rejectIdCardRequest = async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);
    const reason = String(req.body.reason || '').trim();

    if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
        error: 'VALIDATION_FAILED'
      });
    }

    const staffData = await fetchStaffIdCardDataByUserId(requestedUserId);
    if (!staffData) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found',
        error: 'NOT_FOUND'
      });
    }

    if (staffData.id_card_generated_at) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject a request for an already generated ID card',
        error: 'INVALID_ID_CARD_STATE'
      });
    }

    if (staffData.id_card_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be rejected',
        error: 'INVALID_ID_CARD_STATE'
      });
    }

    const reviewedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.query(
      `UPDATE staff_profiles
       SET id_card_status = 'rejected',
           id_card_rejection_reason = ?,
           id_card_approved_by = ?,
           id_card_approved_at = ?
       WHERE user_id = ?`,
      [reason, req.user.id, reviewedAt, requestedUserId]
    );

    await createNotification(
      requestedUserId,
      'ID Card Request Rejected',
      `Your ID card request was rejected. Reason: ${reason}`,
      'error',
      'system',
      `/staff/${requestedUserId}`
    );

    const updatedData = await fetchStaffIdCardDataByUserId(requestedUserId);

    return res.status(200).json({
      success: true,
      message: 'ID card request rejected successfully',
      data: updatedData
    });
  } catch (error) {
    console.error('PUT /api/idcards/:userId/reject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject ID card request',
      error: 'SERVER_ERROR'
    });
  }
};

const getStaffIdCardData = async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);

    if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id',
        error: 'VALIDATION_FAILED'
      });
    }

    if (req.user.role !== 'admin' && Number(req.user.id) !== requestedUserId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to do this',
        error: 'FORBIDDEN'
      });
    }

    const staffData = await fetchStaffIdCardDataByUserId(requestedUserId);

    if (!staffData) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
        error: 'NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'ID card data fetched successfully',
      data: staffData
    });
  } catch (error) {
    console.error('GET /api/idcards/:userId error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ID card data',
      error: 'SERVER_ERROR'
    });
  }
};

const getIdCardHistory = async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);

    if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id',
        error: 'VALIDATION_FAILED'
      });
    }

    if (req.user.role !== 'admin' && Number(req.user.id) !== requestedUserId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this history',
        error: 'FORBIDDEN'
      });
    }

    const [logs] = await pool.query(
      `SELECT l.id, l.generated_at, l.valid_until, u.name AS generated_by_name
       FROM id_card_logs l
       JOIN users u ON l.generated_by = u.id
       WHERE l.user_id = ? AND l.is_deleted = 0
       ORDER BY l.generated_at DESC`,
      [requestedUserId]
    );

    return res.status(200).json({
      success: true,
      message: 'ID card history fetched successfully',
      data: logs
    });
  } catch (error) {
    console.error('GET /api/idcards/history/:userId error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ID card history',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  requestIdCard,
  generateIdCard,
  rejectIdCardRequest,
  getStaffIdCardData,
  getIdCardHistory
};
