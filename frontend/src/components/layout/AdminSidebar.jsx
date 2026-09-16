import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, FileQuestion,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import BrandLogo from '../BrandLogo.jsx';

export default function AdminSidebar() {
  const { user } = useAuth();

  const canManageTenants = ['superadmin', 'platform-ops'].includes(user?.platformRole);

  const links = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    ...(canManageTenants ? [
      { to: '/admin/colleges', label: 'Colleges', icon: Building2 },
      { to: '/admin/users', label: 'Users', icon: Users },
    ] : []),
    { to: '/admin/questions', label: 'Question Bank', icon: FileQuestion },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <BrandLogo />
          <div>
            <div className="font-bold text-lg text-content leading-tight">Cybervie</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">Control Plane</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? 'sidebar-link-active' : 'sidebar-link')}
          >
            <link.icon size={18} />
            <span className="text-sm font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-content truncate">{user?.name}</div>
            <div className="text-xs text-subtle truncate">{user?.platformRole || 'staff'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
