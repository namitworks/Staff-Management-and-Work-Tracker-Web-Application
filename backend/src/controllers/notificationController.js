const pool = require('../../db/connection');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT
        id,
        user_id,
        title,
        message,
        type,
        category,
        is_read,
        link,
        created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [userId]
    );

    const unreadCount = rows.filter((row) => !row.is_read).length;

    return res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: rows,
      unread_count: unreadCount
    });
  } catch (error) {
    console.error('Notifications getNotifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: 'SERVER_ERROR'
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        error: 'NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Notifications markAsRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: 'SERVER_ERROR'
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Notifications markAllAsRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: 'SERVER_ERROR'
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is invalid',
        error: 'VALIDATION_FAILED'
      });
    }

    const [result] = await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        error: 'NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Notifications deleteNotification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: 'SERVER_ERROR'
    });
  }
};

const clearAllNotifications = async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE user_id = ?', [req.user.id]);
    return res.status(200).json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    console.error('Notifications clearAllNotifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
};
