const pool = require('../../db/connection');

// Get all tasks (Filter by project_id and/or assigned_to)
const getAllTasks = async (req, res) => {
  try {
    const { project_id } = req.query;
    const userId = req.user.id;
    const role = req.user.role;

    let query = `
      SELECT t.*, u.name as assignee_name, sp.avatar_url, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.is_deleted = 0
    `;
    const params = [];

    if (project_id) {
      query += ' AND t.project_id = ?';
      params.push(project_id);
    }

    if (role === 'staff') {
      query += ' AND t.assigned_to = ?';
      params.push(userId);
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await pool.query(query, params);

    // Fetch checklists for all tasks
    if (rows.length > 0) {
      const taskIds = rows.map(r => r.id);
      const [checklists] = await pool.query(
        'SELECT * FROM task_checklists WHERE task_id IN (?)',
        [taskIds]
      );
      
      // Map checklists to tasks
      const checklistMap = {};
      checklists.forEach(item => {
        if (!checklistMap[item.task_id]) checklistMap[item.task_id] = [];
        checklistMap[item.task_id].push(item);
      });

      rows.forEach(task => {
        task.checklist = checklistMap[task.id] || [];
      });
    }

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('GetAllTasks Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Create a new task
const createTask = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { title, description, priority, assigned_to, project_id, deadline, checklist } = req.body;
    const adminId = req.user.id;

    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO tasks (title, description, priority, assigned_to, project_id, deadline, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, priority || 'medium', assigned_to, project_id, deadline, adminId]
    );

    const taskId = result.insertId;

    if (checklist && Array.isArray(checklist) && checklist.length > 0) {
      const values = checklist.map(item => [taskId, item.text]);
      await connection.query(
        'INSERT INTO task_checklists (task_id, item) VALUES ?',
        [values]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { id: taskId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('CreateTask Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  } finally {
    connection.release();
  }
};

// Update task status (Kanban move)
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role } = req.user;

    // Team leads and admins can update any task. Staff can only update their own.
    // We enforce this logically:
    if (role === 'staff') {
        const [task] = await pool.query('SELECT assigned_to FROM tasks WHERE id = ?', [id]);
        if (task.length === 0 || task[0].assigned_to !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to move this task' });
        }
    }

    await pool.query(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, id]
    );

    res.status(200).json({ success: true, message: 'Task updated' });
  } catch (error) {
    console.error('UpdateTaskStatus Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Toggle checklist item
const toggleChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed } = req.body;
    
    await pool.query('UPDATE task_checklists SET is_completed = ? WHERE id = ?', [is_completed, id]);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllTasks,
  createTask,
  updateTaskStatus,
  toggleChecklistItem
};
