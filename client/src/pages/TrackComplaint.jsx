import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle2, Loader2, MessageSquare, Image as ImageIcon } from 'lucide-react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';
import toast from 'react-hot-toast';

const TrackComplaint = () => {
  const { socket } = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [imgModal, setImgModal] = useState(null);

  const fetchComplaints = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/complaints/student?page=${page}&limit=8`);
      setComplaints(data.complaints);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load complaints'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (updated) => {
      setComplaints(prev => prev.map(c => c.complaint_id === updated.complaint_id ? { ...c, ...updated } : c));
      toast.success(`Complaint #${updated.complaint_id} status updated to ${updated.status}`, { icon: '🔔' });
    };
    socket.on('complaintUpdated', handler);
    return () => socket.off('complaintUpdated', handler);
  }, [socket]);

  return (
    <Layout title="My Complaints">
      <div className="space-y-4 animate-slide-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Track Your Complaints</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} total</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading complaints..." /></div>
        ) : complaints.length === 0 ? (
          <div className="card text-center py-16">
            <FileText className="w-14 h-14 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No complaints filed yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map(c => (
              <div key={c.complaint_id} className="card hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => setExpanded(expanded === c.complaint_id ? null : c.complaint_id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">#{c.complaint_id}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{c.title}</h3>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">{c.category}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <StatusBadge status={c.status} />
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(c.created_at)}
                      </span>
                      {c.image && (
                        <button onClick={e => { e.stopPropagation(); setImgModal(`/uploads/${c.image}`); }}
                          className="text-xs text-indigo-500 flex items-center gap-1 hover:underline">
                          <ImageIcon className="w-3 h-3" /> View Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {expanded === c.complaint_id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3 animate-fade-in">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{c.description}</p>
                    </div>
                    {c.admin_note && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-3">
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3 h-3" /> Admin Note
                        </p>
                        <p className="text-sm text-indigo-800 dark:text-indigo-200">{c.admin_note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchComplaints} />
      </div>

      {/* Image Modal */}
      {imgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setImgModal(null)}>
          <img src={imgModal} alt="Complaint evidence" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </Layout>
  );
};

export default TrackComplaint;
