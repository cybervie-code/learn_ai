import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogOut, Bell, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../ThemeToggle.jsx';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-elevated/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-content">
              {user?.college ? 'College Portal' : 'Platform Admin'}
            </h1>
            {user?.platformRole === 'superadmin' && (
              <span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs">
                <ShieldCheck size={12} /> Superadmin
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="btn-ghost p-2 rounded-lg relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyber-400 rounded-full"></span>
            </button>
            <button onClick={handleLogout} className="btn-ghost p-2 rounded-lg" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
