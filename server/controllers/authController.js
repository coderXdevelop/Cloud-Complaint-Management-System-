const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateOTP, saveOTP, verifyOTP } = require('../utils/otpHelper');
const { sendOTP } = require('../services/emailService');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ─────────────────────────────────────────────
//  Student Registration — Step 1: Send OTP
// ─────────────────────────────────────────────
const registerSendOTP = async (req, res, next) => {
  try {
    const { name, email, password, usn, phone, semester } = req.body;
    if (!name || !email || !password || !usn)
      return res.status(400).json({ message: 'Name, email, password and USN are required' });

    const trimmedEmail = email.trim();
    const trimmedUSN = usn.trim().toUpperCase();

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Check for existing user
    const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existingEmail.length > 0)
      return res.status(409).json({ message: 'Email is already registered' });

    const [existingUSN] = await pool.execute('SELECT id FROM users WHERE usn = ?', [trimmedUSN]);
    if (existingUSN.length > 0)
      return res.status(409).json({ message: 'USN is already registered' });

    // Generate and send OTP
    const otp = generateOTP();
    await saveOTP(pool, trimmedEmail, otp, 'registration', 'student');
    const emailResult = await sendOTP(trimmedEmail, otp, 'registration');

    if (!emailResult.success) {
      const isInvalidEmailError = emailResult.code === 'invalid_parameter' || 
                                  (emailResult.reason && emailResult.reason.toLowerCase().includes('email is not valid'));
      
      if (isInvalidEmailError) {
        return res.status(400).json({ 
          message: `The email address is invalid: "${trimmedEmail}". Please check your email spelling.` 
        });
      }

      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        console.warn(`⚠️ Email delivery failed (${emailResult.reason}), but proceeding since we are in development mode.`);
        return res.json({ 
          message: `OTP generated. (Email delivery failed: ${emailResult.reason || 'Invalid email'}. Check the server terminal console for the OTP).` 
        });
      }

      if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'your_brevo_api_key_here') {
        return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
      }
    }

    res.json({ message: 'OTP sent to your email. Please verify to complete registration.' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
//  Student Registration — Step 2: Verify OTP & Create Account
// ─────────────────────────────────────────────
const registerVerifyOTP = async (req, res, next) => {
  try {
    const { name, email, password, usn, phone, semester, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required' });

    if (!name || !password || !usn)
      return res.status(400).json({ message: 'Registration data is incomplete' });

    const trimmedEmail = email.trim();
    const trimmedUSN = usn.trim().toUpperCase();
    const trimmedOTP = otp.trim();

    // Verify OTP
    const otpResult = await verifyOTP(pool, trimmedEmail, trimmedOTP, 'registration');
    if (!otpResult.valid)
      return res.status(400).json({ message: otpResult.message });

    // Double-check no duplicate was created while OTP was pending
    const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existingEmail.length > 0)
      return res.status(409).json({ message: 'Email is already registered' });

    const [existingUSN] = await pool.execute('SELECT id FROM users WHERE usn = ?', [trimmedUSN]);
    if (existingUSN.length > 0)
      return res.status(409).json({ message: 'USN is already registered' });

    // Create the user
    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO users (name, email, password, usn, phone, semester) VALUES (?, ?, ?, ?, ?, ?)',
      [name, trimmedEmail, hashed, trimmedUSN, phone || null, semester || null]
    );

    res.status(201).json({ message: 'Email verified! Student registered successfully.' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
//  Legacy register (kept for backward compatibility)
// ─────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, usn, phone, semester } = req.body;
    if (!name || !email || !password || !usn)
      return res.status(400).json({ message: 'Name, email, password and USN are required' });

    const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0)
      return res.status(409).json({ message: 'Email is already registered' });

    const [existingUSN] = await pool.execute('SELECT id FROM users WHERE usn = ?', [usn]);
    if (existingUSN.length > 0)
      return res.status(409).json({ message: 'USN is already registered' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO users (name, email, password, usn, phone, semester) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashed, usn, phone || null, semester || null]
    );
    res.status(201).json({ message: 'Student registered successfully' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
//  Student Login
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const trimmedEmail = email.trim();

    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [trimmedEmail]);
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

// ─────────────────────────────────────────────
//  Admin Login
// ─────────────────────────────────────────────
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const trimmedEmail = email.trim();

    const [admins] = await pool.execute('SELECT * FROM admins WHERE email = ?', [trimmedEmail]);
    if (!admins.length) return res.status(401).json({ message: 'Invalid credentials' });

    const admin = admins[0];
    if (!(await bcrypt.compare(password, admin.password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken({ id: admin.id, role: 'admin', name: admin.name, department: admin.department });
    res.json({
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, designation: admin.designation, phone: admin.phone, department: admin.department, role: 'admin' },
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
//  Forgot Password — Step 1: Send OTP
// ─────────────────────────────────────────────
const forgotPasswordSendOTP = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const trimmedEmail = email.trim();
    const userRole = role === 'admin' ? 'admin' : 'student';
    const table = userRole === 'admin' ? 'admins' : 'users';

    console.log('Forgot Password Request Details:', { email, trimmedEmail, role, userRole, table });

    // Check if user exists
    const [rows] = await pool.execute(`SELECT id, email FROM ${table} WHERE email = ?`, [trimmedEmail]);
    if (!rows.length) {
      console.log('Forgot Password: User not found in table', table, 'for email', trimmedEmail);
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate and send OTP
    const otp = generateOTP();
    await saveOTP(pool, trimmedEmail, otp, 'forgot_password', userRole);
    const emailResult = await sendOTP(trimmedEmail, otp, 'forgot_password');

    if (!emailResult.success) {
      const isInvalidEmailError = emailResult.code === 'invalid_parameter' || 
                                  (emailResult.reason && emailResult.reason.toLowerCase().includes('email is not valid'));
      
      if (isInvalidEmailError) {
        return res.status(400).json({ 
          message: `The email address is invalid: "${trimmedEmail}". Please check your email spelling.` 
        });
      }

      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        console.warn(`⚠️ Email delivery failed (${emailResult.reason}), but proceeding since we are in development mode.`);
        return res.json({ 
          message: `OTP generated. (Email delivery failed: ${emailResult.reason || 'Invalid email'}. Check the server terminal console for the OTP).` 
        });
      }

      if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'your_brevo_api_key_here') {
        return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
      }
    }

    res.json({ message: 'OTP sent to your email for password reset.' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
//  Forgot Password — Step 2: Verify OTP → Get Reset Token
// ─────────────────────────────────────────────
const forgotPasswordVerifyOTP = async (req, res, next) => {
  try {
    const { email, otp, role } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const trimmedEmail = email.trim();
    const trimmedOTP = otp.trim();

    const otpResult = await verifyOTP(pool, trimmedEmail, trimmedOTP, 'forgot_password');
    if (!otpResult.valid)
      return res.status(400).json({ message: otpResult.message });

    // Generate a short-lived reset token (10 minutes)
    const userRole = role === 'admin' ? 'admin' : 'student';
    const resetToken = jwt.sign(
      { email: trimmedEmail, role: userRole, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({ message: 'OTP verified successfully.', resetToken });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
//  Forgot Password — Step 3: Reset Password
// ─────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword)
      return res.status(400).json({ message: 'Reset token and new password are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please start over.' });
    }

    if (decoded.purpose !== 'password_reset')
      return res.status(400).json({ message: 'Invalid reset token.' });

    const table = decoded.role === 'admin' ? 'admins' : 'users';
    const hashed = await bcrypt.hash(newPassword, 10);

    const [result] = await pool.execute(
      `UPDATE ${table} SET password = ? WHERE email = ?`,
      [hashed, decoded.email]
    );

    if (!result.affectedRows)
      return res.status(404).json({ message: 'Account not found.' });

    res.json({ message: 'Password reset successfully! You can now login with your new password.' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
//  Change Password (Authenticated)
// ─────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current password and new password are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    if (currentPassword === newPassword)
      return res.status(400).json({ message: 'New password must be different from current password' });

    const table = req.user.role === 'admin' ? 'admins' : 'users';
    const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [req.user.id]);
    if (!rows.length)
      return res.status(404).json({ message: 'Account not found' });

    const user = rows[0];
    if (!(await bcrypt.compare(currentPassword, user.password)))
      return res.status(401).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.execute(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashed, req.user.id]);

    res.json({ message: 'Password changed successfully!' });
  } catch (err) { next(err); }
};

module.exports = {
  register,
  registerSendOTP,
  registerVerifyOTP,
  login,
  adminLogin,
  forgotPasswordSendOTP,
  forgotPasswordVerifyOTP,
  resetPassword,
  changePassword,
};
