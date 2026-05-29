const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Send an email via Brevo transactional API
 */
const sendEmail = async (to, subject, htmlContent) => {
  const apiKey = process.env.BREVO_API_KEY;
  const recipientEmail = typeof to === 'string' ? to.trim() : '';

  if (!recipientEmail) {
    console.error('❌ Cannot send email: recipient email is empty or invalid.');
    return { success: false, reason: 'Invalid recipient email' };
  }

  if (!apiKey || apiKey === 'your_brevo_api_key_here') {
    console.warn('⚠️  BREVO_API_KEY not configured. Email not sent to:', recipientEmail);
    console.log('📧 Email would contain:', subject);
    return { success: false, reason: 'API key not configured' };
  }

  try {
    await axios.post(
      BREVO_API_URL,
      {
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'Campus CMS',
          email: (process.env.BREVO_SENDER_EMAIL || 'noreply@campus.edu').trim(),
        },
        to: [{ email: recipientEmail }],
        subject,
        htmlContent,
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    console.log('✅ Email sent successfully to:', recipientEmail);
    return { success: true };
  } catch (err) {
    console.error('❌ Email send failed to:', recipientEmail, 'Error:', err.response?.data || err.message);
    return { 
      success: false, 
      reason: err.response?.data?.message || err.message,
      code: err.response?.data?.code || null
    };
  }
};

/**
 * Send OTP email with a beautiful HTML template
 */
const sendOTP = async (email, otp, purpose = 'registration') => {
  const recipientEmail = typeof email === 'string' ? email.trim() : '';
  console.log(`🔑 [OTP DEBUG] Generated OTP for ${recipientEmail} (${purpose}): ${otp}`);

  const purposeText =
    purpose === 'registration'
      ? 'complete your student registration'
      : 'reset your password';

  const subject =
    purpose === 'registration'
      ? '🔐 Campus CMS — Verify Your Email'
      : '🔑 Campus CMS — Password Reset OTP';

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 24px;text-align:center;">
        <h1 style="color:#ffffff;font-size:24px;margin:0 0 4px 0;">🎓 Campus CMS</h1>
        <p style="color:#c7d2fe;font-size:14px;margin:0;">Cloud Based Complaint Management System</p>
      </div>

      <!-- Body -->
      <div style="padding:32px 24px;">
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
          Hello! Use the following OTP to <strong>${purposeText}</strong>. This code is valid for <strong>5 minutes</strong>.
        </p>

        <!-- OTP Box -->
        <div style="background:linear-gradient(135deg,#eef2ff,#ede9fe);border:2px dashed #818cf8;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px 0;">
          <p style="color:#6366f1;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px 0;">Your Verification Code</p>
          <p style="color:#312e81;font-size:36px;font-weight:800;letter-spacing:8px;margin:0;font-family:monospace;">${otp}</p>
        </div>

        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px 0;">
          ⚠️ If you did not request this code, please ignore this email.
        </p>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
          Do not share this code with anyone. Our team will never ask for your OTP.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">
          © ${new Date().getFullYear()} Campus Complaint Management System
        </p>
      </div>
    </div>
  </body>
  </html>`;

  return sendEmail(recipientEmail, subject, htmlContent);
};

/**
 * Send complaint status update notification email
 */
const sendComplaintStatusEmail = async (email, studentName, complaintTitle, newStatus, adminNote) => {
  const statusColors = {
    Pending: { bg: '#fef3c7', text: '#92400e', label: '⏳ Pending' },
    Processing: { bg: '#dbeafe', text: '#1e40af', label: '🔄 Processing' },
    Resolved: { bg: '#d1fae5', text: '#065f46', label: '✅ Resolved' },
  };

  const status = statusColors[newStatus] || statusColors.Pending;

  const subject = `📋 Complaint Update — "${complaintTitle}" is now ${newStatus}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 24px;text-align:center;">
        <h1 style="color:#ffffff;font-size:24px;margin:0 0 4px 0;">🎓 Campus CMS</h1>
        <p style="color:#c7d2fe;font-size:14px;margin:0;">Complaint Status Update</p>
      </div>

      <!-- Body -->
      <div style="padding:32px 24px;">
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
          Hello <strong>${studentName}</strong>, your complaint has been updated:
        </p>

        <!-- Complaint Info -->
        <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:0 0 20px 0;">
          <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Complaint</p>
          <p style="color:#111827;font-size:16px;font-weight:600;margin:0 0 12px 0;">${complaintTitle}</p>

          <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">New Status</p>
          <span style="display:inline-block;background:${status.bg};color:${status.text};padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;">
            ${status.label}
          </span>

          ${adminNote ? `
          <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px 0;">Admin Note</p>
          <p style="color:#374151;font-size:14px;margin:0;font-style:italic;">"${adminNote}"</p>
          ` : ''}
        </div>

        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
          Log in to your dashboard for more details.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">
          © ${new Date().getFullYear()} Campus Complaint Management System
        </p>
      </div>
    </div>
  </body>
  </html>`;

  return sendEmail(email, subject, htmlContent);
};

module.exports = { sendOTP, sendComplaintStatusEmail };
