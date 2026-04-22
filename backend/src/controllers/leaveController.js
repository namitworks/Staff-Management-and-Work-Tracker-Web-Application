const pool = require('../../db/connection');
const { createNotification } = require('../utils/notificationHelper');

const NZ_TIMEZONE = 'Pacific/Auckland';

const getCurrentNzYear = (date = new Date()) =>
  Number(new Intl.DateTimeFormat('en-NZ', { timeZone: NZ_TIMEZONE, year: 'numeric' }).format(date));

const isDateStringValid = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeDateInput = (value) => new Date(`${value}T00:00:00`);

const calculateWorkingDays = (fromDate, toDate) => {
  const start = normalizeDateInput(fromDate);
  const end = normalizeDateInput(toDate);
  let workingDays = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      workingDays += 1;
    }
  }

  return workingDays;
};

const ensureLeaveBalanceRow = async (userId, year, connection = pool) => {
  await connection.query(
    `INSERT INTO leave_balances (user_id, year)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE updated_at = NOW()`,
    [userId, year]
  );

  const [rows] = await connection.query(
    `SELECT
      id,
      user_id,
      year,
      annual_total,
      annual_used,
      sick_total,
      sick_used,
      personal_total,
      personal_used,
      created_at,
      updated_at
    FROM leave_balances
    WHERE user_id = ? AND year = ?`,
    [userId, year]
  );

  return rows[0];
};

const getLeaveTypeRemaining = (balance, leaveType) => {
  if (leaveType === 'annual') return balance.annual_total - balance.annual_used;
  if (leaveType === 'sick') return balance.sick_total - balance.sick_used;
  if (leaveType === 'personal') return balance.personal_total - balance.personal_used;
  return Number.MAX_SAFE_INTEGER;
};

const applyLeave = async (req, res) => {
  try {
    const { type, from_date: fromDate, to_date: toDate, reason } = req.body;
    const userId = req.user.id;
    const year = getCurrentNzYear();

    if (!['annual', 'sick', 'personal', 'unpaid'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Leave type is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!isDateStringValid(fromDate) || !isDateStringValid(toDate)) {
      return res.status(400).json({
        success: false,
        message: 'From and To dates must be valid date strings',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required (minimum 5 characters)',
        error: 'VALIDATION_FAILED'
      });
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({
        success: false,
        message: 'From date cannot be after To date',
        error: 'VALIDATION_FAILED'
      });
    }

    const totalDays = calculateWorkingDays(fromDate, toDate);
    if (totalDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected range has no working days',
        error: 'VALIDATION_FAILED'
      });
    }

    if (type !== 'unpaid') {
      const balance = await ensureLeaveBalanceRow(userId, year);
      const remaining = getLeaveTypeRemaining(balance, type);

      if (remaining < totalDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${type} leave balance`,
          error: 'INSUFFICIENT_LEAVE_BALANCE'
        });
      }
    }

    const [insertResult] = await pool.query(
      `INSERT INTO leaves (user_id, type, from_date, to_date, reason, status, total_days, leave_year)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [userId, type, fromDate, toDate, reason.trim(), totalDays, year]
    );

    const [leaveRows] = await pool.query(
      `SELECT
        l.id,
        l.user_id,
        l.type,
        l.from_date,
        l.to_date,
        l.reason,
        l.status,
        l.total_days,
        l.leave_year,
        l.admin_note,
        l.reviewed_by,
        l.reviewed_at,
        l.created_at,
        u.name AS staff_name
      FROM leaves l
      JOIN users u ON u.id = l.user_id
      WHERE l.id = ?`,
      [insertResult.insertId]
    );

    const [adminRows] = await pool.query(
      `SELECT id
       FROM users
       WHERE role = 'admin' AND is_deleted = 0`
    );

    const [requesterRows] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
    const requesterName = requesterRows[0]?.name || 'A staff member';

    for (const admin of adminRows) {
      await createNotification(
        admin.id,
        'New Leave Application',
        `${requesterName} applied for ${type} leave from ${fromDate} to ${toDate}.`,
        'info',
        'leave',
        '/leaves'
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leaveRows[0]
    });
  } catch (error) {
    console.error('Leave applyLeave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply leave',
      error: 'SERVER_ERROR'
    });
  }
};

