const pool = require('./db/connection');

async function runMigration() {
  try {
    console.log("Running migration...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_checklists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        item VARCHAR(255) NOT NULL,
        is_completed BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit();
  }
}

runMigration();
