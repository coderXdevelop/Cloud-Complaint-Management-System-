import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock, Hash, Phone, BookOpen, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

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
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', usn: '', phone: '', semester: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name, email: form.email, password: form.password,
        usn: form.usn.toUpperCase(), phone: form.phone, semester: parseInt(form.semester) || null,
      });
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
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
