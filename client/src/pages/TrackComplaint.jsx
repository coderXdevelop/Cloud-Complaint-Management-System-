import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle2, Loader2, MessageSquare, Image as ImageIcon, Star } from 'lucide-react';
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
  const [ratingInput, setRatingInput] = useState(0);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleFeedbackSubmit = async (e, complaintId) => {
    e.preventDefault();
    e.stopPropagation();
    if (ratingInput < 1 || ratingInput > 5) {
      toast.error('Please select a rating between 1 and 5 stars.');
      return;
    }
    setSubmittingFeedback(true);
    try {
      const { data } = await api.put(`/complaints/${complaintId}/feedback`, {
        rating: ratingInput,
        feedback_text: feedbackInput
      });
      toast.success('Thank you for your feedback!');
      setComplaints(prev => prev.map(c => c.complaint_id === complaintId ? { ...c, ...data.complaint } : c));
      setRatingInput(0);
      setFeedbackInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

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
                onClick={() => {
                  setExpanded(expanded === c.complaint_id ? null : c.complaint_id);
                  setRatingInput(0);
                  setFeedbackInput('');
                  setHoverRating(0);
                }}>
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

                    {c.status === 'Resolved' && (
                      <div className="border-t border-gray-100 dark:border-gray-800/80 pt-3">
                        {c.rating !== null && c.rating !== undefined ? (
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/40 rounded-xl p-3">
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                              Your Rating & Feedback
                            </p>
                            <div className="flex items-center gap-1 mb-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-4 h-4 ${star <= c.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-650'}`} />
                              ))}
                            </div>
                            {c.feedback_text && (
                              <p className="text-sm text-emerald-800 dark:text-emerald-300 italic font-medium">
                                "{c.feedback_text}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-850 rounded-xl p-3.5 space-y-2.5" onClick={e => e.stopPropagation()}>
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Rate the Resolution & Share Feedback</p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingInput(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="p-0.5 transition-transform hover:scale-115"
                                >
                                  <Star className={`w-5 h-5 ${star <= (hoverRating || ratingInput) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-650'}`} />
                                </button>
                              ))}
                            </div>
                            <textarea
                              placeholder="Optional comments about the resolution..."
                              value={feedbackInput}
                              onChange={e => setFeedbackInput(e.target.value)}
                              className="input text-xs min-h-[60px] resize-none"
                            />
                            <button
                              onClick={(e) => handleFeedbackSubmit(e, c.complaint_id)}
                              disabled={submittingFeedback || ratingInput === 0}
                              className="btn-primary py-1.5 px-3 text-xs w-full sm:w-auto"
                            >
                              {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                          </div>
                        )}
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
