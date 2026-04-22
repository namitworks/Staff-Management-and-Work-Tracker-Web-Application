const pool = require('../../db/connection');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { id: userId, role } = req.user;
    const isStaff = role === 'staff';

    // 1. Total Active Staff (Only for Admin/TeamLead)
    let totalStaff = 0;
    if (!isStaff) {
      const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_deleted = 0 AND role != "admin"');
      totalStaff = count;
    }

    // 2. Tasks Global vs Personal
    const taskQueryBase = isStaff ? 'AND assigned_to = ?' : '';
    const taskQueryParams = isStaff ? [userId] : [];

    const [[{ pendingTasks }]] = await pool.query(`SELECT COUNT(*) as pendingTasks FROM tasks WHERE is_deleted = 0 AND status != "done" ${taskQueryBase}`, taskQueryParams);
    const [[{ doneTasks }]] = await pool.query(`SELECT COUNT(*) as doneTasks FROM tasks WHERE is_deleted = 0 AND status = "done" AND DATE(updated_at) = ? ${taskQueryBase}`, [today, ...taskQueryParams]);

    // 3. Present Today (Global count for Admin, 1/0 for Staff)
    const [[{ presentToday }]] = await pool.query(`SELECT COUNT(DISTINCT user_id) as presentToday FROM attendance WHERE date = ? ${isStaff ? 'AND user_id = ?' : ''}`, [today, ...taskQueryParams]);

    // 4. Pending Leaves (Global for Admin, Personal for Staff)
    const [[{ pendingLeaves }]] = await pool.query(`SELECT COUNT(*) as pendingLeaves FROM leaves WHERE status = "pending" ${isStaff ? 'AND staff_id = ?' : ''}`, taskQueryParams);

    // 5. Recent Tasks Table
    const [recentTasks] = await pool.query(`
      SELECT t.id, t.title, t.status, t.priority, u.name as assignee 
      FROM tasks t 
      LEFT JOIN users u ON t.assigned_to = u.id 
      WHERE t.is_deleted = 0 ${isStaff ? 'AND t.assigned_to = ?' : ''}
      ORDER BY t.created_at DESC LIMIT 5
    `, taskQueryParams);

    // 6. Task Pipeline Data (for chart)
    const [taskStats] = await pool.query(`
      SELECT status as name, COUNT(*) as value 
      FROM tasks 
      WHERE is_deleted = 0 ${isStaff ? 'AND assigned_to = ?' : ''}
      GROUP BY status
    `, taskQueryParams);
    
    // Map status keys to human readable names for the chart
    const statusMap = { 'todo': 'To Do', 'in_progress': 'In Progress', 'review': 'Review', 'done': 'Done' };
    const taskPipeline = taskStats.map(row => ({
      name: statusMap[row.name] || row.name,
      value: row.value
    }));

    // 7. Attendance Trends (Last 7 days)
    // Global for admin, personal for staff
    const [attendanceTrends] = await pool.query(`
      SELECT DATE_FORMAT(date, '%b %d') as name, COUNT(*) as present 
      FROM attendance 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${isStaff ? 'AND user_id = ?' : ''}
      GROUP BY date 
      ORDER BY date ASC
    `, taskQueryParams);

    res.status(200).json({
      success: true,
      data: {
        totalStaff: isStaff ? 1 : totalStaff,
        tasksToday: pendingTasks + doneTasks,
        pendingTasks,
        doneTasks,
        presentToday,
        pendingLeaves,
        recentTasks,
        taskPipeline,
        attendanceTrends,
        role
      }
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  getDashboardStats
};
