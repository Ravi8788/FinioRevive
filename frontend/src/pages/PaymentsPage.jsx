import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [form, setForm] = useState({ member_id: '', amount: '', paid_on: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentRes, memberRes] = await Promise.all([
        api.get('/payments'),
        api.get('/members?page=1&limit=200'),
      ]);
      setPayments(paymentRes.data || []);
      setMembers(memberRes.data || []);
      if (!form.member_id && memberRes.data?.length) {
        setForm((prev) => ({ ...prev, member_id: String(memberRes.data[0].id) }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [form.member_id]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPayments = useMemo(() => {
    if (statusFilter === 'ALL') return payments;
    if (statusFilter === 'PENDING') return payments.filter((p) => !p.reconciled);
    return payments.filter((p) => !!p.reconciled);
  }, [payments, statusFilter]);

  const summary = useMemo(() => {
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingCount = payments.filter((p) => !p.reconciled).length;
    const reconciledCount = payments.filter((p) => !!p.reconciled).length;
    return { totalCollected, pendingCount, reconciledCount };
  }, [payments]);

  const recordPayment = async (e) => {
    e.preventDefault();
    if (!form.member_id || !form.amount || !form.paid_on) {
      toast.error('member, amount and paid date are required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/payments', {
        member_id: Number(form.member_id),
        amount: Number(form.amount),
        paid_on: form.paid_on,
      });
      toast.success('Payment recorded successfully');
      setForm((prev) => ({ ...prev, amount: '', paid_on: '' }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const reconcile = async (id) => {
    setProcessingId(id);
    try {
      await api.put(`/payments/${id}/reconcile`);
      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, reconciled: 1 } : p)));
      toast.success('Payment reconciled successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reconcile payment');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-slate-900">Payments</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Collected</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{summary.totalCollected.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pending Reconciliation</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{summary.pendingCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Fully Reconciled</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{summary.reconciledCount}</p>
        </div>
      </div>

      <form onSubmit={recordPayment} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <select
          className="rounded border border-slate-300 px-3 py-2"
          value={form.member_id}
          onChange={(e) => setForm((prev) => ({ ...prev, member_id: e.target.value }))}
          required
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <input
          className="rounded border border-slate-300 px-3 py-2"
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          required
        />
        <input
          className="rounded border border-slate-300 px-3 py-2"
          type="date"
          value={form.paid_on}
          onChange={(e) => setForm((prev) => ({ ...prev, paid_on: e.target.value }))}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Recording...' : 'Record Payment'}
        </button>
      </form>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <label className="text-sm font-semibold text-slate-700" htmlFor="paymentFilter">Filter</label>
        <select
          id="paymentFilter"
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="RECONCILED">Reconciled</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Paid On</th>
                <th className="px-3 py-2">Recorded By</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{payment.member_name}</td>
                  <td className="px-3 py-2">{Number(payment.amount).toLocaleString()}</td>
                  <td className="px-3 py-2">{payment.paid_on}</td>
                  <td className="px-3 py-2">{payment.recorded_by_name}</td>
                  <td className="px-3 py-2">
                    {payment.reconciled ? (
                      <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Reconciled</span>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Pending</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {!payment.reconciled && (
                      <button
                        type="button"
                        disabled={processingId === payment.id}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                        onClick={() => reconcile(payment.id)}
                      >
                        {processingId === payment.id ? 'Reconciling...' : 'Reconcile'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredPayments.length && (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={6}>
                    No payments found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
