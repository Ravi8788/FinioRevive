import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const backendBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const noticeTypes = ['D1', 'D2', 'D3'];

function badgeClass(type) {
  if (type === 'D1') return 'bg-amber-100 text-amber-800';
  if (type === 'D2') return 'bg-orange-100 text-orange-800';
  return 'bg-rose-100 text-rose-800';
}

export default function NoticesPage() {
  const [notices, setNotices] = useState([]);
  const [members, setMembers] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedNotice, setGeneratedNotice] = useState(null);
  const [form, setForm] = useState({ member_id: '', type: 'D1' });

  const selectedMember = useMemo(
    () => members.find((m) => Number(m.id) === Number(form.member_id)) || null,
    [members, form.member_id]
  );

  const filteredNotices = useMemo(() => {
    if (filterType === 'ALL') return notices;
    return notices.filter((n) => n.type === filterType);
  }, [notices, filterType]);

  const downloadNotice = (notice) => {
    if (!notice?.pdf_url) {
      toast.error('PDF is not available for this notice');
      return;
    }

    const href = notice.pdf_url.startsWith('http') ? notice.pdf_url : `${backendBaseUrl}${notice.pdf_url}`;
    const link = document.createElement('a');
    link.href = href;
    link.setAttribute('download', `notice_${notice.type}_${notice.member_id || notice.id}.pdf`);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [noticeRes, memberRes] = await Promise.all([
        api.get('/notices'),
        api.get('/members?page=1&limit=100'),
      ]);
      setNotices(noticeRes.data);
      setMembers(memberRes.data || []);
      if (!form.member_id && memberRes.data?.length) {
        setForm((prev) => ({ ...prev, member_id: String(memberRes.data[0].id) }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, [form.member_id]);

  useEffect(() => {
    load();
  }, [load]);

  const generateNotice = async (e) => {
    e.preventDefault();
    if (!form.member_id) {
      toast.error('Please select a member');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/notices/generate', {
        member_id: Number(form.member_id),
        type: form.type,
      });
      setGeneratedNotice({ type: form.type, pdf_url: data.pdf_url, member_id: Number(form.member_id) });
      toast.success(`${form.type} notice generated successfully`);
      setShowGenerateModal(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate notice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-slate-900">Notices</h2>
        <button
          type="button"
          onClick={() => setShowGenerateModal(true)}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          + Generate New Notice
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <label className="text-sm font-semibold text-slate-700" htmlFor="noticeFilter">Filter</label>
        <select
          id="noticeFilter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="ALL">All</option>
          <option value="D1">D1</option>
          <option value="D2">D2</option>
          <option value="D3">D3</option>
        </select>
      </div>

      {generatedNotice?.pdf_url && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {generatedNotice.type} generated.{' '}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => downloadNotice(generatedNotice)}
          >
            Download PDF
          </button>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Generated By</th>
                <th className="px-3 py-2">PDF</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotices.map((notice) => (
                <tr key={notice.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{notice.member_name}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${badgeClass(notice.type)}`}>
                      {notice.type}
                    </span>
                  </td>
                  <td className="px-3 py-2">{notice.generated_by_name}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => downloadNotice(notice)}
                      className="rounded bg-blue-700 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                      disabled={!notice.pdf_url}
                    >
                      Download PDF
                    </button>
                  </td>
                  <td className="px-3 py-2">{new Date(notice.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showGenerateModal} title="Generate Legal Notice" onClose={() => setShowGenerateModal(false)}>
        <form onSubmit={generateNotice} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="memberSelect">Member</label>
            <select
              id="memberSelect"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.member_id}
              onChange={(e) => setForm((prev) => ({ ...prev, member_id: e.target.value }))}
              required
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p><strong>Member Name:</strong> {selectedMember?.name || '-'}</p>
            <p><strong>Due Amount:</strong> {selectedMember ? Number(selectedMember.due_amount || 0).toLocaleString() : '-'}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="noticeType">Notice Type</label>
            <select
              id="noticeType"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              {noticeTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowGenerateModal(false)} className="rounded bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
