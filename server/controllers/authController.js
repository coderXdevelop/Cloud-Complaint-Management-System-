const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Student Register
const register = async (req, res, next) => {
  try {
    const { name, email, password, usn, phone, semester } = req.body;
    if (!name || !email || !password || !usn)
      return res.status(400).json({ message: 'Name, email, password and USN are required' });

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR usn = ?', [email, usn]
    );
    if (existing.length > 0)
      return res.status(409).json({ message: 'Email or USN already registered' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO users (name, email, password, usn, phone, semester) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashed, usn, phone || null, semester || null]
    );
    res.status(201).json({ message: 'Student registered successfully' });
  } catch (err) { next(err); }
};

// Student Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = users[0];
    if (!(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken({ id: user.id, usn: user.usn, role: 'student', name: user.name });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, usn: user.usn, phone: user.phone, semester: user.semester, role: 'student' },
    });
  } catch (err) { next(err); }
};

// Admin Login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const [admins] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
    if (!admins.length) return res.status(401).json({ message: 'Invalid credentials' });

    const admin = admins[0];
    if (!(await bcrypt.compare(password, admin.password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken({ id: admin.id, role: 'admin', name: admin.name });
    res.json({
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, designation: admin.designation, phone: admin.phone, role: 'admin' },
    });
  } catch (err) { next(err); }
};

module.exports = { register, login, adminLogin };
