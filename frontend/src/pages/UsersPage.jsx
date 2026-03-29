import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const roles = ['bdm', 'agent', 'telecaller', 'legal', 'accounts'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' });
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortDir('asc');
  };

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = users.filter((u) => {
      if (!q) return true;
      return (
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q) ||
        String(u.role || '').toLowerCase().includes(q)
      );
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => String(a[sortBy] || '').localeCompare(String(b[sortBy] || '')) * dir);
    return filtered;
  }, [users, search, sortBy, sortDir]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      toast.success('User created');
      setForm({ name: '', email: '', password: '', role: 'agent' });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editUser.id}`, editUser);
      toast.success('User updated');
      setEditUser(null);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-slate-900">Users</h2>

      <form onSubmit={createUser} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <input className="rounded border border-slate-300 px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        <input className="rounded border border-slate-300 px-3 py-2" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
        <input className="rounded border border-slate-300 px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
        <div className="flex gap-2">
          <select className="w-full rounded border border-slate-300 px-3 py-2" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Add</button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Quick filter users by name, email, role"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">
                  <button type="button" className="font-semibold" onClick={() => toggleSort('name')}>Name</button>
                </th>
                <th className="px-3 py-2">
                  <button type="button" className="font-semibold" onClick={() => toggleSort('email')}>Email</button>
                </th>
                <th className="px-3 py-2">
                  <button type="button" className="font-semibold" onClick={() => toggleSort('role')}>Role</button>
                </th>
                <th className="px-3 py-2">Joined Date</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{user.name}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">{user.role}</td>
                  <td className="px-3 py-2">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button type="button" className="rounded bg-slate-700 px-3 py-1 text-xs font-semibold text-white" onClick={() => setEditUser({ ...user, password: '' })}>
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

      <Modal open={!!editUser} title="Edit user" onClose={() => setEditUser(null)}>
        {editUser && (
          <form onSubmit={updateUser} className="space-y-3">
            <input className="w-full rounded border border-slate-300 px-3 py-2" value={editUser.name} onChange={(e) => setEditUser((p) => ({ ...p, name: e.target.value }))} required />
            <input className="w-full rounded border border-slate-300 px-3 py-2" type="email" value={editUser.email} onChange={(e) => setEditUser((p) => ({ ...p, email: e.target.value }))} required />
            <select className="w-full rounded border border-slate-300 px-3 py-2" value={editUser.role} onChange={(e) => setEditUser((p) => ({ ...p, role: e.target.value }))}>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <input className="w-full rounded border border-slate-300 px-3 py-2" type="password" placeholder="New password (optional)" value={editUser.password || ''} onChange={(e) => setEditUser((p) => ({ ...p, password: e.target.value }))} />
            <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Save</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
