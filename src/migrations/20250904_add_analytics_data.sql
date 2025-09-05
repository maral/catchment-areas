CREATE TABLE analytics_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_izo VARCHAR(255) NOT NULL,
  type INT NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) NULL,
  count INT NOT NULL DEFAULT 0,
  INDEX idx_school_izo (school_izo),
  INDEX idx_type (type),
  CONSTRAINT analytics_data_school_izo_fk
    FOREIGN KEY (school_izo)
    REFERENCES school (izo)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
