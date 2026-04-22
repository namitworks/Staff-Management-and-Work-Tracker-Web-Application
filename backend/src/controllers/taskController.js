const pool = require('../../db/connection');
const { createNotification } = require('../utils/notificationHelper');

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const toIntOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const updateProjectProgress = async (projectId, connection = pool) => {
  const normalizedProjectId = toIntOrNull(projectId);
  if (!normalizedProjectId) return;

  const [[counts]] = await connection.query(
    `SELECT
      COUNT(*) AS total_count,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done_count
    FROM tasks
    WHERE project_id = ? AND is_deleted = 0`,
    [normalizedProjectId]
  );

  const total = Number(counts.total_count) || 0;
  const done = Number(counts.done_count) || 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  await connection.query('UPDATE projects SET progress = ? WHERE id = ?', [progress, normalizedProjectId]);
};

const fetchTaskWithDetails = async (taskId, connection = pool) => {
  const [taskRows] = await connection.query(
    `SELECT
      t.id,
      t.title,
      t.description,
      t.priority,
      t.status,
      t.assigned_to,
      t.project_id,
      t.deadline,
      t.tags,
      t.attachments,
      t.progress,
      t.estimated_hrs,
      t.actual_hrs,
      t.completed_at,
      t.position,
      t.created_by,
      t.created_at,
      t.updated_at,
      u.name AS assignee_name,
      sp.avatar_url AS assignee_avatar,
      p.name AS project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to
    LEFT JOIN staff_profiles sp ON sp.user_id = u.id
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.id = ? AND t.is_deleted = 0`,
    [taskId]
  );

  if (!taskRows.length) return null;

  const [checklistRows] = await connection.query(
    `SELECT
      id,
      task_id,
      item,
      is_completed,
      created_at
    FROM task_checklists
    WHERE task_id = ?`,
    [taskId]
  );

  return {
    ...taskRows[0],
    checklist: checklistRows
  };
};

