import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogOut, ShieldCheck, Menu } from 'lucide-react';
import ThemeToggle from '../ThemeToggle.jsx';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 animate-slide-right">
            <AdminSidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-elevated/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="btn-ghost p-2 rounded-lg lg:hidden shrink-0"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-lg font-semibold text-content truncate">Platform Administration</h1>
            <span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs shrink-0 hidden sm:inline-flex">
              <ShieldCheck size={12} /> {user?.platformRole}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeToggle />
            <button onClick={handleLogout} className="btn-ghost p-2 rounded-lg" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
