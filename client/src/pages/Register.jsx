import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock, Hash, Phone, BookOpen, Eye, EyeOff, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

// Defined OUTSIDE Register so React never unmounts/remounts it on re-render
const Field = ({ id, name, label, icon: Icon, type = 'text', placeholder, required = true, form, onChange, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
    {children || (
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id={id} name={name} type={type} value={form[name]} onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          required={required}
        />
      </div>
    )}
  </div>
);

const Register = () => {
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP verify
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', usn: '', phone: '', semester: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Step 1: Submit form → Send OTP
  const handleSendOTP = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await api.post('/auth/register/send-otp', {
        name: form.name, email: form.email, password: form.password,
        usn: form.usn.toUpperCase(), phone: form.phone, semester: parseInt(form.semester) || null,
      });
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
    if (!/^\d*$/.test(value)) return; // only digits
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next
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
  const handleVerifyOTP = async e => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) return toast.error('Please enter the complete OTP');
    setLoading(true);
    try {
      await api.post('/auth/register/verify-otp', {
        name: form.name, email: form.email, password: form.password,
        usn: form.usn.toUpperCase(), phone: form.phone, semester: parseInt(form.semester) || null,
        otp: otpCode,
      });
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/register/send-otp', {
        name: form.name, email: form.email, password: form.password,
        usn: form.usn.toUpperCase(), phone: form.phone, semester: parseInt(form.semester) || null,
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-gray-900 to-violet-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-xl mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Student Account</h1>
          <p className="text-gray-400 text-sm mt-1">Join the Campus Complaint System</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'Verify Email' },
          ].map(({ num, label }, i) => (
            <div key={num} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= num
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white/10 text-gray-400'
                }`}>
                  {step > num ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : num}
                </div>
                <span className={`text-xs font-medium transition-colors ${step >= num ? 'text-white' : 'text-gray-500'}`}>{label}</span>
              </div>
              {i < 1 && <div className={`w-12 h-0.5 transition-colors duration-300 ${step > 1 ? 'bg-indigo-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">

          {/* Step 1: Registration Form */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <Field id="reg-name" name="name" label="Full Name" icon={User} placeholder="John Doe" form={form} onChange={handleChange} />
                <Field id="reg-usn" name="usn" label="USN" icon={Hash} placeholder="1RV21CS001" form={form} onChange={handleChange} />
              </div>
              <Field id="reg-email" name="email" label="Email Address" icon={Mail} type="email" placeholder="you@college.edu" form={form} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="reg-password" name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      required minLength={6} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="reg-confirm-password" name="confirmPassword" type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      required />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field id="reg-phone" name="phone" label="Phone (optional)" icon={Phone} placeholder="9876543210" required={false} form={form} onChange={handleChange} />
                <div>
                  <label htmlFor="reg-semester" className="block text-sm font-medium text-gray-300 mb-1.5">Semester</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select id="reg-semester" name="semester" value={form.semester} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none">
                      <option value="" className="bg-gray-900">Select sem</option>
                      {SEMESTERS.map(s => <option key={s} value={s} className="bg-gray-900">Semester {s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" id="register-submit-btn" disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                {loading && <LoadingSpinner size="sm" />}
                {loading ? 'Sending OTP...' : 'Send Verification OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="animate-fade-in">
              <button
                onClick={() => { setStep(1); setOtp(Array(OTP_LENGTH).fill('')); }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Back to form
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 rounded-2xl mb-3">
                  <Mail className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Verify Your Email</h2>
                <p className="text-gray-400 text-sm mt-1">
                  We've sent a 6-digit code to <span className="text-indigo-400 font-medium">{form.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP}>
                {/* OTP Input Boxes */}
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
                          ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-white/5 border-white/20 text-white focus:border-indigo-400 focus:bg-indigo-500/10'
                        }`}
                      id={`otp-input-${i}`}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading || otp.join('').length !== OTP_LENGTH}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <LoadingSpinner size="sm" />}
                  {loading ? 'Verifying...' : 'Verify & Create Account'}
                </button>
              </form>

              {/* Resend */}
              <div className="text-center mt-4">
                {resendTimer > 0 ? (
                  <p className="text-gray-500 text-sm">
                    Resend OTP in <span className="text-indigo-400 font-mono font-semibold">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Didn't receive the code? Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          <p className="text-center text-gray-400 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
