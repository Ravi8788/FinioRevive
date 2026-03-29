import { useEffect, useState } from 'react';
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/useAuth';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [stats, setStats] = useState(null);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [telecallerStats, setTelecallerStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        if (isSuperAdmin) {
          try {
            const { data } = await api.get('/dashboard');
            setAdminDashboard(data);
            setStats({
              total_due: data.total_outstanding_amount,
              recovered_due: data.total_recovered_amount,
              pending_count: data.pending_cases_count,
              escalated_count: data.escalated_cases_count,
              legal_count: 0,
              recovered_count: 0,
            });
          } catch (error) {
            if (error.response?.status === 404) {
              // Fallback if backend process is still on older route shape.
              const { data } = await api.get('/dashboard/stats');
              setAdminDashboard({ society_wise: [], recent_activity: [] });
              setStats(data);
            } else {
              throw error;
            }
          }
        } else {
          const { data } = await api.get('/dashboard/stats');
          setStats(data);
        }

        if (user?.role === 'telecaller') {
          const { data: calls } = await api.get('/calls');
          setTelecallerStats({
            total_calls: calls.length,
            paid_count: calls.filter((c) => c.outcome === 'paid').length,
            escalated_count: calls.filter((c) => c.outcome === 'escalated').length,
            callbacks: calls.filter((c) => c.outcome === 'callback' || c.outcome === 'promise_to_pay').length,
          });
        }
      } catch (error) {
        setStats({
          total_due: 0,
          recovered_due: 0,
          pending_count: 0,
          escalated_count: 0,
          legal_count: 0,
          recovered_count: 0,
        });
        setAdminDashboard({ society_wise: [], recent_activity: [] });
        toast.error(error.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [isSuperAdmin, user?.role]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const safeStats = stats || {
    total_due: 0,
    recovered_due: 0,
    pending_count: 0,
    escalated_count: 0,
    legal_count: 0,
    recovered_count: 0,
  };

  const cards = [
    { label: 'Total Due', value: Number(safeStats.total_due || 0).toLocaleString() },
    { label: 'Recovered Due', value: Number(safeStats.recovered_due || 0).toLocaleString() },
    { label: 'Pending Cases', value: safeStats.pending_count || 0 },
    { label: 'Escalated Cases', value: safeStats.escalated_count || 0 },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-slate-900">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {user?.role === 'telecaller' && telecallerStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Calls</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{telecallerStats.total_calls}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Paid Outcomes</p>
            <p className="mt-2 text-2xl font-extrabold text-emerald-700">{telecallerStats.paid_count}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Escalated Outcomes</p>
            <p className="mt-2 text-2xl font-extrabold text-rose-700">{telecallerStats.escalated_count}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Callback/Promise</p>
            <p className="mt-2 text-2xl font-extrabold text-amber-700">{telecallerStats.callbacks}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-bold text-slate-800">Status Distribution</h3>
          <Doughnut
            data={{
              labels: ['Pending', 'Escalated', 'Legal', 'Recovered'],
              datasets: [
                {
                  data: [safeStats.pending_count || 0, safeStats.escalated_count || 0, safeStats.legal_count || 0, safeStats.recovered_count || 0],
                  backgroundColor: ['#f59e0b', '#ef4444', '#334155', '#10b981'],
                },
              ],
            }}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-bold text-slate-800">Due vs Recovered</h3>
          <Bar
            data={{
              labels: isSuperAdmin
                ? (adminDashboard?.society_wise || []).map((s) => s.name)
                : ['Amount'],
              datasets: [
                {
                  label: 'Total Due',
                  data: isSuperAdmin
                    ? (adminDashboard?.society_wise || []).map((s) => Number(s.due_amount || 0))
                    : [safeStats.total_due || 0],
                  backgroundColor: '#0f172a',
                },
                {
                  label: 'Recovered',
                  data: isSuperAdmin
                    ? (adminDashboard?.society_wise || []).map((s) => Number(s.recovered_amount || 0))
                    : [safeStats.recovered_due || 0],
                  backgroundColor: '#14b8a6',
                },
              ],
            }}
            options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
          />
        </div>
      </div>

      {isSuperAdmin && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-bold text-slate-800">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {(adminDashboard?.recent_activity || []).map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{row.user_name}</td>
                    <td className="px-3 py-2">{row.user_role}</td>
                    <td className="px-3 py-2">{row.action}</td>
                    <td className="px-3 py-2">{row.target_table}#{row.target_id || '-'}</td>
                    <td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {!adminDashboard?.recent_activity?.length && (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={5}>No activity found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
