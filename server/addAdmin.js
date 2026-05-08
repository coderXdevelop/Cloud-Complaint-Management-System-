/**
 * Add Admin Script
 * Usage: node addAdmin.js
 * Or with args: node addAdmin.js "Full Name" "email@campus.edu" "Password@123" "Designation" "9876543210"
 */

const bcrypt = require('bcryptjs');
const pool = require('./config/db');
const readline = require('readline');
require('dotenv').config();

const args = process.argv.slice(2);

const ask = (rl, question) =>
  new Promise(resolve => rl.question(question, resolve));

const run = async () => {
  let name, email, password, designation, phone;

  if (args.length >= 3) {
    // Non-interactive mode: node addAdmin.js "Name" "email" "password" "designation" "phone"
    [name, email, password, designation = '', phone = ''] = args;
  } else {
    // Interactive mode
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('\n📋  Add New Admin Account\n' + '─'.repeat(30));
    name        = await ask(rl, 'Full Name        : ');
    email       = await ask(rl, 'Email            : ');
    password    = await ask(rl, 'Password         : ');
    designation = await ask(rl, 'Designation      : ');
    phone       = await ask(rl, 'Phone (optional) : ');
    rl.close();
  }

  // Validate
  if (!name || !email || !password) {
    console.error('\n❌  Name, email and password are required.');
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('\n❌  Invalid email address.');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('\n❌  Password must be at least 6 characters.');
    process.exit(1);
  }

  try {
    // Check duplicate
    const [existing] = await pool.execute('SELECT id FROM admins WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.error(`\n❌  An admin with email "${email}" already exists.`);
      process.exit(1);
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO admins (name, email, password, designation, phone) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim(), hashed, designation.trim() || null, phone.trim() || null]
    );

    console.log('\n✅  Admin created successfully!');
    console.log('   ID          :', result.insertId);
    console.log('   Name        :', name.trim());
    console.log('   Email       :', email.trim());
    console.log('   Designation :', designation.trim() || '—');
    console.log('   Phone       :', phone.trim() || '—');
    console.log('\n   They can now log in at /login → Admin Login tab.\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌  Error:', err.message);
    process.exit(1);
  }
};

run();
