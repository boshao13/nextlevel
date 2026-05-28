-- 006_payroll_inventory.sql
-- Adds payroll_runs (snapshot of locked pay period), inventory_items, inventory_usage.
-- Adds timesheet_entries.paid_run_id FK so locked entries are stamped with their run.
-- Idempotent via information_schema guards (MySQL 8.0.45 lacks IF NOT EXISTS for ADD COLUMN/INDEX).

-- 1. payroll_runs table
SET @t1 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payroll_runs');
SET @sql = IF(@t1 = 0, "CREATE TABLE payroll_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_gross DECIMAL(12,2) NOT NULL DEFAULT 0,
  snapshot JSON NOT NULL,
  notes TEXT NULL,
  run_by VARCHAR(64) NOT NULL,
  run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unlocked_at TIMESTAMP NULL,
  unlocked_by VARCHAR(64) NULL,
  INDEX idx_period (period_start, period_end),
  INDEX idx_run_at (run_at)
)", "SELECT 1");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. timesheet_entries.paid_run_id column + FK
SET @c1 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'timesheet_entries' AND COLUMN_NAME = 'paid_run_id');
SET @sql = IF(@c1 = 0, 'ALTER TABLE timesheet_entries ADD COLUMN paid_run_id INT NULL, ADD CONSTRAINT fk_timesheet_paid_run FOREIGN KEY (paid_run_id) REFERENCES payroll_runs(id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. idx_paid_run_id index on timesheet_entries
SET @i1 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'timesheet_entries' AND INDEX_NAME = 'idx_paid_run_id');
SET @sql = IF(@i1 = 0, 'CREATE INDEX idx_paid_run_id ON timesheet_entries (paid_run_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. inventory_items table
SET @t2 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_items');
SET @sql = IF(@t2 = 0, "CREATE TABLE inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
)", "SELECT 1");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. inventory_usage table
SET @t3 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_usage');
SET @sql = IF(@t3 = 0, "CREATE TABLE inventory_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  worker VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  units_used DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(64) NOT NULL,
  INDEX idx_worker_date (worker, date),
  INDEX idx_item_id (item_id),
  CONSTRAINT fk_inventory_usage_item FOREIGN KEY (item_id) REFERENCES inventory_items(id)
)", "SELECT 1");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
