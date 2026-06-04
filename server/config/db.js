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
