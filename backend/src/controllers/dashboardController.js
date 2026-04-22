const pool = require('../../db/connection');

const NZ_TIMEZONE = 'Pacific/Auckland';

const formatNzDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone: NZ_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const isStaff = role === 'staff';

    const todayNz = formatNzDate();
    const currentDate = new Date(`${todayNz}T00:00:00`);

    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const monthStartStr = formatNzDate(monthStart);
    const monthEndStr = formatNzDate(monthEnd);

    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = formatNzDate(weekStart);

    const trendStart = new Date(currentDate);
    trendStart.setDate(trendStart.getDate() - 29);
    const trendStartStr = formatNzDate(trendStart);

    const taskScope = isStaff ? 'AND t.assigned_to = ?' : '';
    const taskScopeParams = isStaff ? [userId] : [];
    const attendanceScope = isStaff ? 'AND a.user_id = ?' : '';
    const attendanceScopeParams = isStaff ? [userId] : [];
    const leaveScope = isStaff ? 'AND l.user_id = ?' : '';
    const leaveScopeParams = isStaff ? [userId] : [];

    const [[staffStats]] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive,
        SUM(CASE WHEN DATE(created_at) BETWEEN ? AND ? THEN 1 ELSE 0 END) AS new_this_month
      FROM users
      WHERE is_deleted = 0 AND role != 'admin'`,
      [monthStartStr, monthEndStr]
    );

    const [[presentTodayRow]] = await pool.query(
      `SELECT COUNT(DISTINCT a.user_id) AS count
       FROM attendance a
       WHERE a.date = ? ${attendanceScope}`,
      [todayNz, ...attendanceScopeParams]
    );
    const [[lateTodayRow]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM attendance a
       WHERE a.date = ? AND a.status = 'late' ${attendanceScope}`,
      [todayNz, ...attendanceScopeParams]
    );

    const staffBase = isStaff ? 1 : Number(staffStats.total || 0);
    const presentToday = Number(presentTodayRow.count || 0);
    const lateToday = Number(lateTodayRow.count || 0);
    const absentToday = Math.max(0, staffBase - presentToday);

    const [[presentMonthRow]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM attendance a
       WHERE a.date BETWEEN ? AND ?
         AND a.status IN ('present', 'late', 'half_day')
         ${attendanceScope}`,
      [monthStartStr, monthEndStr, ...attendanceScopeParams]
    );

    const workingDaysInMonth = (() => {
      let total = 0;
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) total += 1;
      }
      return total;
    })();

    const attendanceRateThisMonth =
      staffBase > 0 && workingDaysInMonth > 0
        ? Number(((Number(presentMonthRow.count || 0) / (staffBase * workingDaysInMonth)) * 100).toFixed(2))
        : 0;

    const [[taskCounts]] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS todo,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN t.status = 'review' THEN 1 ELSE 0 END) AS review,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS done,
        SUM(CASE WHEN t.deadline < ? AND t.status != 'done' THEN 1 ELSE 0 END) AS overdue,
        SUM(CASE WHEN t.status = 'done' AND DATE(t.completed_at) >= ? THEN 1 ELSE 0 END) AS completed_this_week
      FROM tasks t
      WHERE t.is_deleted = 0 ${taskScope}`,
      [todayNz, weekStartStr, ...taskScopeParams]
    );

    const [[projectCounts]] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) AS on_hold
      FROM projects
      WHERE COALESCE(is_deleted, 0) = 0`
    );

    const [[leaveCounts]] = await pool.query(
      `SELECT
        SUM(CASE WHEN l.status = 'pending' THEN 1 ELSE 0 END) AS pending_approvals,
        SUM(CASE WHEN l.status = 'approved' AND DATE(l.reviewed_at) BETWEEN ? AND ? THEN 1 ELSE 0 END) AS approved_this_month,
        SUM(CASE WHEN l.status = 'approved' AND ? BETWEEN l.from_date AND l.to_date THEN 1 ELSE 0 END) AS on_leave_today
      FROM leaves l
      WHERE l.is_deleted = 0 ${leaveScope}`,
      [monthStartStr, monthEndStr, todayNz, ...leaveScopeParams]
    );

    const [recentTasks] = await pool.query(
      `SELECT
        t.id,
        t.title,
        t.priority,
        t.status,
        t.deadline,
        t.assigned_to,
        u.name AS assignee_name,
        sp.avatar_url AS assignee_avatar
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN staff_profiles sp ON sp.user_id = t.assigned_to
      WHERE t.is_deleted = 0 ${taskScope}
      ORDER BY t.created_at DESC
      LIMIT 5`,
      taskScopeParams
    );

    const [pendingLeaves] = await pool.query(
      `SELECT
        l.id,
        l.user_id,
        l.type,
        l.from_date,
        l.to_date,
        l.total_days,
        u.name AS staff_name,
        sp.avatar_url AS staff_avatar
      FROM leaves l
      JOIN users u ON u.id = l.user_id
      LEFT JOIN staff_profiles sp ON sp.user_id = l.user_id
      WHERE l.is_deleted = 0
        AND l.status = 'pending'
        ${leaveScope}
      ORDER BY l.created_at DESC`,
      leaveScopeParams
    );

    const [todaysAttendance] = await pool.query(
      `SELECT
        u.id AS user_id,
        u.name,
        sp.avatar_url,
        a.check_in,
        a.check_out,
        COALESCE(a.status, 'absent') AS status
      FROM users u
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      LEFT JOIN attendance a ON a.user_id = u.id AND a.date = ?
      WHERE u.is_deleted = 0
        AND u.role != 'admin'
        ${isStaff ? 'AND u.id = ?' : ''}
      ORDER BY u.name ASC`,
      isStaff ? [todayNz, userId] : [todayNz]
    );

    const [taskTrendRows] = await pool.query(
      `SELECT
        DATE(t.completed_at) AS date,
        COUNT(*) AS completed
      FROM tasks t
      WHERE t.is_deleted = 0
        AND t.status = 'done'
        AND DATE(t.completed_at) BETWEEN ? AND ?
        ${taskScope}
      GROUP BY DATE(t.completed_at)
      ORDER BY DATE(t.completed_at) ASC`,
      [weekStartStr, todayNz, ...taskScopeParams]
    );

    const [attendanceTrendRows] = await pool.query(
      `SELECT
        a.date,
        COUNT(DISTINCT a.user_id) AS present_count
      FROM attendance a
      WHERE a.date BETWEEN ? AND ?
        AND a.status IN ('present', 'late', 'half_day')
        ${attendanceScope}
      GROUP BY a.date
      ORDER BY a.date ASC`,
      [trendStartStr, todayNz, ...attendanceScopeParams]
    );

    return res.status(200).json({
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: {
        role,
        staff: {
          total: isStaff ? 1 : Number(staffStats.total || 0),
          active: isStaff ? 1 : Number(staffStats.active || 0),
          inactive: isStaff ? 0 : Number(staffStats.inactive || 0),
          new_this_month: isStaff ? 0 : Number(staffStats.new_this_month || 0)
        },
        attendance: {
          present_today: presentToday,
          absent_today: absentToday,
          late_today: lateToday,
          attendance_rate_this_month: attendanceRateThisMonth
        },
        tasks: {
          total: Number(taskCounts.total || 0),
          todo: Number(taskCounts.todo || 0),
          in_progress: Number(taskCounts.in_progress || 0),
          review: Number(taskCounts.review || 0),
          done: Number(taskCounts.done || 0),
          overdue: Number(taskCounts.overdue || 0),
          completed_this_week: Number(taskCounts.completed_this_week || 0)
        },
        projects: {
          total: Number(projectCounts.total || 0),
          active: Number(projectCounts.active || 0),
          completed: Number(projectCounts.completed || 0),
          on_hold: Number(projectCounts.on_hold || 0)
        },
        leaves: {
          pending_approvals: Number(leaveCounts.pending_approvals || 0),
          approved_this_month: Number(leaveCounts.approved_this_month || 0),
          on_leave_today: Number(leaveCounts.on_leave_today || 0)
        },
        recent_tasks: recentTasks,
        pending_leaves: pendingLeaves,
        todays_attendance: todaysAttendance,
        task_trend: taskTrendRows.map((row) => ({
          date: row.date,
          completed: Number(row.completed || 0)
        })),
        attendance_trend: attendanceTrendRows.map((row) => ({
          date: row.date,
          present_count: Number(row.present_count || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard getDashboardStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  getDashboardStats
};
