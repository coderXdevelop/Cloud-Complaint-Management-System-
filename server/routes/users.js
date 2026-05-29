const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStudent, isAdmin } = require('../middleware/role');
const { getStudentProfile, getAdminProfile } = require('../controllers/userController');
const { changePassword } = require('../controllers/authController');

router.get('/profile', authenticate, isStudent, getStudentProfile);
router.get('/admin/profile', authenticate, isAdmin, getAdminProfile);

// Change password (authenticated)
router.put('/change-password', authenticate, isStudent, changePassword);
router.put('/admin/change-password', authenticate, isAdmin, changePassword);

module.exports = router;
