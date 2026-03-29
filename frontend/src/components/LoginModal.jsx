import { useState } from 'react';

export default function LoginModal({ open, loading, onClose, onSubmit }) {
  const [form, setForm] = useState({ email: '', password: '' });

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    await onSubmit(form.email, form.password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Login to FinioRevive</h3>
            <p className="mt-1 text-sm text-slate-600">Access your role-specific financial recovery dashboard.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="home-email">Email</label>
            <input
              id="home-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-cyan-500 focus:ring"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="home-password">Password</label>
            <input
              id="home-password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-cyan-500 focus:ring"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
