-- documents
SET @t1 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents');
SET @sql = IF(@t1 = 0,
  'CREATE TABLE documents (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    title             VARCHAR(200) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path         VARCHAR(500) NOT NULL,
    signed_file_path  VARCHAR(500) NULL,
    file_hash         CHAR(64) NOT NULL,
    recipient_name    VARCHAR(120) NULL,
    recipient_email   VARCHAR(255) NOT NULL,
    sign_token        CHAR(64) NOT NULL UNIQUE,
    status            ENUM(''draft'',''sent'',''viewed'',''signed'',''voided'') NOT NULL DEFAULT ''draft'',
    created_by        VARCHAR(64) NOT NULL,
    notes             TEXT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at           TIMESTAMP NULL,
    viewed_at         TIMESTAMP NULL,
    signed_at         TIMESTAMP NULL,
    voided_at         TIMESTAMP NULL,
    INDEX (status, created_at),
    INDEX (recipient_email)
  )',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- document_fields
SET @t2 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_fields');
SET @sql = IF(@t2 = 0,
  'CREATE TABLE document_fields (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    page        INT NOT NULL,
    field_type  ENUM(''signature'',''initials'',''date'',''text'') NOT NULL,
    x           DECIMAL(8,4) NOT NULL,
    y           DECIMAL(8,4) NOT NULL,
    w           DECIMAL(8,4) NOT NULL,
    h           DECIMAL(8,4) NOT NULL,
    required    TINYINT(1) NOT NULL DEFAULT 1,
    label       VARCHAR(80) NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    INDEX (document_id, page, sort_order)
  )',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- document_field_values
SET @t3 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_field_values');
SET @sql = IF(@t3 = 0,
  'CREATE TABLE document_field_values (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    field_id    INT NOT NULL,
    value_text  TEXT NULL,
    value_image LONGTEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_field (field_id),
    FOREIGN KEY (field_id) REFERENCES document_fields(id) ON DELETE CASCADE
  )',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- document_events
SET @t4 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_events');
SET @sql = IF(@t4 = 0,
  'CREATE TABLE document_events (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    event_type  ENUM(''sent'',''viewed'',''consent_given'',''signed'',''voided'',''resent'') NOT NULL,
    ip          VARCHAR(45) NULL,
    user_agent  VARCHAR(500) NULL,
    detail      JSON NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    INDEX (document_id, occurred_at)
  )',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
