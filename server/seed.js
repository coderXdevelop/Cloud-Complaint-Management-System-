const bcrypt = require('bcryptjs');
const pool = require('./config/db');
require('dotenv').config();

const seed = async () => {
  try {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await pool.execute(
      'INSERT IGNORE INTO admins (name, email, password, designation, phone) VALUES (?, ?, ?, ?, ?)',
      ['Campus Admin', 'admin@campus.edu', hashedPassword, 'System Administrator', '9876543210']
    );
    console.log('✅ Admin seeded successfully!');
    console.log('   Email: admin@campus.edu');
    console.log('   Password: Admin@123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
