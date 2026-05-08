import { useState, useEffect } from 'react';
import { User, Mail, Hash, Phone, BookOpen, ShieldCheck, Calendar, GraduationCap } from 'lucide-react';
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

  useEffect(() => {
    const endpoint = isAdmin ? '/users/admin/profile' : '/users/profile';
    api.get(endpoint)
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

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

        <div className="card bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            ⚠️ To update your profile information, please contact the system administrator.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
