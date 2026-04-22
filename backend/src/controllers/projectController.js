const pool = require('../../db/connection');

const PROJECT_TYPES = ['website', 'pos_onboarding', 'support', 'other'];
const PROJECT_STATUSES = ['active', 'completed', 'on_hold'];

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

const getProjects = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.type,
        p.status,
        p.progress,
        p.client_name,
        p.budget,
        p.start_date,
        p.end_date,
        p.description,
        p.created_by,
        p.created_at,
        u.name AS created_by_name,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks
      FROM projects p
      LEFT JOIN users u ON u.id = p.created_by
      LEFT JOIN tasks t ON t.project_id = p.id AND t.is_deleted = 0
      WHERE COALESCE(p.is_deleted, 0) = 0
      GROUP BY p.id
      ORDER BY p.created_at DESC`
    );

    const projects = rows.map((row) => ({
      ...row,
      total_tasks: Number(row.total_tasks) || 0,
      completed_tasks: Number(row.completed_tasks) || 0
    }));

    return res.status(200).json({
      success: true,
      message: 'Projects fetched successfully',
      data: projects
    });
  } catch (error) {
    console.error('Projects getProjects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: 'SERVER_ERROR'
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const projectId = toIntOrNull(req.params.id);
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [projectRows] = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.type,
        p.status,
        p.progress,
        p.client_name,
        p.budget,
        p.start_date,
        p.end_date,
        p.description,
        p.created_by,
        p.created_at,
        u.name AS created_by_name
      FROM projects p
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.id = ? AND COALESCE(p.is_deleted, 0) = 0`,
      [projectId]
    );

    if (!projectRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        error: 'NOT_FOUND'
      });
    }

    const [taskRows] = await pool.query(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        t.deadline,
        t.progress,
        t.estimated_hrs,
        t.actual_hrs,
        t.tags,
        t.completed_at,
        u.name AS assignee_name,
        sp.avatar_url AS assignee_avatar
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE t.project_id = ? AND t.is_deleted = 0
      ORDER BY t.position ASC, t.created_at DESC`,
      [projectId]
    );

    return res.status(200).json({
      success: true,
      message: 'Project fetched successfully',
      data: {
        ...projectRows[0],
        tasks: taskRows
      }
    });
  } catch (error) {
    console.error('Projects getProjectById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: 'SERVER_ERROR'
    });
  }
};

const createProject = async (req, res) => {
  try {
    const {
      name,
      type,
      status = 'active',
      client_name: clientName,
      budget,
      start_date: startDate,
      end_date: endDate,
      description
    } = req.body;

    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required (minimum 3 characters)',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!PROJECT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Project type is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!PROJECT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Project status is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [insertResult] = await pool.query(
      `INSERT INTO projects (
        name,
        type,
        status,
        client_name,
        budget,
        start_date,
        end_date,
        description,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        type,
        status,
        clientName || null,
        toNumberOrNull(budget) || 0,
        startDate || null,
        endDate || null,
        description || null,
        req.user.id
      ]
    );

    const [rows] = await pool.query(
      `SELECT
        id,
        name,
        type,
        status,
        progress,
        client_name,
        budget,
        start_date,
        end_date,
        description,
        created_by,
        created_at
      FROM projects
      WHERE id = ?`,
      [insertResult.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Projects createProject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: 'SERVER_ERROR'
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const projectId = toIntOrNull(req.params.id);
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const updates = [];
    const params = [];
    const allowedFields = [
      'name',
      'type',
      'status',
      'client_name',
      'budget',
      'start_date',
      'end_date',
      'description',
      'progress'
    ];

    for (const field of allowedFields) {
      if (!(field in req.body)) continue;

      if (field === 'type' && !PROJECT_TYPES.includes(req.body.type)) {
        return res.status(400).json({
          success: false,
          message: 'Project type is invalid',
          error: 'VALIDATION_FAILED'
        });
      }

      if (field === 'status' && !PROJECT_STATUSES.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: 'Project status is invalid',
          error: 'VALIDATION_FAILED'
        });
      }

      if (field === 'budget' || field === 'progress') {
        updates.push(`${field} = ?`);
        params.push(toNumberOrNull(req.body[field]) || 0);
        continue;
      }

      updates.push(`${field} = ?`);
      params.push(req.body[field] ?? null);
    }

    if (!updates.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid project fields provided for update',
        error: 'VALIDATION_FAILED'
      });
    }

    params.push(projectId);

    const [result] = await pool.query(
      `UPDATE projects
       SET ${updates.join(', ')}
       WHERE id = ? AND COALESCE(is_deleted, 0) = 0`,
      params
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        error: 'NOT_FOUND'
      });
    }

    const [rows] = await pool.query(
      `SELECT
        id,
        name,
        type,
        status,
        progress,
        client_name,
        budget,
        start_date,
        end_date,
        description,
        created_by,
        created_at
      FROM projects
      WHERE id = ?`,
      [projectId]
    );

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Projects updateProject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: 'SERVER_ERROR'
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const projectId = toIntOrNull(req.params.id);
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [result] = await pool.query(
      `UPDATE projects
       SET is_deleted = 1
       WHERE id = ? AND COALESCE(is_deleted, 0) = 0`,
      [projectId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        error: 'NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: { id: projectId }
    });
  } catch (error) {
    console.error('Projects deleteProject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
