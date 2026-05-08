import { useState, useEffect, useCallback } from 'react';
import { Upload, ImageIcon, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const CATEGORIES = ['Infrastructure', 'Academic', 'Hostel', 'Transport', 'Library', 'Cafeteria', 'Sports', 'IT/Network', 'Administration', 'Other'];

const AddComplaint = () => {
  const [form, setForm] = useState({ title: '', category: '', description: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleFileInput = e => handleFile(e.target.files[0]);

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const removeImage = () => { setImage(null); setPreview(null); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.category || !form.description.trim())
      return toast.error('Please fill all required fields');

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);

      await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Complaint submitted successfully!');
      setForm({ title: '', category: '', description: '' });
      setImage(null); setPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally { setLoading(false); }
  };

  return (
    <Layout title="Add Complaint">
      <div className="max-w-2xl mx-auto animate-slide-in">
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">File a New Complaint</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Describe your issue clearly. Our admin team will review it promptly.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="complaint-title" className="label">Complaint Title *</label>
              <input id="complaint-title" name="title" value={form.title} onChange={handleChange}
                placeholder="e.g. Broken projector in Room 301"
                className="input" required maxLength={200} />
            </div>

            <div>
              <label htmlFor="complaint-category" className="label">Category *</label>
              <select id="complaint-category" name="category" value={form.category} onChange={handleChange}
                className="input" required>
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="complaint-description" className="label">Description *</label>
              <textarea id="complaint-description" name="description" value={form.description} onChange={handleChange}
                placeholder="Provide detailed information about the issue..."
                className="input min-h-[120px] resize-y" required maxLength={2000} />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/2000</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="label">Evidence Image (optional)</label>
              {preview ? (
                <div className="relative inline-block">
                  <img src={preview} alt="Preview" className="w-full max-h-56 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                  <button type="button" onClick={removeImage}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    dragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600'
                  }`}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <ImageIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Drag & drop or <span className="text-indigo-500 font-medium">click to upload</span></p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · Max 5MB</p>
                  <input id="file-input" type="file" className="hidden" accept="image/*" onChange={handleFileInput} />
                </div>
              )}
            </div>

            <button type="submit" id="submit-complaint-btn" disabled={loading}
              className="btn-primary w-full justify-center py-3">
              {loading ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddComplaint;
