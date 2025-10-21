CREATE TABLE analytics_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_izo VARCHAR(255) NULL,
  type INT NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) NULL,
  count INT NOT NULL DEFAULT 0,
  school_type INT NULL,
  city_code INT(10) UNSIGNED NULL,
  INDEX idx_school_izo (school_izo),
  INDEX idx_type (type),
  INDEX idx_city (city_code),
  CONSTRAINT analytics_data_school_izo_fk
    FOREIGN KEY (school_izo)
    REFERENCES school (izo)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT analytics_data_city_fk
    FOREIGN KEY (city_code)
    REFERENCES city (code)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);