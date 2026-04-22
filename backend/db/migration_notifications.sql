CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  type        ENUM('info','success','warning','error') DEFAULT 'info',
  category    ENUM('task','leave','attendance','performance','payslip','system') DEFAULT 'system',
  is_read     BOOLEAN DEFAULT 0,
  link        VARCHAR(500),
  created_at  DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
