import { useState, useEffect } from 'react';
import { User, Mail, Hash, Phone, BookOpen, ShieldCheck, Calendar, GraduationCap, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Change password state
  const [showChangePass, setShowChangePass] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    const endpoint = isAdmin ? '/users/admin/profile' : '/users/profile';
    api.get(endpoint)
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handlePassChange = (e) => setPassForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('New passwords do not match');
    if (passForm.currentPassword === passForm.newPassword) return toast.error('New password must be different');

    setPassLoading(true);
    try {
      const endpoint = isAdmin ? '/users/admin/change-password' : '/users/change-password';
      await api.put(endpoint, {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePass(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) return <Layout title="Profile"><div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading profile..." /></div></Layout>;

  return (
    <Layout title="Profile">
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-in">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile?.name}</h2>
              <p className="text-indigo-200 flex items-center gap-2 mt-1">
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                {isAdmin ? profile?.designation || 'Administrator' : `USN: ${profile?.usn}`}
              </p>
              <p className="text-indigo-300 text-sm mt-1">Member since {formatDate(profile?.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Account Information</h3>
          <div>
            <InfoRow icon={User} label="Full Name" value={profile?.name} />
            <InfoRow icon={Mail} label="Email Address" value={profile?.email} />
            <InfoRow icon={Phone} label="Phone Number" value={profile?.phone} />
            {isAdmin ? (
              <InfoRow icon={ShieldCheck} label="Designation" value={profile?.designation} />
            ) : (
              <>
                <InfoRow icon={Hash} label="University Seat Number (USN)" value={profile?.usn} />
                <InfoRow icon={BookOpen} label="Current Semester" value={profile?.semester ? `Semester ${profile.semester}` : null} />
              </>
            )}
            <InfoRow icon={Calendar} label="Registered On" value={formatDate(profile?.created_at)} />
          </div>
        </div>

        {/* Change Password Section */}
        <div className="card">
          <button
            onClick={() => setShowChangePass(!showChangePass)}
            className="w-full flex items-center justify-between"
            id="toggle-change-password"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Update your account password</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showChangePass ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showChangePass && (
            <form onSubmit={handleChangePassword} className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 space-y-4 animate-fade-in">
              {/* Current Password */}
              <div>
                <label htmlFor="current-password" className="label">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="current-password"
                    name="currentPassword"
                    type={showPass.current ? 'text' : 'password'}
                    value={passForm.currentPassword}
                    onChange={handlePassChange}
                    placeholder="Enter current password"
                    className="input pl-10 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(p => ({ ...p, current: !p.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showPass.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="label">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="new-password"
                    name="newPassword"
                    type={showPass.new ? 'text' : 'password'}
                    value={passForm.newPassword}
                    onChange={handlePassChange}
                    placeholder="Enter new password (min 6 chars)"
                    className="input pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass(p => ({ ...p, new: !p.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showPass.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirm-new-password" className="label">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type={showPass.confirm ? 'text' : 'password'}
                    value={passForm.confirmPassword}
                    onChange={handlePassChange}
                    placeholder="Confirm new password"
                    className="input pl-10 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(p => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showPass.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={passLoading} className="btn-primary" id="change-password-submit">
                  {passLoading ? <><LoadingSpinner size="sm" /> Updating...</> : '🔒 Update Password'}
                </button>
                <button type="button" onClick={() => { setShowChangePass(false); setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                  className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