const getLeaves = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;

    const whereParts = ['l.is_deleted = 0'];
    const params = [];

    if (!isAdmin) {
      whereParts.push('l.user_id = ?');
      params.push(userId);
    }

    if (req.query.status) {
      whereParts.push('l.status = ?');
      params.push(req.query.status);
    }

    if (req.query.type) {
      whereParts.push('l.type = ?');
      params.push(req.query.type);
    }

    if (req.query.year) {
      whereParts.push('l.leave_year = ?');
      params.push(Number(req.query.year));
    }

    if (isAdmin && req.query.search) {
      whereParts.push('u.name LIKE ?');
      params.push(`%${req.query.search}%`);
    }

    const whereSql = whereParts.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM leaves l
       JOIN users u ON u.id = l.user_id
       WHERE ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT
        l.id,
        l.user_id,
        l.type,
        l.from_date,
        l.to_date,
        l.reason,
        l.status,
        l.total_days,
        l.leave_year,
        l.admin_note,
        l.reviewed_by,
        l.reviewed_at,
        l.created_at,
        u.name AS staff_name,
        sp.avatar_url AS staff_avatar,
        rv.name AS reviewed_by_name
      FROM leaves l
      JOIN users u ON u.id = l.user_id
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      LEFT JOIN users rv ON rv.id = l.reviewed_by
      WHERE ${whereSql}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      message: 'Leaves fetched successfully',
      data: rows,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Leave getLeaves error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch leaves',
      error: 'SERVER_ERROR'
    });
  }
};

const getLeaveById = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    if (!Number.isInteger(leaveId)) {
      return res.status(400).json({
        success: false,
        message: 'Leave ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [rows] = await pool.query(
      `SELECT
        l.id,
        l.user_id,
        l.type,
        l.from_date,
        l.to_date,
        l.reason,
        l.status,
        l.total_days,
        l.leave_year,
        l.admin_note,
        l.reviewed_by,
        l.reviewed_at,
        l.created_at,
        u.name AS staff_name,
        sp.avatar_url AS staff_avatar,
        rv.name AS reviewed_by_name
      FROM leaves l
      JOIN users u ON u.id = l.user_id
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      LEFT JOIN users rv ON rv.id = l.reviewed_by
      WHERE l.id = ? AND l.is_deleted = 0`,
      [leaveId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
        error: 'NOT_FOUND'
      });
    }

    const leave = rows[0];
    if (req.user.role !== 'admin' && req.user.id !== leave.user_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this leave request',
        error: 'FORBIDDEN'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Leave request fetched successfully',
      data: leave
    });
  } catch (error) {
    console.error('Leave getLeaveById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch leave request',
      error: 'SERVER_ERROR'
    });
  }
};

