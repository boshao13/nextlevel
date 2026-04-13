SET @c1 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'timesheet_entries' AND COLUMN_NAME = 'trailer_delivered_abq');
SET @sql = IF(@c1 = 0,
  'ALTER TABLE timesheet_entries
    ADD COLUMN trailer_delivered_abq TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN trailer_returned_abq TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN trailer_delivered_sf TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN trailer_returned_sf TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c2 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'timesheet_audit' AND COLUMN_NAME = 'trailer_delivered_abq');
SET @sql = IF(@c2 = 0,
  'ALTER TABLE timesheet_audit
    ADD COLUMN trailer_delivered_abq TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN trailer_returned_abq TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN trailer_delivered_sf TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN trailer_returned_sf TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
