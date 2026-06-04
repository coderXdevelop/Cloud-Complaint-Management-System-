const pool = require('../config/db');
const { sendComplaintStatusEmail } = require('../services/emailService');

const SLA_HOURS = {
  'Infrastructure': 48,
  'Academic': 72,
  'Hostel': 24,
  'Transport': 24,
  'Library': 48,
  'Cafeteria': 12,
  'Sports': 48,
  'IT/Network': 24,
  'Administration': 72,
  'Other': 48
};

const appendHistoryLog = (existingLog, event, actor, note = null) => {
  let history = [];
  try {
    if (existingLog) {
      history = JSON.parse(existingLog);
    }
  } catch (e) {
    // Treat as empty on parse error
  }
  history.push({
    event,
    timestamp: new Date().toISOString(),
    actor,
    note
  });
  return JSON.stringify(history);
};

// Student creates a complaint
const createComplaint = async (req, res, next) => {
  try {
    const { title, category, description } = req.body;
    const student_usn = req.user.usn;
    if (!title || !category || !description)
      return res.status(400).json({ message: 'Title, category, and description are required' });

    const image = req.file ? req.file.filename : null;
    
    // Calculate SLA deadline
    const hours = SLA_HOURS[category] || 48;
    const sla_deadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    // Initialize history log
    const history = [{
      event: 'Complaint Submitted',
      timestamp: new Date().toISOString(),
      actor: req.user.name || 'Student',
      note: null
    }];
    const history_log = JSON.stringify(history);

    await pool.execute(
      'INSERT INTO complaints (student_usn, title, category, description, image, sla_deadline, history_log) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [student_usn, title, category, description, image, sla_deadline, history_log]
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
    const { status } = req.query;

    const conditions = ['student_usn = ?'];
    const params = [student_usn];
    if (status && status.trim() && status !== 'All') {
      conditions.push('status = ?');
      params.push(status);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const listSQL = `SELECT * FROM complaints ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const countSQL = `SELECT COUNT(*) as total FROM complaints ${where}`;

    const [complaints] = await pool.query(listSQL, params);
    const [[{ total }]] = await pool.query(countSQL, params);
    const [[stats]] = await pool.execute(
      `SELECT COUNT(*) as total,
        SUM(status='Pending') as pending,
        SUM(status='Processing') as processing,
        SUM(status='Resolved') as resolved
       FROM complaints WHERE student_usn = ?`,
      [student_usn]
    );
    res.json({ complaints, pagination: { page, limit, total: Number(total), pages: Math.ceil(total / limit) }, stats });
  } catch (err) { next(err); }
};

// Admin gets all complaints with filters
const getAllComplaints = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, category, search } = req.query;

    const adminDept = req.user.department || 'Super Admin';

    const conditions = [];
    const params = [];
    if (status && status.trim()) { conditions.push('c.status = ?'); params.push(status); }
    if (category && category.trim()) { conditions.push('c.category = ?'); params.push(category); }
    if (search && search.trim()) {
      conditions.push('(c.title LIKE ? OR c.student_usn LIKE ? OR u.name LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    
    // Departmental routing constraints for Admins
    if (adminDept !== 'Super Admin') {
      conditions.push('c.category = ?');
      params.push(adminDept);
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
    
    // Filter stats by department if applicable
    let statsSQL = `
      SELECT COUNT(*) as total,
        SUM(status='Pending') as pending,
        SUM(status='Processing') as processing,
        SUM(status='Resolved') as resolved,
        ROUND(AVG(rating), 1) as avg_rating
      FROM complaints`;
    let statsParams = [];
    if (adminDept !== 'Super Admin') {
      statsSQL += ' WHERE category = ?';
      statsParams.push(adminDept);
    }

    const [[stats]] = await pool.query(statsSQL, statsParams);
    
    // Personal Admin Stats
    const [[adminStats]] = await pool.execute(
      `SELECT ROUND(AVG(rating), 1) as admin_avg_rating FROM complaints WHERE admin_id = ?`,
      [req.user.id]
    );
    stats.admin_avg_rating = adminStats.admin_avg_rating || null;

    // Filter categories count by department if applicable
    let catSQL = `SELECT category, COUNT(*) as count FROM complaints`;
    let catParams = [];
    if (adminDept !== 'Super Admin') {
      catSQL += ' WHERE category = ?';
      catParams.push(adminDept);
    }
    catSQL += ' GROUP BY category';
    const [categoryCounts] = await pool.query(catSQL, catParams);

    // Fetch the Admin Performance Leaderboard
    const [leaderboard] = await pool.query(`
      SELECT 
        a.id, a.name, a.designation, a.department,
        COUNT(c.complaint_id) as resolved_count,
        ROUND(AVG(c.rating), 1) as avg_rating,
        ROUND(AVG(TIMESTAMPDIFF(HOUR, c.created_at, c.resolved_at)), 1) as avg_resolution_time
      FROM admins a
      LEFT JOIN complaints c ON a.id = c.admin_id AND c.status = 'Resolved'
      GROUP BY a.id, a.name, a.designation, a.department
      ORDER BY resolved_count DESC, avg_rating DESC
    `);

    res.json({
      complaints,
      pagination: { page, limit, total: Number(total), pages: Math.ceil(total / limit) },
      stats,
      categoryCounts,
      leaderboard
    });
  } catch (err) { next(err); }
};

// Admin updates status
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Pending', 'Processing', 'Resolved'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    // Fetch existing log before update
    const [[oldComplaint]] = await pool.execute('SELECT status, history_log FROM complaints WHERE complaint_id = ?', [id]);
    if (!oldComplaint) return res.status(404).json({ message: 'Complaint not found' });

    const updatedHistory = appendHistoryLog(
      oldComplaint.history_log,
      `Status updated to ${status}`,
      req.user.name || 'Admin'
    );

    const resolved_at = status === 'Resolved' ? new Date() : null;

    const [result] = await pool.execute(
      'UPDATE complaints SET status = ?, admin_id = ?, resolved_at = ?, history_log = ? WHERE complaint_id = ?',
      [status, req.user.id, resolved_at, updatedHistory, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Complaint not found' });

    const [[complaint]] = await pool.execute(
      'SELECT * FROM complaints WHERE complaint_id = ?', [id]
    );
    const io = req.app.get('io');
    if (io) io.emit('complaintUpdated', complaint);

    // Send email notification to the student
    try {
      const [[student]] = await pool.execute(
        'SELECT email, name FROM users WHERE usn = ?', [complaint.student_usn]
      );
      if (student) {
        sendComplaintStatusEmail(student.email, student.name, complaint.title, status, complaint.admin_note)
          .catch(err => console.error('Email notification failed:', err));
      }
    } catch (emailErr) {
      console.error('Failed to send status notification email:', emailErr);
    }

    res.json({ message: 'Status updated successfully', complaint });
  } catch (err) { next(err); }
};

// Admin adds/updates note
const updateComplaintNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_note } = req.body;

    const [[oldComplaint]] = await pool.execute('SELECT admin_note, history_log FROM complaints WHERE complaint_id = ?', [id]);
    if (!oldComplaint) return res.status(404).json({ message: 'Complaint not found' });

    const updatedHistory = appendHistoryLog(
      oldComplaint.history_log,
      'Admin note added/updated',
      req.user.name || 'Admin',
      admin_note
    );

    const [result] = await pool.execute(
      'UPDATE complaints SET admin_note = ?, admin_id = ?, history_log = ? WHERE complaint_id = ?',
      [admin_note, req.user.id, updatedHistory, id]
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

// Student submits feedback/rating for a resolved complaint
const submitFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, feedback_text } = req.body;
    const student_usn = req.user.usn;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    // Check if complaint exists, is resolved, and belongs to the student
    const [[complaint]] = await pool.execute(
      'SELECT * FROM complaints WHERE complaint_id = ? AND student_usn = ?',
      [id, student_usn]
    );

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.status !== 'Resolved') {
      return res.status(400).json({ message: 'You can only leave feedback on resolved complaints' });
    }

    const updatedHistory = appendHistoryLog(
      complaint.history_log,
      `Student submitted feedback (Rating: ${rating}/5)`,
      req.user.name || 'Student',
      feedback_text
    );

    await pool.execute(
      'UPDATE complaints SET rating = ?, feedback_text = ?, history_log = ? WHERE complaint_id = ?',
      [rating, feedback_text || null, updatedHistory, id]
    );

    const [[updatedComplaint]] = await pool.execute(
      'SELECT * FROM complaints WHERE complaint_id = ?', [id]
    );

    const io = req.app.get('io');
    if (io) io.emit('complaintUpdated', updatedComplaint);

    res.json({ message: 'Feedback submitted successfully', complaint: updatedComplaint });
  } catch (err) { next(err); }
};

module.exports = {
  createComplaint,
  getStudentComplaints,
  getAllComplaints,
  updateComplaintStatus,
  updateComplaintNote,
  submitFeedback
};
