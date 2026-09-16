import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import {
  Brain, ArrowRight, Clock, Search, CheckCircle2,
  RotateCcw, Trophy, Target, Zap, Layers, Play,
} from 'lucide-react';

const DIFFICULTIES = [
  { value: '', label: 'All' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const ACCENT = {
  beginner: 'from-green-500 to-emerald-500',
  intermediate: 'from-yellow-500 to-orange-500',
  advanced: 'from-red-500 to-rose-500',
};

export default function Practice() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [attemptsByQuiz, setAttemptsByQuiz] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    Promise.all([
      api.listQuizzes({ status: 'published', limit: 100 }).catch(() => null),
      api.getMyAttempts({ status: 'finalised', limit: 100 }).catch(() => null),
    ]).then(([qRes, aRes]) => {
      setQuizzes(qRes?.data?.data?.quizzes || []);
      const map = {};
      (aRes?.data?.data?.attempts || []).forEach((a) => {
        const id = String(a.quiz);
        if (!map[id]) map[id] = { best: 0, count: 0 };
        map[id].count += 1;
        if (a.percentage > map[id].best) map[id].best = a.percentage;
      });
      setAttemptsByQuiz(map);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => quizzes.filter((q) => {
    if (difficulty && q.difficulty !== difficulty) return false;
    if (search && !`${q.title} ${q.description || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [quizzes, search, difficulty]);

  const stats = useMemo(() => {
    const attempted = Object.values(attemptsByQuiz);
    return {
      available: quizzes.length,
      attempted: attempted.length,
      completed: quizzes.filter((q) => attemptsByQuiz[String(q._id)]?.best >= 60).length,
      avgBest: attempted.length ? Math.round(attempted.reduce((s, x) => s + x.best, 0) / attempted.length) : 0,
    };
  }, [quizzes, attemptsByQuiz]);

  if (loading) return <div className="text-subtle p-8">Loading...</div>;

  const statCards = [
    { label: 'Rooms available', value: stats.available, icon: Layers, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Attempted', value: stats.attempted, icon: Target, color: 'text-cyber-600 dark:text-cyber-400', bg: 'bg-cyber-500/10' },
    { label: 'Completed', value: stats.completed, icon: Trophy, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Avg best score', value: `${stats.avgBest}%`, icon: Zap, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyber-600 dark:text-cyber-400 mb-1">Practice Arena</div>
        <h1 className="text-2xl font-bold text-content">Challenge Rooms</h1>
        <p className="text-muted mt-1 text-sm">Score 60%+ to clear a room. XP and leaderboard rank count your best run.</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-content">{s.value}</div>
              <div className="text-xs text-subtle truncate">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            className="input pl-9"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                difficulty === d.value ? 'bg-brand-600 text-white' : 'bg-surface-2 text-muted hover:text-content'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((q) => {
          const stat = attemptsByQuiz[String(q._id)];
          const attempted = Boolean(stat);
          const passed = stat && stat.best >= 60;
          const accent = ACCENT[q.difficulty] || 'from-brand-500 to-cyber-500';
          return (
            <div key={q._id} className="card overflow-hidden hover:border-brand-600/50 transition-all flex flex-col group">
              {/* Difficulty accent bar */}
              <div className={`h-1 bg-gradient-to-r ${accent}`} />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border-strong flex items-center justify-center shrink-0">
                    <Brain size={18} className="text-brand-600 dark:text-brand-400" />
                  </div>
                  {passed ? (
                    <span className="badge bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20 text-xs shrink-0">
                      <CheckCircle2 size={11} /> Cleared · {stat.best}%
                    </span>
                  ) : attempted ? (
                    <span className="badge bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 text-xs shrink-0">
                      Best {stat.best}%
                    </span>
                  ) : (
                    <span className="badge bg-surface-2 text-subtle border border-border-strong text-xs shrink-0">New</span>
                  )}
                </div>

                <h3 className="font-semibold text-content mt-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{q.title}</h3>
                <p className="text-sm text-muted mt-1 line-clamp-2 flex-1">{q.description || 'Test your knowledge in this challenge room.'}</p>

                <div className="flex items-center gap-3 mt-3 text-xs text-subtle flex-wrap">
                  <span className={`badge-${q.difficulty}`}>{q.difficulty}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {q.estimatedMinutes} min</span>
                  <span>{q.totalQuestions} questions</span>
                  {attempted && <span>{stat.count} attempt{stat.count > 1 ? 's' : ''}</span>}
                </div>

                <button
                  onClick={() => navigate(`/app/quiz/${q._id}`)}
                  className={`w-full mt-4 justify-center ${attempted ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {attempted
                    ? <><RotateCcw size={14} /> {passed ? 'Replay' : 'Retry'}</>
                    : <><Play size={14} /> Start room</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Brain size={32} className="mx-auto text-subtle mb-3" />
          <p className="text-subtle">{quizzes.length === 0 ? 'No practice rooms available yet.' : 'No rooms match your filters.'}</p>
        </div>
      )}
    </div>
  );
}
