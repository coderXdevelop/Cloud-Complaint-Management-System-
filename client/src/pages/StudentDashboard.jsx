import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, PlusCircle, Loader2, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [data, setData] = useState({ complaints: [], stats: null, pagination: null });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.get('/complaints/student?limit=5');
      setData(res.data);
    } catch {/* ignore */} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (updated) => {
      setData(prev => ({
        ...prev,
        complaints: prev.complaints.map(c =>
          c.complaint_id === updated.complaint_id ? { ...c, ...updated } : c
        ),
        stats: prev.stats ? {
          ...prev.stats,
          pending: prev.complaints.filter(c => (c.complaint_id === updated.complaint_id ? updated.status : c.status) === 'Pending').length,
          processing: prev.complaints.filter(c => (c.complaint_id === updated.complaint_id ? updated.status : c.status) === 'Processing').length,
          resolved: prev.complaints.filter(c => (c.complaint_id === updated.complaint_id ? updated.status : c.status) === 'Resolved').length,
        } : null,
      }));
    };
    socket.on('complaintUpdated', handler);
    return () => socket.off('complaintUpdated', handler);
  }, [socket]);

  if (loading) return <Layout title="Dashboard"><div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" text="Loading dashboard..." /></div></Layout>;

  const { stats, complaints } = data;

  return (
    <Layout title="Student Dashboard">
      <div className="space-y-6 animate-slide-in">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold">Welcome back, {user?.name}! 👋</h2>
          <p className="text-indigo-200 text-sm mt-1">USN: {user?.usn} · Semester {user?.semester || 'N/A'}</p>
          <Link to="/add-complaint" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all">
            <PlusCircle className="w-4 h-4" /> File a Complaint
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Complaints" value={stats?.total || 0} icon={FileText} color="indigo" />
          <StatCard title="Pending" value={stats?.pending || 0} icon={Clock} color="amber" />
          <StatCard title="Processing" value={stats?.processing || 0} icon={Loader2} color="blue" />
          <StatCard title="Resolved" value={stats?.resolved || 0} icon={CheckCircle2} color="emerald" />
        </div>

        {/* Recent Complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Complaints</h3>
            <Link to="/track-complaints" className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {complaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No complaints yet.</p>
              <Link to="/add-complaint" className="btn-primary mt-4 inline-flex"><PlusCircle className="w-4 h-4" /> File First Complaint</Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Title', 'Category', 'Status', 'Date', 'Admin Note'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {complaints.map(c => (
                    <tr key={c.complaint_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-3 py-3 font-medium text-gray-900 dark:text-white max-w-[160px] truncate">{c.title}</td>
                      <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{c.category}</td>
                      <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(c.created_at)}</td>
                      <td className="px-3 py-3 text-gray-500 dark:text-gray-400 max-w-[180px] truncate">{c.admin_note || <span className="text-gray-300 dark:text-gray-600 italic">No note yet</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
