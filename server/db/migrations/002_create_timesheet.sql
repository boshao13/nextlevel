CREATE TABLE IF NOT EXISTS timesheet_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker ENUM('jesus_garcia', 'jerry_francia') NOT NULL,
  date DATE NOT NULL,
  clock_in TIME NOT NULL,
  clock_out TIME NOT NULL,
  lunch_minutes INT NOT NULL DEFAULT 30,
  total_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_worker_date (worker, date)
);
