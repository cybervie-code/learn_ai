import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  GraduationCap, ClipboardList, Users, Building2,
  Plus, ArrowRight, Clock, Layers, BookOpen,
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [college, setCollege] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const collegeId = typeof user?.college === 'object' ? user?.college?._id : user?.college;
  const isAdmin = user?.role === 'college-admin' || user?.role === 'college-owner';
  const firstName = user?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    const calls = [api.listAssignments().catch(() => null)];
    if (collegeId) {
      calls.push(api.getCollegeStats(collegeId).catch(() => null));
      calls.push(api.getCollege(collegeId).catch(() => null));
    }
    Promise.all(calls).then(([a, s, c]) => {
      setAssignments(a?.data?.data || []);
      setStats(s?.data?.data || null);
      setCollege(c?.data?.data || null);
      setLoading(false);
    });
  }, [collegeId]);

  const cards = [
    { label: 'Active Students', value: stats?.students ?? '—', icon: GraduationCap, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-500/10' },
    { label: isAdmin ? 'Assignments' : 'My Assignments', value: assignments.length, icon: ClipboardList, color: 'text-cyber-600 dark:text-cyber-400', bg: 'bg-cyber-500/10' },
    { label: 'Faculty & Admins', value: stats?.faculty ?? '—', icon: Users, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    { label: 'Cohorts', value: stats?.cohorts ?? '—', icon: Layers, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  const quickActions = [
    { to: '/app/assignments', label: 'New Assignment', icon: Plus, primary: true },
    { to: '/app/students', label: 'View Students', icon: Users },
    ...(isAdmin ? [{ to: '/app/users', label: 'Manage Users', icon: Users }] : []),
  ];

  if (loading) return <div className="text-subtle p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-content">Welcome, {firstName}</h1>
          <span className="badge bg-cyber-500/15 text-cyber-600 dark:text-cyber-400 border border-cyber-500/20 text-xs capitalize">
            {user?.role?.replace(/-/g, ' ')}
          </span>
        </div>
        <p className="text-muted mt-1 flex items-center gap-1.5">
          <Building2 size={14} />
          {college?.name || 'Your college'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((s, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-content">{s.value}</div>
                <div className="text-sm text-muted mt-1">{s.label}</div>
              </div>
              <div className={`w-12 h-12 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon size={22} className={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((a) => (
          <Link key={a.label} to={a.to} className={a.primary ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
            <a.icon size={16} /> {a.label}
          </Link>
        ))}
      </div>

      {/* Assignments */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-content flex items-center gap-2">
            <BookOpen size={17} className="text-brand-600 dark:text-brand-400" />
            {isAdmin ? 'College assignments' : 'Your assignments'}
          </h2>
          <Link to="/app/assignments" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-500 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {assignments.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-subtle text-sm mb-4">No assignments yet. Create one to start assessing your students.</p>
            <Link to="/app/assignments" className="btn-primary text-sm"><Plus size={15} /> Create assignment</Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {assignments.slice(0, 5).map((a) => {
              const due = a.dueDate ? new Date(a.dueDate) : null;
              const overdue = due && due < new Date();
              return (
                <div key={a._id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-content truncate">{a.title}</div>
                    <div className="text-xs text-subtle mt-0.5 flex items-center gap-3">
                      <span>{a.quiz?.title || 'Quiz'}</span>
                      {a.cohorts?.length > 0 && <span>{a.cohorts.length} cohort{a.cohorts.length > 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-subtle">{a.stats?.totalSubmitted || 0}/{a.stats?.totalAssigned || 0} submitted</span>
                    {due && (
                      <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-subtle'}`}>
                        <Clock size={12} /> {due.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
