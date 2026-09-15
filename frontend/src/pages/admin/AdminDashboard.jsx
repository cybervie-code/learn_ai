import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Building2, FileQuestion, Users, Trophy, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ colleges: 0, questions: 0, users: 0, paths: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listColleges({ limit: 1 }).catch(() => null),
      api.listQuestions({ limit: 1 }).catch(() => null),
      api.listAllUsers({ limit: 1 }).catch(() => null),
      api.listPaths({ limit: 1 }).catch(() => null),
    ]).then(([c, q, u, p]) => {
      setStats({
        colleges: c?.data?.data?.total || 0,
        questions: q?.data?.data?.total || 0,
        users: u?.data?.data?.total || 0,
        paths: p?.data?.data?.length || 0,
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: 'Colleges', value: stats.colleges, icon: Building2, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Questions', value: stats.questions, icon: FileQuestion, color: 'text-cyber-600 dark:text-cyber-400', bg: 'bg-cyber-500/10' },
    { label: 'Users', value: stats.users, icon: Users, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    { label: 'Learning Paths', value: stats.paths, icon: Trophy, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
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

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-content mb-4 flex items-center gap-2">
          <Activity size={18} className="text-brand-600 dark:text-brand-400" /> Quick Actions
        </h2>
        <div className="grid md:grid-cols-3 gap-3">
          <a href="/app/colleges" className="btn-secondary justify-start">
            <Building2 size={16} /> Manage Colleges
          </a>
          <a href="/app/questions" className="btn-secondary justify-start">
            <FileQuestion size={16} /> Manage Questions
          </a>
          <a href="/app/users" className="btn-secondary justify-start">
            <Users size={16} /> View Users
          </a>
        </div>
      </div>
    </div>
  );
}
