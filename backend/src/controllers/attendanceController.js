const pool = require('../../db/connection');

const NZ_TIMEZONE = 'Pacific/Auckland';

const toNzDateString = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: NZ_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);

const toNzTimeParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone: NZ_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);

  return { hour, minute };
};

const getMonthYearFromQuery = (query, fallbackDate = new Date()) => {
  const nowInNz = {
    month: Number(
      new Intl.DateTimeFormat('en-NZ', { timeZone: NZ_TIMEZONE, month: '2-digit' }).format(fallbackDate)
    ),
    year: Number(
      new Intl.DateTimeFormat('en-NZ', { timeZone: NZ_TIMEZONE, year: 'numeric' }).format(fallbackDate)
    )
  };

  const month = Number(query.month || nowInNz.month);
  const year = Number(query.year || nowInNz.year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { error: 'Month must be between 1 and 12' };
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { error: 'Year is invalid' };
  }

  return { month, year };
};

const getMonthRange = (month, year) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  return { start, end, daysInMonth };
};

const getWeekdayName = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: NZ_TIMEZONE,
    weekday: 'long'
  }).format(date);
};

const getClientIpAddress = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || null;
};

const fetchUserMonthAttendance = async (userId, month, year) => {
  const { start, end, daysInMonth } = getMonthRange(month, year);
  const [rows] = await pool.query(
    `SELECT 
      id,
      user_id,
      DATE_FORMAT(date, '%Y-%m-%d') AS date,
      check_in,
      check_out,
      total_hours,
      status,
      location,
      ip_address,
      notes
    FROM attendance
    WHERE user_id = ? AND date BETWEEN ? AND ?
    ORDER BY date ASC`,
    [userId, start, end]
  );

  const rowsByDate = new Map(rows.map((row) => [row.date, row]));
  const todayNz = toNzDateString();
  const records = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const weekday = getWeekdayName(year, month, day);
    const isWeekend = weekday === 'Saturday' || weekday === 'Sunday';
    const record = rowsByDate.get(date);

    records.push({
      id: record?.id || null,
      user_id: Number(userId),
      date,
      weekday,
      is_weekend: isWeekend,
      is_today: date === todayNz,
      check_in: record?.check_in || null,
      check_out: record?.check_out || null,
      total_hours: record?.total_hours || null,
      status: record?.status || 'absent',
      location: record?.location || null,
      ip_address: record?.ip_address || null,
      notes: record?.notes || null
    });
  }

  return records;
};

