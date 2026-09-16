import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import { LogOut, Bell, Building2, Menu } from 'lucide-react';
import ThemeToggle from '../ThemeToggle.jsx';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collegeName, setCollegeName] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  const collegeId = typeof user?.college === 'object' ? user?.college?._id : user?.college;

  useEffect(() => {
    if (collegeId) {
      api.getCollege(collegeId)
        .then((res) => setCollegeName(res.data.data?.name || ''))
        .catch(() => {});
    }
  }, [collegeId]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = user?.role === 'student' ? 'Student Portal' : 'Faculty Portal';

  // Platform staff never see the student app — send them to the staff console
  if (user?.platformRole) return <Navigate to="/admin" replace />;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 animate-slide-right">
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-elevated/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="btn-ghost p-2 rounded-lg lg:hidden shrink-0"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="w-9 h-9 rounded-lg bg-brand-600/10 flex items-center justify-center shrink-0">
              <Building2 size={17} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-content truncate">
                {collegeName || 'Cybervie'}
              </h1>
              <p className="text-xs text-subtle">{roleLabel}</p>
            </div>
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
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
