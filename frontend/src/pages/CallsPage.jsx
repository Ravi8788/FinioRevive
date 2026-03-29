import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const outcomes = ['paid', 'callback', 'promise_to_pay', 'not_reachable', 'escalated'];

export default function CallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');

  const visibleCalls = useMemo(() => {
    if (outcomeFilter === 'ALL') return calls;
    return calls.filter((call) => call.outcome === outcomeFilter);
  }, [calls, outcomeFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/calls');
      setCalls(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-slate-900">Calls</h2>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <label className="text-sm font-semibold text-slate-700" htmlFor="outcomeFilter">Filter</label>
        <select
          id="outcomeFilter"
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
        >
          <option value="ALL">All</option>
          {outcomes.map((outcome) => (
            <option key={outcome} value={outcome}>{outcome}</option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Telecaller</th>
                <th className="px-3 py-2">Outcome</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {visibleCalls.map((call) => (
                <tr key={call.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{call.member_name}</td>
                  <td className="px-3 py-2">{call.telecaller_name}</td>
                  <td className="px-3 py-2">{call.outcome}</td>
                  <td className="px-3 py-2">{call.notes || '-'}</td>
                  <td className="px-3 py-2">{new Date(call.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {!visibleCalls.length && (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={5}>No calls found for selected outcome.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
