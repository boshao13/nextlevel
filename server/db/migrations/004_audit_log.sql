SET @tbl_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'timesheet_audit');
SET @sql = IF(@tbl_exists = 0, "CREATE TABLE timesheet_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_id INT NOT NULL,
  worker VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  lunch_minutes INT,
  total_hours DECIMAL(5,2),
  action ENUM('created','updated') NOT NULL,
  edited_by VARCHAR(50),
  edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entry (entry_id),
  INDEX idx_worker_date (worker, date)
)", "SELECT 1");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
