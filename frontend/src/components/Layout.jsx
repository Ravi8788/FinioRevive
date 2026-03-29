import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Sidebar from './Sidebar';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col md:flex-row">
        <Sidebar role={user?.role} />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
            <div>
              <p className="text-sm text-slate-500">Logged in as</p>
              <p className="font-bold text-slate-900">{user?.name} ({user?.role})</p>
            </div>
            <button type="button" onClick={logout} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Logout
            </button>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