const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayNz = toNzDateString();
    const now = new Date();
    const { hour, minute } = toNzTimeParts(now);
    const isLate = hour > 9 || (hour === 9 && minute > 30);
    const status = isLate ? 'late' : 'present';
    const ipAddress = getClientIpAddress(req);

    const [existingRows] = await pool.query(
      'SELECT id FROM attendance WHERE user_id = ? AND date = ? LIMIT 1',
      [userId, todayNz]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today',
        error: 'ALREADY_CHECKED_IN'
      });
    }

    const [insertResult] = await pool.query(
      `INSERT INTO attendance (user_id, date, check_in, status, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, todayNz, now, status, ipAddress]
    );

    const [attendanceRows] = await pool.query(
      `SELECT 
        id,
        user_id,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        check_in,
        check_out,
        total_hours,
        status,
        location,
        ip_address,
        notes
      FROM attendance
      WHERE id = ?`,
      [insertResult.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Check-in successful',
      data: attendanceRows[0]
    });
  } catch (error) {
    console.error('Attendance checkIn error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check in',
      error: 'SERVER_ERROR'
    });
  }
};

const checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayNz = toNzDateString();
    const now = new Date();

    const [attendanceRows] = await pool.query(
      `SELECT 
        id,
        check_in,
        check_out,
        status
      FROM attendance
      WHERE user_id = ? AND date = ?
      ORDER BY id DESC
      LIMIT 1`,
      [userId, todayNz]
    );

    if (attendanceRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No check-in found for today',
        error: 'NOT_CHECKED_IN'
      });
    }

    const todayRecord = attendanceRows[0];
    if (todayRecord.check_out) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today',
        error: 'ALREADY_CHECKED_OUT'
      });
    }

    const workedHours = (now.getTime() - new Date(todayRecord.check_in).getTime()) / (1000 * 60 * 60);
    const totalHours = Number(workedHours.toFixed(2));
    const status = totalHours < 4 ? 'half_day' : (todayRecord.status || 'present');

    await pool.query(
      `UPDATE attendance
       SET check_out = ?, total_hours = ?, status = ?
       WHERE id = ?`,
      [now, totalHours, status, todayRecord.id]
    );

    const [updatedRows] = await pool.query(
      `SELECT 
        id,
        user_id,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        check_in,
        check_out,
        total_hours,
        status,
        location,
        ip_address,
        notes
      FROM attendance
      WHERE id = ?`,
      [todayRecord.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Check-out successful',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Attendance checkOut error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check out',
      error: 'SERVER_ERROR'
    });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const todayNz = toNzDateString();
    const isAdmin = req.user.role === 'admin';

    if (isAdmin) {
      const [rows] = await pool.query(
        `SELECT
          u.id AS user_id,
          u.name,
          u.role,
          u.status AS user_status,
          sp.avatar_url,
          a.id AS attendance_id,
          DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
          a.check_in,
          a.check_out,
          a.total_hours,
          a.status AS attendance_status
        FROM users u
        LEFT JOIN staff_profiles sp ON sp.user_id = u.id
        LEFT JOIN attendance a ON a.user_id = u.id AND a.date = ?
        WHERE u.is_deleted = 0 AND u.role <> 'admin'
        ORDER BY u.name ASC`,
        [todayNz]
      );

      const mappedRows = rows.map((row) => ({
        user_id: row.user_id,
        name: row.name,
        role: row.role,
        user_status: row.user_status,
        avatar_url: row.avatar_url,
        date: row.date || todayNz,
        check_in: row.check_in || null,
        check_out: row.check_out || null,
        total_hours: row.total_hours || null,
        status: row.attendance_status || 'absent'
      }));

      const presentCount = mappedRows.filter((row) => row.status !== 'absent').length;

      return res.status(200).json({
        success: true,
        message: "Today's attendance fetched successfully",
        data: mappedRows,
        meta: {
          date: todayNz,
          total_staff: mappedRows.length,
          present_count: presentCount
        }
      });
    }

    const [rows] = await pool.query(
      `SELECT
        id,
        user_id,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        check_in,
        check_out,
        total_hours,
        status,
        location,
        ip_address,
        notes
      FROM attendance
      WHERE user_id = ? AND date = ?
      LIMIT 1`,
      [req.user.id, todayNz]
    );

    const record = rows[0] || {
      id: null,
      user_id: req.user.id,
      date: todayNz,
      check_in: null,
      check_out: null,
      total_hours: null,
      status: 'absent',
      location: null,
      ip_address: null,
      notes: null
    };

    return res.status(200).json({
      success: true,
      message: "Today's attendance fetched successfully",
      data: record
    });
  } catch (error) {
    console.error('Attendance getTodayAttendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch today attendance',
      error: 'SERVER_ERROR'
    });
  }
};

const getAttendanceByUser = async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);
    if (!Number.isInteger(requestedUserId)) {
      return res.status(400).json({
        success: false,
        message: 'User ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const canView =
      req.user.role === 'admin' ||
      req.user.id === requestedUserId;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this attendance',
        error: 'FORBIDDEN'
      });
    }

    const parsed = getMonthYearFromQuery(req.query);
    if (parsed.error) {
      return res.status(400).json({
        success: false,
        message: parsed.error,
        error: 'VALIDATION_FAILED'
      });
    }

    const records = await fetchUserMonthAttendance(requestedUserId, parsed.month, parsed.year);

    return res.status(200).json({
      success: true,
      message: 'Attendance records fetched successfully',
      data: records,
      meta: {
        user_id: requestedUserId,
        month: parsed.month,
        year: parsed.year
      }
    });
  } catch (error) {
    console.error('Attendance getAttendanceByUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: 'SERVER_ERROR'
    });
  }
};

const getAttendanceSummary = async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);
    if (!Number.isInteger(requestedUserId)) {
      return res.status(400).json({
        success: false,
        message: 'User ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const canView =
      req.user.role === 'admin' ||
      req.user.id === requestedUserId;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this summary',
        error: 'FORBIDDEN'
      });
    }

    const now = new Date();
    const currentMonth = Number(
      new Intl.DateTimeFormat('en-NZ', { timeZone: NZ_TIMEZONE, month: '2-digit' }).format(now)
    );
    const currentYear = Number(
      new Intl.DateTimeFormat('en-NZ', { timeZone: NZ_TIMEZONE, year: 'numeric' }).format(now)
    );

    const records = await fetchUserMonthAttendance(requestedUserId, currentMonth, currentYear);
    const workingDayRecords = records.filter((record) => !record.is_weekend);

    const present = workingDayRecords.filter((record) => record.status === 'present').length;
    const late = workingDayRecords.filter((record) => record.status === 'late').length;
    const halfDay = workingDayRecords.filter((record) => record.status === 'half_day').length;
    const absent = workingDayRecords.filter((record) => record.status === 'absent').length;
    const workingDays = workingDayRecords.length;
    const attendedDays = present + late + halfDay;
    const attendancePercentage = workingDays > 0
      ? Number(((attendedDays / workingDays) * 100).toFixed(2))
      : 0;

    return res.status(200).json({
      success: true,
      message: 'Attendance summary fetched successfully',
      data: {
        user_id: requestedUserId,
        month: currentMonth,
        year: currentYear,
        present,
        absent,
        late,
        half_day: halfDay,
        working_days: workingDays,
        attendance_percentage: attendancePercentage
      }
    });
  } catch (error) {
    console.error('Attendance getAttendanceSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance summary',
      error: 'SERVER_ERROR'
    });
  }
};

const getMonthlyReport = async (req, res) => {
  try {
    const parsed = getMonthYearFromQuery(req.query);
    if (parsed.error) {
      return res.status(400).json({
        success: false,
        message: parsed.error,
        error: 'VALIDATION_FAILED'
      });
    }

    const { month, year } = parsed;
    const { start, end, daysInMonth } = getMonthRange(month, year);

    const [staffRows] = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.role,
        u.status AS user_status,
        sp.avatar_url
      FROM users u
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE u.is_deleted = 0 AND u.role <> 'admin'
      ORDER BY u.name ASC`
    );

    if (staffRows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Monthly attendance report fetched successfully',
        data: [],
        meta: { month, year }
      });
    }

    const [attendanceRows] = await pool.query(
      `SELECT
        user_id,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        status
      FROM attendance
      WHERE date BETWEEN ? AND ?`,
      [start, end]
    );

    const attendanceMap = new Map();
    attendanceRows.forEach((row) => {
      attendanceMap.set(`${row.user_id}-${row.date}`, row.status || 'present');
    });

    const workingDates = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const weekday = getWeekdayName(year, month, day);
      if (weekday !== 'Saturday' && weekday !== 'Sunday') {
        workingDates.push(date);
      }
    }

    const report = staffRows.map((staff) => {
      let present = 0;
      let late = 0;
      let halfDay = 0;
      let absent = 0;

      workingDates.forEach((date) => {
        const status = attendanceMap.get(`${staff.id}-${date}`) || 'absent';
        if (status === 'present') present += 1;
        else if (status === 'late') late += 1;
        else if (status === 'half_day') halfDay += 1;
        else absent += 1;
      });

      const workingDays = workingDates.length;
      const attendancePercentage = workingDays > 0
        ? Number((((present + late + halfDay) / workingDays) * 100).toFixed(2))
        : 0;

      return {
        user_id: staff.id,
        name: staff.name,
        role: staff.role,
        user_status: staff.user_status,
        avatar_url: staff.avatar_url,
        present,
        absent,
        late,
        half_day: halfDay,
        working_days: workingDays,
        attendance_percentage: attendancePercentage
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Monthly attendance report fetched successfully',
      data: report,
      meta: {
        month,
        year,
        total_staff: report.length
      }
    });
  } catch (error) {
    console.error('Attendance getMonthlyReport error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly attendance report',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceByUser,
  getAttendanceSummary,
  getMonthlyReport
};
