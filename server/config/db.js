const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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
    } catch (migrationErr) {
      console.error('❌ Database migration error:', migrationErr.message);
    }
    conn.release();
  })
  .catch(err => console.error('❌ MySQL connection error:', err.message));

module.exports = pool;
