const crypto = require('crypto');

/**
 * Generate a cryptographically random 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Save OTP to database (deletes any previous OTPs for same email+purpose first)
 */
const saveOTP = async (pool, email, otp, purpose, role = 'student') => {
  // Delete old OTPs for this email + purpose
  await pool.execute(
    'DELETE FROM otp_codes WHERE email = ? AND purpose = ?',
    [email, purpose]
  );

  // Insert new OTP with 5-minute expiry
  await pool.execute(
    'INSERT INTO otp_codes (email, otp, purpose, role, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
    [email, otp, purpose, role]
  );
};

/**
 * Verify OTP: checks existence, expiry, and usage
 * Returns { valid: true } or { valid: false, message: '...' }
 */
const verifyOTP = async (pool, email, otp, purpose) => {
  const [rows] = await pool.execute(
    'SELECT * FROM otp_codes WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1',
    [email, purpose]
  );

  if (!rows.length) {
    return { valid: false, message: 'No OTP found. Please request a new one.' };
  }

  const record = rows[0];

  if (record.verified) {
    return { valid: false, message: 'OTP already used. Please request a new one.' };
  }

  if (new Date(record.expires_at) < new Date()) {
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (record.otp !== otp) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }

  // Mark as verified
  await pool.execute(
    'UPDATE otp_codes SET verified = TRUE WHERE id = ?',
    [record.id]
  );

  return { valid: true };
};

/**
 * Cleanup expired OTPs (can be called periodically)
 */
const cleanupExpiredOTPs = async (pool) => {
  await pool.execute('DELETE FROM otp_codes WHERE expires_at < NOW()');
};

module.exports = { generateOTP, saveOTP, verifyOTP, cleanupExpiredOTPs };