const getTasks = async (req, res) => {
  try {
    const whereParts = ['t.is_deleted = 0'];
    const params = [];
    const isStaff = req.user.role === 'staff';

    if (isStaff) {
      whereParts.push('t.assigned_to = ?');
      params.push(req.user.id);
    }

    if (req.query.status) {
      whereParts.push('t.status = ?');
      params.push(req.query.status);
    }

    if (req.query.priority) {
      whereParts.push('t.priority = ?');
      params.push(req.query.priority);
    }

    if (req.query.project_id) {
      whereParts.push('t.project_id = ?');
      params.push(toIntOrNull(req.query.project_id));
    }

    if (req.query.assigned_to && !isStaff) {
      whereParts.push('t.assigned_to = ?');
      params.push(toIntOrNull(req.query.assigned_to));
    }

    const sortBy = req.query.sort_by || 'created_at';
    const sortDirection = req.query.sort_order === 'asc' ? 'ASC' : 'DESC';
    let orderBy = 't.created_at DESC';
    if (sortBy === 'deadline') orderBy = `t.deadline ${sortDirection}, t.created_at DESC`;
    if (sortBy === 'priority') {
      orderBy = `CASE t.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END ASC, t.created_at DESC`;
    }
    if (sortBy === 'created_at') orderBy = `t.created_at ${sortDirection}`;

    const [rows] = await pool.query(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        t.project_id,
        t.deadline,
        t.tags,
        t.attachments,
        t.progress,
        t.estimated_hrs,
        t.actual_hrs,
        t.completed_at,
        t.position,
        t.created_by,
        t.created_at,
        t.updated_at,
        u.name AS assignee_name,
        sp.avatar_url AS assignee_avatar,
        p.name AS project_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE ${whereParts.join(' AND ')}
      ORDER BY ${orderBy}`,
      params
    );

    if (!rows.length) {
      return res.status(200).json({
        success: true,
        message: 'Tasks fetched successfully',
        data: []
      });
    }

    const [checklistRows] = await pool.query(
      'SELECT id, task_id, item, is_completed, created_at FROM task_checklists WHERE task_id IN (?)',
      [rows.map((task) => task.id)]
    );
    const checklistMap = new Map();
    checklistRows.forEach((row) => {
      if (!checklistMap.has(row.task_id)) checklistMap.set(row.task_id, []);
      checklistMap.get(row.task_id).push(row);
    });

    const tasks = rows.map((row) => ({
      ...row,
      checklist: checklistMap.get(row.id) || []
    }));

    return res.status(200).json({
      success: true,
      message: 'Tasks fetched successfully',
      data: tasks
    });
  } catch (error) {
    console.error('Tasks getTasks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: 'SERVER_ERROR'
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const taskId = toIntOrNull(req.params.id);
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const task = await fetchTaskWithDetails(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        error: 'NOT_FOUND'
      });
    }

    if (req.user.role === 'staff' && task.assigned_to !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only view tasks assigned to you',
        error: 'FORBIDDEN'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task fetched successfully',
      data: task
    });
  } catch (error) {
    console.error('Tasks getTaskById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: 'SERVER_ERROR'
    });
  }
};

const createTask = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      title,
      description,
      priority = 'medium',
      status = 'todo',
      assigned_to: assignedToRaw,
      project_id: projectIdRaw,
      deadline,
      estimated_hrs: estimatedHrsRaw,
      tags,
      attachments,
      progress = 0,
      position = 0,
      checklist = []
    } = req.body;

    if (!title || String(title).trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required (minimum 3 characters)',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!TASK_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Task priority is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Task status is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const assignedTo = toIntOrNull(assignedToRaw);
    const projectId = toIntOrNull(projectIdRaw);
    const estimatedHrs = toNumberOrNull(estimatedHrsRaw) || 0;
    const normalizedTags = Array.isArray(tags) ? tags.join(',') : (tags || null);

    await connection.beginTransaction();

    const [insertResult] = await connection.query(
      `INSERT INTO tasks (
        title,
        description,
        priority,
        status,
        assigned_to,
        project_id,
        deadline,
        tags,
        attachments,
        progress,
        estimated_hrs,
        position,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(title).trim(),
        description || null,
        priority,
        status,
        assignedTo,
        projectId,
        deadline || null,
        normalizedTags,
        attachments || null,
        Number(progress) || 0,
        estimatedHrs,
        Number(position) || 0,
        req.user.id
      ]
    );

    if (Array.isArray(checklist) && checklist.length > 0) {
      const values = checklist
        .map((item) => (typeof item === 'string' ? item : item?.text))
        .filter((value) => value && String(value).trim().length > 0)
        .map((value) => [insertResult.insertId, String(value).trim()]);

      if (values.length > 0) {
        await connection.query('INSERT INTO task_checklists (task_id, item) VALUES ?', [values]);
      }
    }

    await updateProjectProgress(projectId, connection);
    await connection.commit();

    const createdTask = await fetchTaskWithDetails(insertResult.insertId);

    if (assignedTo && assignedTo !== req.user.id) {
      await createNotification(
        assignedTo,
        'New Task Assigned',
        `You have been assigned a new task: ${String(title).trim()}`,
        'info',
        'task',
        '/tasks'
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: createdTask
    });
  } catch (error) {
    await connection.rollback();
    console.error('Tasks createTask error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: 'SERVER_ERROR'
    });
  } finally {
    connection.release();
  }
};

