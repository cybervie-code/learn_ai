import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import {
  Brain, Trophy, Flame, Target, BookOpen, ArrowRight, TrendingUp,
  CheckCircle2, Clock, Zap, Award,
} from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [paths, setPaths] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMyProfile().catch(() => null),
      api.listPaths().catch(() => null),
      api.listAssignments().catch(() => null),
    ]).then(([profileRes, pathsRes, assignRes]) => {
      if (profileRes) setProfile(profileRes.data.data);
      if (pathsRes) setPaths(pathsRes.data.data);
      if (assignRes) setAssignments(assignRes.data.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-subtle">Loading...</div>;
  }

  const stats = [
    { label: 'Learning XP', value: profile?.learningXP || 0, icon: Zap, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Day Streak', value: profile?.streak?.current || 0, icon: Flame, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Quizzes Done', value: profile?.stats?.totalQuizzes || 0, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    { label: 'Avg Score', value: `${profile?.stats?.averageScore || 0}%`, icon: TrendingUp, color: 'text-cyber-600 dark:text-cyber-400', bg: 'bg-cyber-500/10' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-content">
            Welcome back, {profile?.name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-muted mt-1">Continue your AI learning journey</p>
        </div>
        <Link to="/app/learn" className="btn-primary">
          <BookOpen size={16} /> Continue Learning
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-content">{stat.value}</div>
                <div className="text-sm text-muted mt-1">{stat.label}</div>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-content flex items-center gap-2">
            <Brain size={18} className="text-brand-600 dark:text-brand-400" /> Continue Learning
          </h2>
          {paths.slice(0, 3).map((path) => (
            <Link
              key={path._id}
              to={`/app/learn/${path.slug}`}
              className="card p-5 hover:border-brand-600/50 transition-all group block"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-brand-600/10 flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                  {path.icon || '🧠'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-content group-hover:text-brand-600 dark:text-brand-400 transition-colors">{path.title}</h3>
                  <p className="text-sm text-muted mt-1 line-clamp-2">{path.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-subtle">
                    <span className="flex items-center gap-1"><Clock size={12} /> {path.estimatedHours}h</span>
                    <span className={`badge-${path.difficulty}`}>{path.difficulty}</span>
                    <span>{path.missions?.length || 0} missions</span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-subtle group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors mt-2 shrink-0" />
              </div>
            </Link>
          ))}
          {paths.length === 0 && (
            <div className="card p-8 text-center text-subtle">No learning paths available yet.</div>
          )}
        </div>

        {/* Assignments */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-content flex items-center gap-2">
            <Target size={18} className="text-cyber-600 dark:text-cyber-400" /> Assignments
          </h2>
          {assignments.slice(0, 5).map((a) => (
            <div key={a._id} className="card p-4">
              <h3 className="font-medium text-content text-sm">{a.title}</h3>
              <p className="text-xs text-subtle mt-1">{a.quiz?.title}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-subtle">
                  Due: {new Date(a.dueDate).toLocaleDateString()}
                </span>
                {a.mySubmission ? (
                  <span className="badge bg-green-500/15 text-green-600 dark:text-green-400 text-xs">
                    <CheckCircle2 size={10} /> {a.mySubmission.percentage}%
                  </span>
                ) : (
                  <span className="badge bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 text-xs">Pending</span>
                )}
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <div className="card p-6 text-center text-subtle text-sm">No assignments yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
