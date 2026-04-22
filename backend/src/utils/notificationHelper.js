const db = require('../config/db');

/**
 * Helper to create a notification in the database
 */
const createNotification = async (userId, title, message, type = 'info', category = 'system', link = null) => {
  try {
    const query = `
      INSERT INTO notifications 
        (user_id, title, message, type, category, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [userId, title, message, type, category, link]);
    return result;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Not throwing error to prevent breaking main flows if notification fails
    return null;
  }
};

module.exports = {
  createNotification
};
