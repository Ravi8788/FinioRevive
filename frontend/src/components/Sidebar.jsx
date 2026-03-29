import { NavLink } from 'react-router-dom';
import { canAccess, pageTitles } from '../utils/roles';

const links = [
  { key: 'dashboard', to: '/dashboard' },
  { key: 'users', to: '/users' },
  { key: 'societies', to: '/societies' },
  { key: 'members', to: '/members' },
  { key: 'calls', to: '/calls' },
  { key: 'notices', to: '/notices' },
  { key: 'payments', to: '/payments' },
];

export default function Sidebar({ role }) {
  return (
    <aside className="w-full border-b border-slate-200 bg-slate-900 p-4 text-slate-100 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mb-6 rounded-xl bg-teal-500/10 p-3">
        <p className="text-xs uppercase tracking-widest text-teal-300">FinioRevive</p>
        <h1 className="text-xl font-extrabold">Reviving Finances with Intelligence</h1>
      </div>
      <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
        {links
          .filter((link) => canAccess(role, link.key))
          .map((link) => (
            <NavLink
              key={link.key}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`
              }
            >
              {pageTitles[link.key]}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
