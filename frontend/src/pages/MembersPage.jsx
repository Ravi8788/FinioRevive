import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useAuth } from '../context/useAuth';

const statusOptions = ['pending', 'escalated', 'legal', 'recovered'];
const callOutcomes = ['paid', 'callback', 'promise_to_pay', 'not_reachable', 'escalated'];
const noticeTypes = ['D1', 'D2', 'D3'];

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [filters, setFilters] = useState({ status: '', society_id: '', search: '' });
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    email: '',
    society_id: '',
    due_amount: '',
    due_since: '',
    status: 'pending',
    assigned_agent_id: '',
    assigned_telecaller_id: '',
  });

  const [activeMember, setActiveMember] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [callForm, setCallForm] = useState({ outcome: 'callback', notes: '' });
  const [calling, setCalling] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ type: 'D1' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', paid_on: '' });
  const [statusSelections, setStatusSelections] = useState({});
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [editMember, setEditMember] = useState(null);

  const canCreateMember = user?.role === 'super_admin' || user?.role === 'bdm';
  const canEditMember = user?.role === 'super_admin' || user?.role === 'bdm';
  const canLogCall = user?.role === 'telecaller';
  const canGenerateNotice = ['super_admin', 'legal', 'bdm'].includes(user?.role);
  const canRecordPayment = ['super_admin', 'accounts', 'agent'].includes(user?.role);

  const isAgentView = user?.role === 'agent';

  const agents = userOptions.filter((u) => u.role === 'agent');
  const telecallers = userOptions.filter((u) => u.role === 'telecaller');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.society_id) params.set('society_id', filters.society_id);
    if (filters.search) params.set('search', filters.search);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return params.toString();
  }, [filters, page]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const memberPromise = api.get(`/members?${queryString}`);
      const societyPromise = api.get('/societies');
      const userPromise = ['super_admin', 'bdm'].includes(user?.role) ? api.get('/users') : Promise.resolve({ data: [] });

      const [membersRes, societiesRes, usersRes] = await Promise.all([memberPromise, societyPromise, userPromise]);

      setMembers(membersRes.data);
      setTotal(Number(membersRes.headers['x-total-count'] || membersRes.data.length || 0));
      setSocieties(societiesRes.data);
      setUserOptions(usersRes.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [queryString, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.society_id, filters.search]);

  useEffect(() => {
    if (activeMember?.modal !== 'details') {
      setDetailsData(null);
      setDetailsLoading(false);
    }
  }, [activeMember?.modal]);

  const createMember = async (e) => {
    e.preventDefault();
    try {
      await api.post('/members', {
        ...memberForm,
        due_amount: Number(memberForm.due_amount || 0),
        assigned_agent_id: memberForm.assigned_agent_id || undefined,
        assigned_telecaller_id: memberForm.assigned_telecaller_id || undefined,
      });
      toast.success('Member created');
      setMemberForm({
        name: '',
        phone: '',
        email: '',
        society_id: '',
        due_amount: '',
        due_since: '',
        status: 'pending',
        assigned_agent_id: '',
        assigned_telecaller_id: '',
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create member');
    }
  };

  const updateMember = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/members/${editMember.id}`, {
        ...editMember,
        due_amount: Number(editMember.due_amount || 0),
        assigned_agent_id: editMember.assigned_agent_id || null,
        assigned_telecaller_id: editMember.assigned_telecaller_id || null,
      });
      toast.success('Member updated');
      setEditMember(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update member');
    }
  };

  const updateRecovered = async (memberId, status = 'recovered') => {
    if (status !== 'recovered') {
      toast.info('Agent can only move status to recovered');
      return;
    }

    setStatusUpdatingId(memberId);
    try {
      await api.put(`/members/${memberId}`, { status });
      toast.success(`Status updated to ${status}`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update member');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const openPaymentModal = (member) => {
    const today = new Date().toISOString().slice(0, 10);
    setPaymentForm({
      amount: String(Number(member.due_amount || 0)),
      paid_on: today,
    });
    setActiveMember({ ...member, modal: 'payment' });
  };

  const openDetailsModal = async (member) => {
    setActiveMember({ ...member, modal: 'details' });
    setDetailsLoading(true);
    try {
      const { data } = await api.get(`/members/${member.id}/details`);
      setDetailsData(data);
    } catch (error) {
      setDetailsData(null);
      if (error.response?.status === 404) {
        toast.error('Member was not found. It may have been deleted.');
        setActiveMember(null);
        await loadData();
      } else {
        toast.error(error.response?.data?.message || 'Failed to load member details');
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const submitCall = async (e) => {
    e.preventDefault();
    setCalling(true);
    try {
      await api.post('/calls', {
        member_id: activeMember.id,
        outcome: callForm.outcome,
        notes: callForm.notes,
      });
      toast.success('Call logged');
      setActiveMember(null);
      setCallForm({ outcome: 'callback', notes: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to log call');
    } finally {
      setCalling(false);
    }
  };

  const submitNotice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notices/generate', {
        member_id: activeMember.id,
        type: noticeForm.type,
      });
      toast.success('Notice generated');
      setActiveMember(null);
      setNoticeForm({ type: 'D1' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate notice');
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', {
        member_id: activeMember.id,
        amount: Number(paymentForm.amount),
        paid_on: paymentForm.paid_on,
      });
      toast.success('Payment recorded');
      setActiveMember(null);
      setPaymentForm({ amount: '', paid_on: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-slate-900">Members</h2>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <select className="rounded border border-slate-300 px-3 py-2" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
          <option value="">All Status</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="rounded border border-slate-300 px-3 py-2" value={filters.society_id} onChange={(e) => setFilters((p) => ({ ...p, society_id: e.target.value }))}>
          <option value="">All Societies</option>
          {societies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className="rounded border border-slate-300 px-3 py-2" placeholder="Search name, phone, email" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
      </div>

      {canCreateMember && (
        <form onSubmit={createMember} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Name" value={memberForm.name} onChange={(e) => setMemberForm((p) => ({ ...p, name: e.target.value }))} required />
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Phone" value={memberForm.phone} onChange={(e) => setMemberForm((p) => ({ ...p, phone: e.target.value }))} />
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Email" type="email" value={memberForm.email} onChange={(e) => setMemberForm((p) => ({ ...p, email: e.target.value }))} />
          <select className="rounded border border-slate-300 px-3 py-2" value={memberForm.society_id} onChange={(e) => setMemberForm((p) => ({ ...p, society_id: e.target.value }))} required>
            <option value="">Select Society</option>
            {societies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Due Amount" type="number" value={memberForm.due_amount} onChange={(e) => setMemberForm((p) => ({ ...p, due_amount: e.target.value }))} />
          <input className="rounded border border-slate-300 px-3 py-2" type="date" value={memberForm.due_since} onChange={(e) => setMemberForm((p) => ({ ...p, due_since: e.target.value }))} />
          <select className="rounded border border-slate-300 px-3 py-2" value={memberForm.status} onChange={(e) => setMemberForm((p) => ({ ...p, status: e.target.value }))}>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="rounded border border-slate-300 px-3 py-2" value={memberForm.assigned_agent_id} onChange={(e) => setMemberForm((p) => ({ ...p, assigned_agent_id: e.target.value }))}>
            <option value="">Assign Agent</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className="rounded border border-slate-300 px-3 py-2" value={memberForm.assigned_telecaller_id} onChange={(e) => setMemberForm((p) => ({ ...p, assigned_telecaller_id: e.target.value }))}>
            <option value="">Assign Telecaller</option>
            {telecallers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Add Member</button>
        </form>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                {isAgentView ? <th className="px-3 py-2">Phone</th> : <th className="px-3 py-2">Society</th>}
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2">Status</th>
                {!isAgentView && <th className="px-3 py-2">Agent</th>}
                {!isAgentView && <th className="px-3 py-2">Telecaller</th>}
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{member.name}</td>
                  {isAgentView ? <td className="px-3 py-2">{member.phone || '-'}</td> : <td className="px-3 py-2">{member.society_name}</td>}
                  <td className="px-3 py-2">{Number(member.due_amount).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{member.status}</span>
                  </td>
                  {!isAgentView && <td className="px-3 py-2">{member.agent_name || '-'}</td>}
                  {!isAgentView && <td className="px-3 py-2">{member.telecaller_name || '-'}</td>}
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {isAgentView ? (
                        <>
                          <select
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            value={statusSelections[member.id] || (member.status === 'recovered' ? 'recovered' : 'pending')}
                            onChange={(e) => setStatusSelections((prev) => ({ ...prev, [member.id]: e.target.value }))}
                          >
                            <option value="pending" disabled>pending</option>
                            <option value="recovered">recovered</option>
                          </select>
                          <button
                            type="button"
                            className="rounded bg-teal-600 px-2 py-1 text-xs text-white disabled:opacity-60"
                            disabled={statusUpdatingId === member.id}
                            onClick={() => updateRecovered(member.id, statusSelections[member.id] || (member.status === 'recovered' ? 'recovered' : 'pending'))}
                          >
                            {statusUpdatingId === member.id ? 'Updating...' : 'Update Status'}
                          </button>
                          <button type="button" className="rounded bg-emerald-600 px-2 py-1 text-xs text-white" onClick={() => openPaymentModal(member)}>Record Payment</button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="rounded bg-slate-200 px-2 py-1 text-xs" onClick={() => openDetailsModal(member)}>Details</button>
                          {canEditMember && <button type="button" className="rounded bg-slate-700 px-2 py-1 text-xs text-white" onClick={() => setEditMember({ ...member })}>Edit</button>}
                          {canLogCall && <button type="button" className="rounded bg-blue-600 px-2 py-1 text-xs text-white" onClick={() => setActiveMember({ ...member, modal: 'call' })}>Log Call</button>}
                          {canGenerateNotice && <button type="button" className="rounded bg-slate-800 px-2 py-1 text-xs text-white" onClick={() => setActiveMember({ ...member, modal: 'notice' })}>Generate Notice</button>}
                          {canRecordPayment && <button type="button" className="rounded bg-emerald-600 px-2 py-1 text-xs text-white" onClick={() => openPaymentModal(member)}>Record Payment</button>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
        <p className="text-slate-600">Total: {total}</p>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded bg-slate-200 px-3 py-1 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" className="rounded bg-slate-200 px-3 py-1 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>

      <Modal open={activeMember?.modal === 'details'} title="Member Details" onClose={() => setActiveMember(null)}>
        {activeMember && !detailsLoading && (
          <div className="space-y-2 text-sm text-slate-700">
            <p><strong>Name:</strong> {detailsData?.member?.name || activeMember.name}</p>
            <p><strong>Phone:</strong> {detailsData?.member?.phone || activeMember.phone || '-'}</p>
            <p><strong>Email:</strong> {detailsData?.member?.email || activeMember.email || '-'}</p>
            <p><strong>Society:</strong> {detailsData?.member?.society_name || activeMember.society_name || '-'}</p>
            <p><strong>Due Amount:</strong> {detailsData?.member?.due_amount ?? activeMember.due_amount}</p>
            <p><strong>Due Since:</strong> {detailsData?.member?.due_since || activeMember.due_since || '-'}</p>
            <p><strong>Status:</strong> {detailsData?.member?.status || activeMember.status}</p>

            <div className="mt-3">
              <h4 className="mb-1 font-semibold text-slate-900">Call History</h4>
              {(detailsData?.calls || []).length ? (
                <ul className="space-y-1 text-xs">
                  {detailsData.calls.slice(0, 5).map((call) => (
                    <li key={call.id} className="rounded bg-slate-50 p-2">
                      {call.outcome} by {call.telecaller_name} on {new Date(call.created_at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-slate-500">No calls found.</p>}
            </div>

            <div className="mt-3">
              <h4 className="mb-1 font-semibold text-slate-900">Notices History</h4>
              {(detailsData?.notices || []).length ? (
                <ul className="space-y-1 text-xs">
                  {detailsData.notices.slice(0, 5).map((notice) => (
                    <li key={notice.id} className="rounded bg-slate-50 p-2">
                      {notice.type} by {notice.generated_by_name} on {new Date(notice.created_at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-slate-500">No notices found.</p>}
            </div>

            <div className="mt-3">
              <h4 className="mb-1 font-semibold text-slate-900">Payments History</h4>
              {(detailsData?.payments || []).length ? (
                <ul className="space-y-1 text-xs">
                  {detailsData.payments.slice(0, 5).map((payment) => (
                    <li key={payment.id} className="rounded bg-slate-50 p-2">
                      {Number(payment.amount).toLocaleString()} by {payment.recorded_by_name} on {payment.paid_on}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-slate-500">No payments found.</p>}
            </div>
          </div>
        )}
        {detailsLoading && <LoadingSpinner text="Loading member details..." />}
      </Modal>

      <Modal open={!!editMember} title="Edit Member" onClose={() => setEditMember(null)}>
        {editMember && (
          <form onSubmit={updateMember} className="grid gap-3 sm:grid-cols-2">
            <input className="rounded border border-slate-300 px-3 py-2" value={editMember.name} onChange={(e) => setEditMember((p) => ({ ...p, name: e.target.value }))} required />
            <input className="rounded border border-slate-300 px-3 py-2" value={editMember.phone || ''} onChange={(e) => setEditMember((p) => ({ ...p, phone: e.target.value }))} />
            <input className="rounded border border-slate-300 px-3 py-2" type="email" value={editMember.email || ''} onChange={(e) => setEditMember((p) => ({ ...p, email: e.target.value }))} />
            <select className="rounded border border-slate-300 px-3 py-2" value={editMember.society_id} onChange={(e) => setEditMember((p) => ({ ...p, society_id: Number(e.target.value) }))}>
              {societies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input className="rounded border border-slate-300 px-3 py-2" type="number" value={editMember.due_amount || ''} onChange={(e) => setEditMember((p) => ({ ...p, due_amount: e.target.value }))} />
            <input className="rounded border border-slate-300 px-3 py-2" type="date" value={editMember.due_since || ''} onChange={(e) => setEditMember((p) => ({ ...p, due_since: e.target.value }))} />
            <select className="rounded border border-slate-300 px-3 py-2" value={editMember.status} onChange={(e) => setEditMember((p) => ({ ...p, status: e.target.value }))}>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="rounded border border-slate-300 px-3 py-2" value={editMember.assigned_agent_id || ''} onChange={(e) => setEditMember((p) => ({ ...p, assigned_agent_id: e.target.value }))}>
              <option value="">Assign Agent</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className="rounded border border-slate-300 px-3 py-2" value={editMember.assigned_telecaller_id || ''} onChange={(e) => setEditMember((p) => ({ ...p, assigned_telecaller_id: e.target.value }))}>
              <option value="">Assign Telecaller</option>
              {telecallers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Save</button>
          </form>
        )}
      </Modal>

      <Modal open={activeMember?.modal === 'call'} title="Log Call" onClose={() => setActiveMember(null)}>
        <form onSubmit={submitCall} className="space-y-3">
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p><strong>Member Name:</strong> {activeMember?.name}</p>
          </div>
          <select className="w-full rounded border border-slate-300 px-3 py-2" value={callForm.outcome} onChange={(e) => setCallForm((p) => ({ ...p, outcome: e.target.value }))}>
            {callOutcomes.map((outcome) => <option key={outcome} value={outcome}>{outcome}</option>)}
          </select>
          <textarea className="w-full rounded border border-slate-300 px-3 py-2" rows={4} placeholder="Call notes" value={callForm.notes} onChange={(e) => setCallForm((p) => ({ ...p, notes: e.target.value }))} />
          <button type="submit" disabled={calling} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{calling ? 'Submitting...' : 'Submit'}</button>
        </form>
      </Modal>

      <Modal open={activeMember?.modal === 'notice'} title="Generate Notice" onClose={() => setActiveMember(null)}>
        <form onSubmit={submitNotice} className="space-y-3">
          <select className="w-full rounded border border-slate-300 px-3 py-2" value={noticeForm.type} onChange={(e) => setNoticeForm({ type: e.target.value })}>
            {noticeTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <button type="submit" className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Generate</button>
        </form>
      </Modal>

      <Modal open={activeMember?.modal === 'payment'} title="Record Payment" onClose={() => setActiveMember(null)}>
        <form onSubmit={submitPayment} className="space-y-3">
          <input className="w-full rounded border border-slate-300 px-3 py-2" type="number" placeholder="Amount" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} required />
          <input className="w-full rounded border border-slate-300 px-3 py-2" type="date" value={paymentForm.paid_on} onChange={(e) => setPaymentForm((p) => ({ ...p, paid_on: e.target.value }))} required />
          <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Record</button>
        </form>
      </Modal>

    </div>
  );
}
