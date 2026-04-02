-- migrations/init.sql
CREATE DATABASE IF NOT EXISTS school_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE school_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  username VARCHAR(60) NOT NULL UNIQUE,
  phone_number VARCHAR(30) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','manager') NOT NULL DEFAULT 'manager',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pin_moh VARCHAR(60) NULL,
  full_name VARCHAR(160) NOT NULL,
  contact_number VARCHAR(30) NOT NULL,
  program ENUM('Diploma','Certificate') NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  source VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_applicant (full_name, phone_number)
) ENGINE=InnoDB;
