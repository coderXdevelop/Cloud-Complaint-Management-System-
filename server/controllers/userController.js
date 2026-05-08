const pool = require('../config/db');

const getStudentProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, usn, phone, semester, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const getAdminProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, designation, phone, created_at FROM admins WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Admin not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

module.exports = { getStudentProfile, getAdminProfile };
