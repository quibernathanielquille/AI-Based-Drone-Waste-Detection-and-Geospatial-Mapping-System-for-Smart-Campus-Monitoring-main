-- ============================================================
-- Smart Campus Waste Detection System - Database Schema
-- MySQL / MariaDB compatible with XAMPP
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_campus_waste
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_campus_waste;

-- ------------------------------------------------------------
-- roles
-- ------------------------------------------------------------
CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_roles_slug (slug)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id INT UNSIGNED NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  avatar VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  remember_token VARCHAR(100) NULL,
  reset_token VARCHAR(255) NULL,
  reset_token_expires_at TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT uq_users_email UNIQUE (email),
  INDEX idx_users_role_id (role_id),
  INDEX idx_users_email (email),
  INDEX idx_users_active (is_active),
  INDEX idx_users_deleted (deleted_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- waste_detections
-- ------------------------------------------------------------
CREATE TABLE waste_detections (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  detected_by INT UNSIGNED NULL,
  waste_category ENUM(
    'biodegradable', 'cardboard', 'glass', 'metal', 'paper', 'plastic'
  ) NOT NULL DEFAULT 'plastic',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  confidence_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  waste_image VARCHAR(500) NULL,
  detection_date DATE NOT NULL,
  detection_time TIME NOT NULL,
  description TEXT NULL,
  zone_name VARCHAR(100) NULL,
  is_hotspot TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('pending', 'verified', 'resolved', 'archived') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_detections_user FOREIGN KEY (detected_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_confidence CHECK (confidence_score >= 0 AND confidence_score <= 100),
  INDEX idx_detections_category (waste_category),
  INDEX idx_detections_date (detection_date),
  INDEX idx_detections_coords (latitude, longitude),
  INDEX idx_detections_hotspot (is_hotspot),
  INDEX idx_detections_status (status),
  INDEX idx_detections_deleted (deleted_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- reports
-- ------------------------------------------------------------
CREATE TABLE reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  generated_by INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  report_type ENUM('daily', 'weekly', 'monthly', 'custom', 'summary') NOT NULL DEFAULT 'summary',
  date_from DATE NULL,
  date_to DATE NULL,
  waste_category VARCHAR(50) NULL,
  total_detections INT UNSIGNED NOT NULL DEFAULT 0,
  summary_json JSON NULL,
  file_path VARCHAR(500) NULL,
  file_format ENUM('pdf', 'excel', 'csv', 'none') NOT NULL DEFAULT 'none',
  status ENUM('draft', 'generated', 'exported', 'archived') NOT NULL DEFAULT 'generated',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_reports_user FOREIGN KEY (generated_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_reports_type (report_type),
  INDEX idx_reports_dates (date_from, date_to),
  INDEX idx_reports_user (generated_by),
  INDEX idx_reports_deleted (deleted_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- analytics_logs
-- ------------------------------------------------------------
CREATE TABLE analytics_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  metric_type VARCHAR(100) NOT NULL,
  metric_key VARCHAR(100) NULL,
  metric_value DECIMAL(15, 4) NOT NULL DEFAULT 0,
  metric_data JSON NULL,
  recorded_at DATE NOT NULL,
  period ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'daily',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_analytics_type (metric_type),
  INDEX idx_analytics_recorded (recorded_at),
  INDEX idx_analytics_period (period),
  INDEX idx_analytics_composite (metric_type, recorded_at, period)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- activity_logs
-- ------------------------------------------------------------
CREATE TABLE activity_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  description TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_activity_user (user_id),
  INDEX idx_activity_module (module),
  INDEX idx_activity_created (created_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- settings
-- ------------------------------------------------------------
CREATE TABLE settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NULL,
  setting_group ENUM('system', 'profile', 'notification', 'theme') NOT NULL DEFAULT 'system',
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT uq_settings_key_user UNIQUE (setting_key, user_id),
  INDEX idx_settings_group (setting_group),
  INDEX idx_settings_user (user_id)
) ENGINE=InnoDB;
