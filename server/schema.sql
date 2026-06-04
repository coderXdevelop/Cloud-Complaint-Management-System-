CREATE DATABASE IF NOT EXISTS complaint_db;
USE complaint_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  usn VARCHAR(20) UNIQUE NOT NULL,
  phone VARCHAR(15),
  semester INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  designation VARCHAR(100),
  phone VARCHAR(15),
  department VARCHAR(100) DEFAULT 'Super Admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  complaint_id INT AUTO_INCREMENT PRIMARY KEY,
  student_usn VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255),
  status ENUM('Pending','Processing','Resolved') DEFAULT 'Pending',
  admin_note TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5) DEFAULT NULL,
  feedback_text TEXT DEFAULT NULL,
  admin_id INT DEFAULT NULL,
  sla_deadline TIMESTAMP NULL DEFAULT NULL,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  history_log TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_usn) REFERENCES users(usn) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  purpose ENUM('registration', 'forgot_password') NOT NULL,
  role ENUM('student', 'admin') DEFAULT 'student',
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_purpose (email, purpose)
);
