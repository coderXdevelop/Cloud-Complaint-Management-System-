const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStudent, isAdmin } = require('../middleware/role');
const { getStudentProfile, getAdminProfile } = require('../controllers/userController');

router.get('/profile', authenticate, isStudent, getStudentProfile);
router.get('/admin/profile', authenticate, isAdmin, getAdminProfile);

module.exports = router;
