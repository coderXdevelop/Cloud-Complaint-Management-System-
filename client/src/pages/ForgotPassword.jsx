import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1=email, 2=OTP, 3=new password
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/send-otp', { email, role });
      toast.success(res.data?.message || 'OTP sent to your email!');
      setStep(2);
      setResendTimer(RESEND_COOLDOWN);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!paste) return;
    const newOtp = [...otp];
    paste.split('').forEach((ch, i) => { newOtp[i] = ch; });
    setOtp(newOtp);
    const nextIndex = Math.min(paste.length, OTP_LENGTH - 1);
    otpRefs.current[nextIndex]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) return toast.error('Please enter the complete OTP');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/verify-otp', { email, otp: otpCode, role });
      toast.success('OTP verified!');
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword });
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/send-otp', { email, role });
      toast.success(res.data?.message || 'New OTP sent!');
      setOtp(Array(OTP_LENGTH).fill(''));
      setResendTimer(RESEND_COOLDOWN);
      otpRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [
    { num: 1, label: 'Email' },
    { num: 2, label: 'Verify' },
    { num: 3, label: 'New Password' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-gray-900 to-violet-950 flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl mb-4">
            <KeyRound className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-gray-400 text-sm mt-1">We'll help you get back in</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {stepLabels.map(({ num, label }, i) => (
            <div key={num} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= num
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-white/10 text-gray-500'
                }`}>
                  {step > num ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : num}
                </div>
                <span className={`text-xs font-medium transition-colors hidden sm:block ${step >= num ? 'text-white' : 'text-gray-500'}`}>{label}</span>
              </div>
              {i < 2 && <div className={`w-8 h-0.5 transition-colors duration-300 ${step > num ? 'bg-amber-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">

          {/* ── Step 1: Enter Email ── */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5 animate-fade-in">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">I am a</label>
                <div className="flex bg-white/10 rounded-xl p-1">
                  {['student', 'admin'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        role === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {r === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} id="forgot-send-otp-btn"
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <LoadingSpinner size="sm" />}
                {loading ? 'Sending OTP...' : 'Send Reset OTP'}
              </button>
            </form>
          )}

          {/* ── Step 2: Verify OTP ── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <button
                onClick={() => { setStep(1); setOtp(Array(OTP_LENGTH).fill('')); }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Change email
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/10 rounded-2xl mb-3">
                  <Mail className="w-7 h-7 text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Enter Verification Code</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Sent to <span className="text-amber-400 font-medium">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP}>
                <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none
                        ${digit
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                          : 'bg-white/5 border-white/20 text-white focus:border-amber-400 focus:bg-amber-500/10'
                        }`}
                      id={`forgot-otp-input-${i}`}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading || otp.join('').length !== OTP_LENGTH}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <LoadingSpinner size="sm" />}
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>

              <div className="text-center mt-4">
                {resendTimer > 0 ? (
                  <p className="text-gray-500 text-sm">
                    Resend in <span className="text-amber-400 font-mono font-semibold">{resendTimer}s</span>
                  </p>
                ) : (
                  <button onClick={handleResendOTP} disabled={loading}
                    className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors disabled:opacity-50">
                    Didn't receive the code? Resend
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Set New Password ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-fade-in">
              <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 rounded-2xl mb-3">
                  <Lock className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Set New Password</h2>
                <p className="text-gray-400 text-sm mt-1">Choose a strong password for your account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="reset-new-password"
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="reset-confirm-password"
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} id="reset-password-btn"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <LoadingSpinner size="sm" />}
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="text-center text-gray-400 text-sm mt-5">
            Remember your password?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
