const pool = require('../../db/connection');

const generateStaffId = async () => {
  const year = new Date().getFullYear();
  const prefix = `DD-${year}-`;
  
  // Query the DB for the last staff_id of the current year
  const [rows] = await pool.query(
    `SELECT staff_id FROM staff_profiles WHERE staff_id LIKE ? ORDER BY staff_id DESC LIMIT 1`,
    [`${prefix}%`]
  );
  
  let nextNumber = 1;
  if (rows.length > 0 && rows[0].staff_id) {
    const lastId = rows[0].staff_id;
    const parts = lastId.split('-');
    if (parts.length === 3) {
      const lastNumber = parseInt(parts[2], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
  }
  
  // Auto-increment the number and pad with zeros (e.g., DD-2025-001)
  const paddedNumber = nextNumber.toString().padStart(3, '0');
  return `${prefix}${paddedNumber}`;
};

module.exports = generateStaffId;
