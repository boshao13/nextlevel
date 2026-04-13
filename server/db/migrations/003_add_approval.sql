-- Skip if already applied (no-op if columns exist via duplicate-column check).
-- Safe to re-run: check information_schema first.
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'timesheet_entries' AND COLUMN_NAME = 'approved_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE timesheet_entries ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL, ADD COLUMN approved_by VARCHAR(50) NULL DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
