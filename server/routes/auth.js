const express = require('express');
const router = express.Router();
const {
  register,
  registerSendOTP,
  registerVerifyOTP,
  login,
  adminLogin,
  forgotPasswordSendOTP,
  forgotPasswordVerifyOTP,
  resetPassword,
} = require('../controllers/authController');
const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/rateLimiter');

// Legacy register (no OTP)
router.post('/register', register);

// OTP-based registration
router.post('/register/send-otp', otpSendLimiter, registerSendOTP);
router.post('/register/verify-otp', otpVerifyLimiter, registerVerifyOTP);

// Login
router.post('/login', login);
router.post('/admin/login', adminLogin);

// Forgot password
router.post('/forgot-password/send-otp', otpSendLimiter, forgotPasswordSendOTP);
router.post('/forgot-password/verify-otp', otpVerifyLimiter, forgotPasswordVerifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
