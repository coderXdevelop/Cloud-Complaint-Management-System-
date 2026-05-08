const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStudent, isAdmin } = require('../middleware/role');
const upload = require('../middleware/upload');
const {
  createComplaint, getStudentComplaints,
  getAllComplaints, updateComplaintStatus, updateComplaintNote,
} = require('../controllers/complaintController');

router.post('/', authenticate, isStudent, upload.single('image'), createComplaint);
router.get('/student', authenticate, isStudent, getStudentComplaints);
router.get('/all', authenticate, isAdmin, getAllComplaints);
router.put('/:id/status', authenticate, isAdmin, updateComplaintStatus);
router.put('/:id/note', authenticate, isAdmin, updateComplaintNote);

module.exports = router;
