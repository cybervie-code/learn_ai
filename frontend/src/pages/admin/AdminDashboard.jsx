import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Building2, FileQuestion, Users, BookOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
  const canManageTenants = ['superadmin', 'platform-ops'].includes(user?.platformRole);
  const [stats, setStats] = useState({ colleges: 0, questions: 0, users: 0, paths: 0 });
  const [recentColleges, setRecentColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      canManageTenants ? api.listColleges({ limit: 5 }).catch(() => null) : Promise.resolve(null),
      api.listQuestions({ limit: 1 }).catch(() => null),
      canManageTenants ? api.listAllUsers({ limit: 1 }).catch(() => null) : Promise.resolve(null),
      api.listPaths().catch(() => null),
    ]).then(([c, q, u, p]) => {
      setStats({
        colleges: c?.data?.data?.total || 0,
        questions: q?.data?.data?.total || 0,
        users: u?.data?.data?.total || 0,
        paths: Array.isArray(p?.data?.data) ? p.data.data.length : 0,
      });
      setRecentColleges(c?.data?.data?.colleges || []);
      setLoading(false);
    });
  }, [canManageTenants]);

  const cards = [
    ...(canManageTenants ? [
      { label: 'Colleges', value: stats.colleges, icon: Building2, to: '/admin/colleges', color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-500/10' },
      { label: 'Users', value: stats.users, icon: Users, to: '/admin/users', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    ] : []),
    { label: 'Questions', value: stats.questions, icon: FileQuestion, to: '/admin/questions', color: 'text-cyber-600 dark:text-cyber-400', bg: 'bg-cyber-500/10' },
    { label: 'Learning Paths', value: stats.paths, icon: BookOpen, to: '/admin/questions', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  if (loading) return <div className="text-subtle p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content">Platform Overview</h1>
        <p className="text-muted mt-1">Cybervie platform statistics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((s, i) => (
          <Link key={i} to={s.to} className="card p-5 hover:border-border-strong transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-content">{s.value}</div>
                <div className="text-sm text-muted mt-1">{s.label}</div>
              </div>
              <div className={`w-12 h-12 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon size={22} className={s.color} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {canManageTenants && (
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-content">Recent colleges</h2>
          <Link to="/admin/colleges" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-500 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentColleges.length === 0 ? (
          <div className="p-8 text-center text-subtle text-sm">No colleges registered yet.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {recentColleges.map((c) => (
              <div key={c._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-content">{c.name}</div>
                  <div className="text-xs text-subtle">{c.shortCode}{c.city ? ` · ${c.city}` : ''}</div>
                </div>
                <span className={`badge ${c.status === 'active' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
