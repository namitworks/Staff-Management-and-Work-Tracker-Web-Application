const pool = require('../../db/connection');
const { createNotification } = require('../utils/notificationHelper');

const PERFORMANCE_CATEGORIES = [
  'technical',
  'communication',
  'teamwork',
  'punctuality',
  'leadership',
  'general'
];

const parseTargetUserId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const addNote = async (req, res) => {
  try {
    const { user_id: userIdRaw, note, rating, category, date } = req.body;
    const userId = parseTargetUserId(userIdRaw);
    const parsedRating = Number(rating);
    const selectedCategory = category || 'general';
    const noteDate = date || new Date().toISOString().split('T')[0];

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!note || String(note).trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Performance note must be at least 20 characters',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
        error: 'VALIDATION_FAILED'
      });
    }

    if (!PERFORMANCE_CATEGORIES.includes(selectedCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Category is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [insertResult] = await pool.query(
      `INSERT INTO performance (user_id, note, rating, added_by, date, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, String(note).trim(), parsedRating, req.user.id, noteDate, selectedCategory]
    );

    const [rows] = await pool.query(
      `SELECT
        p.id,
        p.user_id,
        p.note,
        p.rating,
        p.category,
        p.date,
        p.created_at,
        p.added_by,
        ad.name AS added_by_name
      FROM performance p
      JOIN users ad ON ad.id = p.added_by
      WHERE p.id = ?`,
      [insertResult.insertId]
    );

    await createNotification(
      userId,
      'New Performance Note',
      `A new performance review has been added (${selectedCategory}, rating ${parsedRating}/5).`,
      'info',
      'performance',
      '/performance'
    );

    return res.status(201).json({
      success: true,
      message: 'Performance note added successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Performance addNote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add performance note',
      error: 'SERVER_ERROR'
    });
  }
};

const getPerformanceByUser = async (req, res) => {
  try {
    const userId = parseTargetUserId(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this performance data',
        error: 'FORBIDDEN'
      });
    }

    const [rows] = await pool.query(
      `SELECT
        p.id,
        p.user_id,
        p.note,
        p.rating,
        p.category,
        p.date,
        p.created_at,
        p.added_by,
        ad.name AS added_by_name
      FROM performance p
      JOIN users ad ON ad.id = p.added_by
      WHERE p.user_id = ? AND p.is_deleted = 0
      ORDER BY p.date DESC, p.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Performance notes fetched successfully',
      data: rows
    });
  } catch (error) {
    console.error('Performance getPerformanceByUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch performance notes',
      error: 'SERVER_ERROR'
    });
  }
};

const getPerformanceSummary = async (req, res) => {
  try {
    const userId = parseTargetUserId(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this summary',
        error: 'FORBIDDEN'
      });
    }

    const [[overallRow]] = await pool.query(
      `SELECT
        ROUND(AVG(rating), 2) AS average_rating,
        COUNT(*) AS total_notes,
        MAX(date) AS latest_review_date
      FROM performance
      WHERE user_id = ? AND is_deleted = 0`,
      [userId]
    );

    const [categoryRows] = await pool.query(
      `SELECT
        category,
        ROUND(AVG(rating), 2) AS average_rating
      FROM performance
      WHERE user_id = ? AND is_deleted = 0
      GROUP BY category`,
      [userId]
    );

    const categoryMap = new Map(categoryRows.map((row) => [row.category, Number(row.average_rating)]));
    const ratingByCategory = PERFORMANCE_CATEGORIES.map((category) => ({
      category,
      average_rating: categoryMap.get(category) || 0
    }));

    const bestCategory = ratingByCategory.reduce((best, row) => {
      if (!best || row.average_rating > best.average_rating) return row;
      return best;
    }, null);

    const [trendRows] = await pool.query(
      `SELECT
        DATE_FORMAT(date, '%Y-%m') AS month_key,
        ROUND(AVG(rating), 2) AS average_rating
      FROM performance
      WHERE user_id = ?
        AND is_deleted = 0
        AND date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month_key ASC`,
      [userId]
    );

    const trendMap = new Map(
      trendRows.map((row) => [row.month_key, Number(row.average_rating)])
    );

    const trend = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trend.push({
        month: d.toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' }),
        month_key: monthKey,
        average_rating: trendMap.get(monthKey) || 0
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Performance summary fetched successfully',
      data: {
        user_id: userId,
        average_rating: Number(overallRow.average_rating) || 0,
        total_notes: Number(overallRow.total_notes) || 0,
        latest_review_date: overallRow.latest_review_date || null,
        best_category: bestCategory?.category || null,
        rating_by_category: ratingByCategory,
        trend
      }
    });
  } catch (error) {
    console.error('Performance getPerformanceSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch performance summary',
      error: 'SERVER_ERROR'
    });
  }
};

const updateNote = async (req, res) => {
  try {
    const noteId = parseTargetUserId(req.params.id);
    if (!noteId) {
      return res.status(400).json({
        success: false,
        message: 'Note ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const updates = [];
    const params = [];

    if (req.body.note !== undefined) {
      const note = String(req.body.note || '').trim();
      if (note.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Note must be at least 10 characters',
          error: 'VALIDATION_FAILED'
        });
      }
      updates.push('note = ?');
      params.push(note);
    }

    if (req.body.rating !== undefined) {
      const rating = Number(req.body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
          error: 'VALIDATION_FAILED'
        });
      }
      updates.push('rating = ?');
      params.push(rating);
    }

    if (req.body.category !== undefined) {
      if (!PERFORMANCE_CATEGORIES.includes(req.body.category)) {
        return res.status(400).json({
          success: false,
          message: 'Category is invalid',
          error: 'VALIDATION_FAILED'
        });
      }
      updates.push('category = ?');
      params.push(req.body.category);
    }

    if (req.body.date !== undefined) {
      updates.push('date = ?');
      params.push(req.body.date);
    }

    if (!updates.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
        error: 'VALIDATION_FAILED'
      });
    }

    params.push(noteId);
    const [updateResult] = await pool.query(
      `UPDATE performance
       SET ${updates.join(', ')}
       WHERE id = ? AND is_deleted = 0`,
      params
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Performance note not found',
        error: 'NOT_FOUND'
      });
    }

    const [rows] = await pool.query(
      `SELECT
        p.id,
        p.user_id,
        p.note,
        p.rating,
        p.category,
        p.date,
        p.created_at,
        p.added_by,
        ad.name AS added_by_name
      FROM performance p
      JOIN users ad ON ad.id = p.added_by
      WHERE p.id = ?`,
      [noteId]
    );

    return res.status(200).json({
      success: true,
      message: 'Performance note updated successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Performance updateNote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update performance note',
      error: 'SERVER_ERROR'
    });
  }
};

const deleteNote = async (req, res) => {
  try {
    const noteId = parseTargetUserId(req.params.id);
    if (!noteId) {
      return res.status(400).json({
        success: false,
        message: 'Note ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [result] = await pool.query(
      'UPDATE performance SET is_deleted = 1 WHERE id = ? AND is_deleted = 0',
      [noteId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Performance note not found',
        error: 'NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Performance note deleted successfully',
      data: { id: noteId }
    });
  } catch (error) {
    console.error('Performance deleteNote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete performance note',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  addNote,
  getPerformanceByUser,
  getPerformanceSummary,
  updateNote,
  deleteNote
};
