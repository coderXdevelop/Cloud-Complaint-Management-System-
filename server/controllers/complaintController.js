const pool = require('../config/db');

// Student creates a complaint
const createComplaint = async (req, res, next) => {
  try {
    const { title, category, description } = req.body;
    const student_usn = req.user.usn;
    if (!title || !category || !description)
      return res.status(400).json({ message: 'Title, category, and description are required' });

    const image = req.file ? req.file.filename : null;
    await pool.execute(
      'INSERT INTO complaints (student_usn, title, category, description, image) VALUES (?, ?, ?, ?, ?)',
      [student_usn, title, category, description, image]
    );
    res.status(201).json({ message: 'Complaint submitted successfully' });
  } catch (err) { next(err); }
};

// Student gets their own complaints
const getStudentComplaints = async (req, res, next) => {
  try {
    const student_usn = req.user.usn;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [complaints] = await pool.query(
      `SELECT * FROM complaints WHERE student_usn = ? ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      [student_usn]
    );
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM complaints WHERE student_usn = ?', [student_usn]
    );
    const [[stats]] = await pool.execute(
      `SELECT COUNT(*) as total,
        SUM(status='Pending') as pending,
        SUM(status='Processing') as processing,
        SUM(status='Resolved') as resolved
       FROM complaints WHERE student_usn = ?`,
      [student_usn]
    );
    res.json({ complaints, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, stats });
  } catch (err) { next(err); }
};

// Admin gets all complaints with filters
const getAllComplaints = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, category, search } = req.query;

    const conditions = [];
    const params = [];
    if (status && status.trim()) { conditions.push('c.status = ?'); params.push(status); }
    if (category && category.trim()) { conditions.push('c.category = ?'); params.push(category); }
    if (search && search.trim()) {
      conditions.push('(c.title LIKE ? OR c.student_usn LIKE ? OR u.name LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Use pool.query (not execute) for dynamic WHERE + inline integer LIMIT/OFFSET
    const listSQL = `
      SELECT c.*, u.name as student_name, u.email as student_email, u.semester
      FROM complaints c JOIN users u ON c.student_usn = u.usn
      ${where} ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const countSQL = `SELECT COUNT(*) as total FROM complaints c JOIN users u ON c.student_usn = u.usn ${where}`;

    const [complaints] = await pool.query(listSQL, params.length ? params : undefined);
    const [[{ total }]] = await pool.query(countSQL, params.length ? params : undefined);
    const [[stats]] = await pool.execute(
      `SELECT COUNT(*) as total,
        SUM(status='Pending') as pending,
        SUM(status='Processing') as processing,
        SUM(status='Resolved') as resolved
       FROM complaints`
    );
    res.json({ complaints, pagination: { page, limit, total: Number(total), pages: Math.ceil(total / limit) }, stats });
  } catch (err) { next(err); }
};

// Admin updates status
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Pending', 'Processing', 'Resolved'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const [result] = await pool.execute(
      'UPDATE complaints SET status = ? WHERE complaint_id = ?', [status, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Complaint not found' });

    const [[complaint]] = await pool.execute(
      'SELECT * FROM complaints WHERE complaint_id = ?', [id]
    );
    const io = req.app.get('io');
    if (io) io.emit('complaintUpdated', complaint);
    res.json({ message: 'Status updated successfully', complaint });
  } catch (err) { next(err); }
};

// Admin adds/updates note
const updateComplaintNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_note } = req.body;
    const [result] = await pool.execute(
      'UPDATE complaints SET admin_note = ? WHERE complaint_id = ?', [admin_note, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Complaint not found' });

    const [[complaint]] = await pool.execute(
      'SELECT * FROM complaints WHERE complaint_id = ?', [id]
    );
    const io = req.app.get('io');
    if (io) io.emit('complaintUpdated', complaint);
    res.json({ message: 'Note updated successfully', complaint });
  } catch (err) { next(err); }
};

module.exports = { createComplaint, getStudentComplaints, getAllComplaints, updateComplaintStatus, updateComplaintNote };
