const pool = require('../../db/connection');

// Create a new project
const createProject = async (req, res) => {
  try {
    const { name, type, start_date, end_date, description } = req.body;
    const adminId = req.user.id;

    const [result] = await pool.query(
      'INSERT INTO projects (name, type, start_date, end_date, description, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type, start_date, end_date, description, adminId]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('CreateProject Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Get all projects with task stats
const getAllProjects = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND is_deleted = 0) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done' AND is_deleted = 0) as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('GetAllProjects Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

// Get single project
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT p.*, u.name as created_by_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('GetProject Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById
};