const updateTask = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const taskId = toIntOrNull(req.params.id);
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [taskRows] = await connection.query(
      `SELECT id, assigned_to, project_id, status
       FROM tasks
       WHERE id = ? AND is_deleted = 0
       FOR UPDATE`,
      [taskId]
    );

    if (!taskRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        error: 'NOT_FOUND'
      });
    }

    const existingTask = taskRows[0];
    const isStaff = req.user.role === 'staff';

    if (isStaff && existingTask.assigned_to !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own tasks',
        error: 'FORBIDDEN'
      });
    }

    const allowedFields = isStaff
      ? ['status', 'actual_hrs']
      : [
          'title',
          'description',
          'priority',
          'status',
          'assigned_to',
          'project_id',
          'deadline',
          'tags',
          'attachments',
          'progress',
          'estimated_hrs',
          'actual_hrs',
          'position'
        ];

    const updates = [];
    const params = [];
    let newAssignedTo = existingTask.assigned_to;
    let newProjectId = existingTask.project_id;
    let newStatus = existingTask.status;

    for (const field of allowedFields) {
      if (!(field in req.body)) continue;

      if (field === 'priority' && !TASK_PRIORITIES.includes(req.body.priority)) {
        return res.status(400).json({
          success: false,
          message: 'Task priority is invalid',
          error: 'VALIDATION_FAILED'
        });
      }

      if (field === 'status' && !TASK_STATUSES.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: 'Task status is invalid',
          error: 'VALIDATION_FAILED'
        });
      }

      if (field === 'assigned_to') {
        newAssignedTo = toIntOrNull(req.body.assigned_to);
        updates.push('assigned_to = ?');
        params.push(newAssignedTo);
        continue;
      }

      if (field === 'project_id') {
        newProjectId = toIntOrNull(req.body.project_id);
        updates.push('project_id = ?');
        params.push(newProjectId);
        continue;
      }

      if (field === 'estimated_hrs' || field === 'actual_hrs' || field === 'progress' || field === 'position') {
        updates.push(`${field} = ?`);
        params.push(toNumberOrNull(req.body[field]) || 0);
        continue;
      }

      if (field === 'status') {
        newStatus = req.body.status;
      }

      updates.push(`${field} = ?`);
      params.push(req.body[field] ?? null);
    }

    if (!updates.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid task fields provided for update',
        error: 'VALIDATION_FAILED'
      });
    }

    if (updates.some((field) => field.startsWith('status ='))) {
      updates.push('completed_at = ?');
      params.push(newStatus === 'done' ? new Date() : null);
    }

    params.push(taskId);

    await connection.beginTransaction();
    await connection.query(
      `UPDATE tasks
       SET ${updates.join(', ')}
       WHERE id = ?`,
      params
    );

    await updateProjectProgress(existingTask.project_id, connection);
    if (newProjectId !== existingTask.project_id) {
      await updateProjectProgress(newProjectId, connection);
    }
    await connection.commit();

    const updatedTask = await fetchTaskWithDetails(taskId);

    if (newAssignedTo && newAssignedTo !== existingTask.assigned_to) {
      await createNotification(
        newAssignedTo,
        'Task Assignment Updated',
        `You have been assigned task: ${updatedTask.title}`,
        'info',
        'task',
        '/tasks'
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    await connection.rollback();
    console.error('Tasks updateTask error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: 'SERVER_ERROR'
    });
  } finally {
    connection.release();
  }
};

const updateTaskStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const taskId = toIntOrNull(req.params.id);
    const status = req.body.status;

    if (!taskId || !TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Task status update payload is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [taskRows] = await connection.query(
      `SELECT id, assigned_to, project_id
       FROM tasks
       WHERE id = ? AND is_deleted = 0
       FOR UPDATE`,
      [taskId]
    );

    if (!taskRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        error: 'NOT_FOUND'
      });
    }

    const task = taskRows[0];
    if (req.user.role === 'staff' && task.assigned_to !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own task status',
        error: 'FORBIDDEN'
      });
    }

    await connection.beginTransaction();
    await connection.query(
      `UPDATE tasks
       SET status = ?, completed_at = ?
       WHERE id = ?`,
      [status, status === 'done' ? new Date() : null, taskId]
    );
    await updateProjectProgress(task.project_id, connection);
    await connection.commit();

    const updatedTask = await fetchTaskWithDetails(taskId);
    return res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask
    });
  } catch (error) {
    await connection.rollback();
    console.error('Tasks updateTaskStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: 'SERVER_ERROR'
    });
  } finally {
    connection.release();
  }
};

const deleteTask = async (req, res) => {
  try {
    const taskId = toIntOrNull(req.params.id);
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [taskRows] = await pool.query(
      'SELECT id, project_id FROM tasks WHERE id = ? AND is_deleted = 0',
      [taskId]
    );
    if (!taskRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        error: 'NOT_FOUND'
      });
    }

    await pool.query('UPDATE tasks SET is_deleted = 1 WHERE id = ?', [taskId]);
    await updateProjectProgress(taskRows[0].project_id);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id: taskId }
    });
  } catch (error) {
    console.error('Tasks deleteTask error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: 'SERVER_ERROR'
    });
  }
};

const toggleChecklistItem = async (req, res) => {
  try {
    const checklistId = toIntOrNull(req.params.id);
    if (!checklistId) {
      return res.status(400).json({
        success: false,
        message: 'Checklist ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const isCompleted = req.body.is_completed ? 1 : 0;
    const [result] = await pool.query(
      'UPDATE task_checklists SET is_completed = ? WHERE id = ?',
      [isCompleted, checklistId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Checklist item not found',
        error: 'NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Checklist item updated successfully'
    });
  } catch (error) {
    console.error('Tasks toggleChecklistItem error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update checklist item',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  toggleChecklistItem
};