const approveLeave = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const leaveId = Number(req.params.id);
    const adminId = req.user.id;
    const adminNote = req.body.admin_note ? String(req.body.admin_note).trim() : null;

    if (!Number.isInteger(leaveId)) {
      return res.status(400).json({
        success: false,
        message: 'Leave ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    await connection.beginTransaction();

    const [leaveRows] = await connection.query(
      `SELECT
        id,
        user_id,
        type,
        from_date,
        to_date,
        total_days,
        leave_year,
        status
      FROM leaves
      WHERE id = ? AND is_deleted = 0
      FOR UPDATE`,
      [leaveId]
    );

    if (!leaveRows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
        error: 'NOT_FOUND'
      });
    }

    const leave = leaveRows[0];
    if (leave.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be approved',
        error: 'INVALID_LEAVE_STATUS'
      });
    }

    if (leave.type !== 'unpaid') {
      const balance = await ensureLeaveBalanceRow(leave.user_id, leave.leave_year, connection);
      const remaining = getLeaveTypeRemaining(balance, leave.type);
      if (remaining < leave.total_days) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leave.type} leave balance for approval`,
          error: 'INSUFFICIENT_LEAVE_BALANCE'
        });
      }

      if (leave.type === 'annual') {
        await connection.query(
          'UPDATE leave_balances SET annual_used = annual_used + ? WHERE id = ?',
          [leave.total_days, balance.id]
        );
      } else if (leave.type === 'sick') {
        await connection.query(
          'UPDATE leave_balances SET sick_used = sick_used + ? WHERE id = ?',
          [leave.total_days, balance.id]
        );
      } else if (leave.type === 'personal') {
        await connection.query(
          'UPDATE leave_balances SET personal_used = personal_used + ? WHERE id = ?',
          [leave.total_days, balance.id]
        );
      }
    }

    await connection.query(
      `UPDATE leaves
       SET status = 'approved',
           reviewed_by = ?,
           reviewed_at = NOW(),
           admin_note = ?
       WHERE id = ?`,
      [adminId, adminNote, leaveId]
    );

    const [updatedRows] = await connection.query(
      `SELECT
        l.id,
        l.user_id,
        l.type,
        l.from_date,
        l.to_date,
        l.reason,
        l.status,
        l.total_days,
        l.leave_year,
        l.admin_note,
        l.reviewed_by,
        l.reviewed_at,
        l.created_at,
        u.name AS staff_name,
        rv.name AS reviewed_by_name
      FROM leaves l
      JOIN users u ON u.id = l.user_id
      LEFT JOIN users rv ON rv.id = l.reviewed_by
      WHERE l.id = ?`,
      [leaveId]
    );

    await connection.commit();

    await createNotification(
      leave.user_id,
      'Leave Approved',
      `Your ${leave.type} leave (${leave.from_date} to ${leave.to_date}) has been approved.`,
      'success',
      'leave',
      '/leaves'
    );

    return res.status(200).json({
      success: true,
      message: 'Leave approved successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Leave approveLeave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve leave',
      error: 'SERVER_ERROR'
    });
  } finally {
    connection.release();
  }
};

const rejectLeave = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    const adminId = req.user.id;
    const adminNote = String(req.body.admin_note || '').trim();

    if (!Number.isInteger(leaveId)) {
      return res.status(400).json({
        success: false,
        message: 'Leave ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!adminNote) {
      return res.status(400).json({
        success: false,
        message: 'Admin note is required when rejecting leave',
        error: 'VALIDATION_FAILED'
      });
    }

    const [leaveRows] = await pool.query(
      `SELECT
        id,
        user_id,
        type,
        from_date,
        to_date,
        status
      FROM leaves
      WHERE id = ? AND is_deleted = 0`,
      [leaveId]
    );

    if (!leaveRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
        error: 'NOT_FOUND'
      });
    }

    const leave = leaveRows[0];
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be rejected',
        error: 'INVALID_LEAVE_STATUS'
      });
    }

    await pool.query(
      `UPDATE leaves
       SET status = 'rejected',
           reviewed_by = ?,
           reviewed_at = NOW(),
           admin_note = ?
       WHERE id = ?`,
      [adminId, adminNote, leaveId]
    );

    const [updatedRows] = await pool.query(
      `SELECT
        l.id,
        l.user_id,
        l.type,
        l.from_date,
        l.to_date,
        l.reason,
        l.status,
        l.total_days,
        l.leave_year,
        l.admin_note,
        l.reviewed_by,
        l.reviewed_at,
        l.created_at,
        u.name AS staff_name,
        rv.name AS reviewed_by_name
      FROM leaves l
      JOIN users u ON u.id = l.user_id
      LEFT JOIN users rv ON rv.id = l.reviewed_by
      WHERE l.id = ?`,
      [leaveId]
    );

    await createNotification(
      leave.user_id,
      'Leave Rejected',
      `Your ${leave.type} leave (${leave.from_date} to ${leave.to_date}) has been rejected.`,
      'error',
      'leave',
      '/leaves'
    );

    return res.status(200).json({
      success: true,
      message: 'Leave rejected successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Leave rejectLeave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject leave',
      error: 'SERVER_ERROR'
    });
  }
};

const getLeaveBalance = async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);
    if (!Number.isInteger(requestedUserId)) {
      return res.status(400).json({
        success: false,
        message: 'User ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    if (req.user.role !== 'admin' && req.user.id !== requestedUserId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this leave balance',
        error: 'FORBIDDEN'
      });
    }

    const year = getCurrentNzYear();
    const balance = await ensureLeaveBalanceRow(requestedUserId, year);

    return res.status(200).json({
      success: true,
      message: 'Leave balance fetched successfully',
      data: {
        ...balance,
        annual_remaining: balance.annual_total - balance.annual_used,
        sick_remaining: balance.sick_total - balance.sick_used,
        personal_remaining: balance.personal_total - balance.personal_used
      }
    });
  } catch (error) {
    console.error('Leave getLeaveBalance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balance',
      error: 'SERVER_ERROR'
    });
  }
};

const cancelLeave = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(leaveId)) {
      return res.status(400).json({
        success: false,
        message: 'Leave ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [rows] = await pool.query(
      `SELECT
        id,
        user_id,
        status
      FROM leaves
      WHERE id = ? AND is_deleted = 0`,
      [leaveId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
        error: 'NOT_FOUND'
      });
    }

    const leave = rows[0];
    if (leave.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave request',
        error: 'FORBIDDEN'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be cancelled',
        error: 'INVALID_LEAVE_STATUS'
      });
    }

    await pool.query(
      `UPDATE leaves
       SET status = 'cancelled',
           reviewed_by = NULL,
           reviewed_at = NULL
       WHERE id = ?`,
      [leaveId]
    );

    const [updatedRows] = await pool.query(
      `SELECT
        l.id,
        l.user_id,
        l.type,
        l.from_date,
        l.to_date,
        l.reason,
        l.status,
        l.total_days,
        l.leave_year,
        l.admin_note,
        l.reviewed_by,
        l.reviewed_at,
        l.created_at
      FROM leaves l
      WHERE l.id = ?`,
      [leaveId]
    );

    return res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Leave cancelLeave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel leave',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  applyLeave,
  getLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
  cancelLeave
};
