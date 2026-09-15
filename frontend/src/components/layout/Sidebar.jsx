import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Brain, Trophy, User, Settings,
  Building2, FileQuestion, ClipboardList, Users, ShieldCheck, GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Sidebar() {
  const { user } = useAuth();

  const studentLinks = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/learn', label: 'Learn', icon: BookOpen },
    { to: '/app/practice', label: 'Practice', icon: Brain },
    { to: '/app/rankings', label: 'Rankings', icon: Trophy },
    { to: '/app/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/app/profile', label: 'Profile', icon: User },
  ];

  const facultyLinks = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/app/students', label: 'Students', icon: Users },
    { to: '/app/profile', label: 'Profile', icon: User },
  ];

  const adminLinks = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/users', label: 'Users', icon: Users },
    { to: '/app/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/app/profile', label: 'Profile', icon: User },
  ];

  const superadminLinks = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/colleges', label: 'Colleges', icon: Building2 },
    { to: '/app/questions', label: 'Questions', icon: FileQuestion },
    { to: '/app/users', label: 'All Users', icon: Users },
    { to: '/app/rankings', label: 'Rankings', icon: Trophy },
    { to: '/app/profile', label: 'Profile', icon: User },
  ];

  let links = studentLinks;
  if (user?.platformRole === 'superadmin') links = superadminLinks;
  else if (user?.role === 'faculty') links = facultyLinks;
  else if (user?.role === 'college-admin' || user?.role === 'college-owner') links = adminLinks;

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white text-lg">C</div>
          <div>
            <div className="font-bold text-lg text-content leading-tight">Cybervie</div>
            <div className="text-xs text-subtle">AI & Cyber Learning</div>
          </div>
        </NavLink>
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
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-content truncate">{user?.name}</div>
            <div className="text-xs text-subtle truncate">{user?.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
