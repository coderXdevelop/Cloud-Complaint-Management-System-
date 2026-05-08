import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, FileText, Clock, CheckCircle2, Loader2, Image as ImageIcon, StickyNote, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';

const CATEGORIES = ['Infrastructure', 'Academic', 'Hostel', 'Transport', 'Library', 'Cafeteria', 'Sports', 'IT/Network', 'Administration', 'Other'];
const STATUSES = ['Pending', 'Processing', 'Resolved'];

const AdminDashboard = () => {
  const [data, setData] = useState({ complaints: [], stats: null, pagination: { page: 1, pages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', category: '' });
  const [modal, setModal] = useState({ open: false, complaint: null, newStatus: '', loading: false });
  const [noteModal, setNoteModal] = useState({ open: false, complaint: null, note: '', loading: false });
  const [imgModal, setImgModal] = useState(null);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      // Build params without empty values
      const raw = { page: pg, limit: 10, ...filters };
      const clean = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== '' && v !== null && v !== undefined));
      const params = new URLSearchParams(clean);
      const { data: res } = await api.get(`/complaints/all?${params}`);
      setData(res);
    } catch { toast.error('Failed to load complaints'); }
    finally { setLoading(false); }
  }, [filters, page]);


  useEffect(() => { fetchData(); }, []);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchData(1); };

  const openStatusModal = (complaint, newStatus) => setModal({ open: true, complaint, newStatus, loading: false });

  const confirmStatus = async () => {
    setModal(m => ({ ...m, loading: true }));
    try {
      await api.put(`/complaints/${modal.complaint.complaint_id}/status`, { status: modal.newStatus });
      toast.success(`Status updated to ${modal.newStatus}`);
      setModal({ open: false, complaint: null, newStatus: '', loading: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
      setModal(m => ({ ...m, loading: false }));
    }
  };

  const saveNote = async () => {
    setNoteModal(m => ({ ...m, loading: true }));
    try {
      await api.put(`/complaints/${noteModal.complaint.complaint_id}/note`, { admin_note: noteModal.note });
      toast.success('Note saved successfully');
      setNoteModal({ open: false, complaint: null, note: '', loading: false });
      fetchData();
    } catch {
      toast.error('Failed to save note');
      setNoteModal(m => ({ ...m, loading: false }));
    }
  };

  const { stats, complaints, pagination } = data;

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6 animate-slide-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Complaints" value={stats?.total || 0} icon={FileText} color="indigo" />
          <StatCard title="Pending" value={stats?.pending || 0} icon={Clock} color="amber" />
          <StatCard title="Processing" value={stats?.processing || 0} icon={Loader2} color="blue" />
          <StatCard title="Resolved" value={stats?.resolved || 0} icon={CheckCircle2} color="emerald" />
        </div>

        {/* Filters */}
        <div className="card">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="admin-search"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="Search by title, USN, or student name..."
                className="input pl-9"
              />
            </div>
            <select id="admin-filter-status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input sm:w-40">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select id="admin-filter-category" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="input sm:w-44">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="btn-primary whitespace-nowrap"><Search className="w-4 h-4" /> Search</button>
            <button type="button" onClick={() => { setFilters({ search: '', status: '', category: '' }); setPage(1); setTimeout(() => fetchData(1), 0); }} className="btn-secondary">
              <RefreshCw className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Complaints Table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">All Complaints ({pagination.total})</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading..." /></div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No complaints found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    {['#ID', 'Student', 'Title', 'Category', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {complaints.map(c => (
                    <tr key={c.complaint_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">#{c.complaint_id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white text-xs">{c.student_name}</div>
                        <div className="text-gray-400 text-xs">{c.student_usn}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{c.title}</div>
                        {c.admin_note && <div className="text-xs text-indigo-500 truncate mt-0.5">Note: {c.admin_note}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{c.category}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(c.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {STATUSES.filter(s => s !== c.status).map(s => (
                            <button key={s} onClick={() => openStatusModal(c, s)}
                              className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                                s === 'Pending' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100' :
                                s === 'Processing' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100' :
                                'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                              }`}>
                              → {s}
                            </button>
                          ))}
                          <button onClick={() => setNoteModal({ open: true, complaint: c, note: c.admin_note || '', loading: false })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all" title="Add note">
                            <StickyNote className="w-3.5 h-3.5" />
                          </button>
                          {c.image && (
                            <button onClick={() => setImgModal(`/uploads/${c.image}`)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all" title="View image">
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-6 pb-4">
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={(p) => { setPage(p); fetchData(p); }} />
          </div>
        </div>
      </div>

      {/* Confirm Status Modal */}
      <ConfirmModal
        isOpen={modal.open}
        title="Update Complaint Status"
        message={`Change complaint "${modal.complaint?.title}" status to "${modal.newStatus}"?`}
        onConfirm={confirmStatus}
        onCancel={() => setModal({ open: false, complaint: null, newStatus: '', loading: false })}
        loading={modal.loading}
      />

      {/* Note Modal */}
      {noteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setNoteModal(m => ({ ...m, open: false }))} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add Admin Note</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Complaint: <span className="font-medium text-gray-700 dark:text-gray-300">{noteModal.complaint?.title}</span></p>
            <textarea
              value={noteModal.note}
              onChange={e => setNoteModal(m => ({ ...m, note: e.target.value }))}
              className="input min-h-[100px] resize-none mb-4"
              placeholder="Add your note for the student..."
              id="admin-note-textarea"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setNoteModal(m => ({ ...m, open: false }))} className="btn-secondary">Cancel</button>
              <button onClick={saveNote} disabled={noteModal.loading} className="btn-primary">
                {noteModal.loading ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setImgModal(null)}>
          <img src={imgModal} alt="Complaint evidence" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
