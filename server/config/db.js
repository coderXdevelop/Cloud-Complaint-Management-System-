const mysql = require('mysql2/promise');
require('dotenv').config();

const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

pool.getConnection()
  .then(async conn => {
    console.log('✅ MySQL connected');
    try {
      // 1. Auto-initialize tables if schema is not present
      const [tables] = await conn.query("SHOW TABLES LIKE 'users'");
      if (tables.length === 0) {
        console.log('⚠️ Database tables not found. Initializing schema...');
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, '../schema.sql');
        if (fs.existsSync(schemaPath)) {
          let schemaSql = fs.readFileSync(schemaPath, 'utf8');
          // Remove database creation and usage statements
          schemaSql = schemaSql.replace(/CREATE DATABASE[\s\S]*?;/i, '');
          schemaSql = schemaSql.replace(/USE [\s\S]*?;/i, '');
          
          // Split into individual statements
          const statements = schemaSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

          for (const statement of statements) {
            await conn.query(statement);
          }
          console.log('✅ Schema initialized successfully!');
        } else {
          console.error('❌ schema.sql not found at ' + schemaPath);
        }
      }

      // 2. Auto-seed admin if database is empty
      const [admins] = await conn.query("SELECT id FROM admins LIMIT 1");
      if (admins.length === 0) {
        console.log('⚠️ No admin found. Seeding default admin...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        await conn.query(
          'INSERT INTO admins (name, email, password, designation, phone) VALUES (?, ?, ?, ?, ?)',
          ['Campus Admin', 'admin@campus.edu', hashedPassword, 'System Administrator', '9876543210']
        );
        console.log('✅ Default admin seeded successfully!');
      }

      const [rows] = await conn.query("SHOW COLUMNS FROM complaints LIKE 'rating'");
      if (rows.length === 0) {
        console.log('⚠️ Migrating database: adding feedback columns...');
        await conn.query("ALTER TABLE complaints ADD COLUMN rating INT CHECK (rating >= 1 AND rating <= 5) DEFAULT NULL");
        await conn.query("ALTER TABLE complaints ADD COLUMN feedback_text TEXT DEFAULT NULL");
        console.log('✅ Added rating and feedback_text columns to complaints table successfully');
      }

      const [rowsAdminId] = await conn.query("SHOW COLUMNS FROM complaints LIKE 'admin_id'");
      if (rowsAdminId.length === 0) {
        console.log('⚠️ Migrating database: adding admin_id column...');
        await conn.query("ALTER TABLE complaints ADD COLUMN admin_id INT DEFAULT NULL");
        await conn.query("ALTER TABLE complaints ADD CONSTRAINT fk_complaints_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL");
        console.log('✅ Added admin_id column and foreign key to complaints table successfully');
      }

      const [rowsDept] = await conn.query("SHOW COLUMNS FROM admins LIKE 'department'");
      if (rowsDept.length === 0) {
        console.log('⚠️ Migrating database: adding department to admins...');
        await conn.query("ALTER TABLE admins ADD COLUMN department VARCHAR(100) DEFAULT 'Super Admin'");
        console.log('✅ Added department column to admins table successfully');
      }

      const [rowsSla] = await conn.query("SHOW COLUMNS FROM complaints LIKE 'sla_deadline'");
      if (rowsSla.length === 0) {
        console.log('⚠️ Migrating database: adding sla_deadline to complaints...');
        await conn.query("ALTER TABLE complaints ADD COLUMN sla_deadline TIMESTAMP NULL DEFAULT NULL");
        console.log('✅ Added sla_deadline column to complaints table successfully');
      }

      const [rowsResolvedAt] = await conn.query("SHOW COLUMNS FROM complaints LIKE 'resolved_at'");
      if (rowsResolvedAt.length === 0) {
        console.log('⚠️ Migrating database: adding resolved_at to complaints...');
        await conn.query("ALTER TABLE complaints ADD COLUMN resolved_at TIMESTAMP NULL DEFAULT NULL");
        console.log('✅ Added resolved_at column to complaints table successfully');
      }

      const [rowsHistory] = await conn.query("SHOW COLUMNS FROM complaints LIKE 'history_log'");
      if (rowsHistory.length === 0) {
        console.log('⚠️ Migrating database: adding history_log to complaints...');
        await conn.query("ALTER TABLE complaints ADD COLUMN history_log TEXT DEFAULT NULL");
        console.log('✅ Added history_log column to complaints table successfully');
      }
    } catch (migrationErr) {
      console.error('❌ Database migration error:', migrationErr.message);
    }
    conn.release();
  })
  .catch(err => console.error('❌ MySQL connection error:', err.message));

module.exports = pool;
