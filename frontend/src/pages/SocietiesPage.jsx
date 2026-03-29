import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useAuth } from '../context/useAuth';

export default function SocietiesPage() {
  const { user } = useAuth();
  const [societies, setSocieties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', address: '', bdm_id: '' });
  const [editSociety, setEditSociety] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const bdmUsers = users.filter((u) => u.role === 'bdm');

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortDir('asc');
  };

  const visibleSocieties = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = societies.filter((s) => {
      if (!q) return true;
      return (
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.address || '').toLowerCase().includes(q) ||
        String(s.bdm_name || '').toLowerCase().includes(q)
      );
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => String(a[sortBy] || '').localeCompare(String(b[sortBy] || '')) * dir);
    return filtered;
  }, [societies, search, sortBy, sortDir]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [societyRes, usersRes] = await Promise.all([
        api.get('/societies'),
        user?.role === 'super_admin' ? api.get('/users') : Promise.resolve({ data: [] }),
      ]);
      setSocieties(societyRes.data);
      setUsers(usersRes.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load societies');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  const createSociety = async (e) => {
    e.preventDefault();
    try {
      await api.post('/societies', { ...form, bdm_id: form.bdm_id || undefined });
      toast.success('Society created');
      setForm({ name: '', address: '', bdm_id: '' });
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create society');
    }
  };

  const updateSociety = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/societies/${editSociety.id}`, editSociety);
      toast.success('Society updated');
      setEditSociety(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update society');
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-slate-900">Societies</h2>

      {(user?.role === 'super_admin' || user?.role === 'bdm') && (
        <form onSubmit={createSociety} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Society name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          {user?.role === 'super_admin' ? (
            <select className="rounded border border-slate-300 px-3 py-2" value={form.bdm_id} onChange={(e) => setForm((p) => ({ ...p, bdm_id: e.target.value }))}>
              <option value="">Assign BDM (optional)</option>
              {bdmUsers.map((bdm) => <option key={bdm.id} value={bdm.id}>{bdm.name}</option>)}
            </select>
          ) : (
            <input className="rounded border border-slate-300 px-3 py-2" value="Assigned to you" disabled />
          )}
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Add Society</button>
        </form>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Quick filter societies by name, address, BDM"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2"><button type="button" className="font-semibold" onClick={() => toggleSort('name')}>Name</button></th>
                <th className="px-3 py-2"><button type="button" className="font-semibold" onClick={() => toggleSort('address')}>Address</button></th>
                <th className="px-3 py-2"><button type="button" className="font-semibold" onClick={() => toggleSort('bdm_name')}>BDM</button></th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleSocieties.map((society) => (
                <tr key={society.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{society.name}</td>
                  <td className="px-3 py-2">{society.address}</td>
                  <td className="px-3 py-2">{society.bdm_name || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button type="button" className="rounded bg-slate-700 px-3 py-1 text-xs font-semibold text-white" onClick={() => setEditSociety({ ...society, bdm_id: society.bdm_id || '' })}>
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editSociety} title="Edit society" onClose={() => setEditSociety(null)}>
        {editSociety && (
          <form onSubmit={updateSociety} className="space-y-3">
            <input className="w-full rounded border border-slate-300 px-3 py-2" value={editSociety.name} onChange={(e) => setEditSociety((p) => ({ ...p, name: e.target.value }))} required />
            <input className="w-full rounded border border-slate-300 px-3 py-2" value={editSociety.address || ''} onChange={(e) => setEditSociety((p) => ({ ...p, address: e.target.value }))} />
            {user?.role === 'super_admin' ? (
              <select className="w-full rounded border border-slate-300 px-3 py-2" value={editSociety.bdm_id || ''} onChange={(e) => setEditSociety((p) => ({ ...p, bdm_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {bdmUsers.map((bdm) => <option key={bdm.id} value={bdm.id}>{bdm.name}</option>)}
              </select>
            ) : (
              <input className="w-full rounded border border-slate-300 px-3 py-2" value="Assigned to you" disabled />
            )}
            <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Save</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
