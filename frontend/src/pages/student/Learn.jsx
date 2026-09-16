import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import {
  Clock, ArrowRight, ArrowLeft, BookOpen, Zap, Search,
  CheckCircle2, Sparkles, Trophy, ChevronRight, Layers, Play,
} from 'lucide-react';

const DIFFICULTIES = [
  { value: '', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const DIFF_COLOR = {
  beginner: 'text-green-600 dark:text-green-400',
  intermediate: 'text-yellow-600 dark:text-yellow-400',
  advanced: 'text-red-600 dark:text-red-400',
};

export default function Learn() {
  const { slug } = useParams();
  const [paths, setPaths] = useState([]);
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    setLoading(true);
    if (slug) {
      api.getPath(slug).then((res) => {
        setPath(res.data.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      api.listPaths().then((res) => {
        setPaths(res.data.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [slug]);

  const filtered = useMemo(() => paths.filter((p) => {
    if (difficulty && p.difficulty !== difficulty) return false;
    if (search && !`${p.title} ${p.description}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [paths, search, difficulty]);

  const totals = useMemo(() => {
    const totalMissions = paths.reduce((s, p) => s + (p.progress?.totalMissions ?? p.missions?.length ?? 0), 0);
    const done = paths.reduce((s, p) => s + (p.progress?.completedMissions ?? 0), 0);
    const pct = totalMissions ? Math.round((done / totalMissions) * 100) : 0;
    return { totalMissions, done, pct };
  }, [paths]);

  if (loading) return <div className="text-subtle p-8">Loading...</div>;

  /* ================= Path detail ================= */
  if (slug && path) {
    const missions = path.missions || [];
    const done = missions.filter((m) => m.completed).length;
    const pct = missions.length ? Math.round((done / missions.length) * 100) : 0;
    const nextIdx = missions.findIndex((m) => !m.completed);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/app/learn" className="text-sm text-muted hover:text-content flex items-center gap-1 w-fit">
          <ArrowLeft size={14} /> All paths
        </Link>

        {/* Hero */}
        <div className="card overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-brand-600 via-cyber-500 to-brand-600" />
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center text-3xl sm:text-4xl shrink-0">
                {path.icon || '🧠'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-content">{path.title}</h1>
                  {path.isFeatured && (
                    <span className="badge bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 text-xs">
                      <Sparkles size={11} /> Featured
                    </span>
                  )}
                </div>
                <p className="text-muted mt-1.5 text-sm">{path.description}</p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs text-subtle">
                  <span className="flex items-center gap-1.5"><Clock size={13} /> {path.estimatedHours}h total</span>
                  <span className={`badge-${path.difficulty}`}>{path.difficulty}</span>
                  <span className="flex items-center gap-1.5"><Layers size={13} /> {missions.length} missions</span>
                  {path.competencies?.length > 0 && <span>{path.competencies.length} competencies</span>}
                </div>
              </div>
            </div>

            {missions.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-subtle font-medium">{done} of {missions.length} completed</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{pct}%</span>
                </div>
                <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-600 to-cyber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mission track */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-content text-sm uppercase tracking-wider">Missions</h2>
            {nextIdx >= 0 && <span className="text-xs text-subtle">Next up: Mission {nextIdx + 1}</span>}
          </div>
          <div className="divide-y divide-border/60">
            {missions.map((m, i) => {
              const mission = m.mission;
              if (!mission) return null;
              const completed = m.completed;
              const isNext = !completed && i === nextIdx;
              return (
                <Link
                  key={m._id || i}
                  to={`/app/learn/mission/${mission.slug}`}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors group ${
                    isNext ? 'bg-brand-500/5' : 'hover:bg-surface-2/40'
                  }`}
                >
                  {/* Status indicator */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold border ${
                    completed
                      ? 'bg-green-500/15 border-green-500/30 text-green-600 dark:text-green-400'
                      : isNext
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-surface-2 border-border-strong text-subtle'
                  }`}>
                    {completed ? <CheckCircle2 size={17} /> : i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium text-sm truncate ${completed ? 'text-muted' : 'text-content group-hover:text-brand-600 dark:group-hover:text-brand-400'} transition-colors`}>
                        {mission.title}
                      </h3>
                      {isNext && <span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400 text-[10px] shrink-0">Up next</span>}
                    </div>
                    <p className="text-xs text-subtle truncate mt-0.5">{mission.description}</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 text-xs text-subtle shrink-0">
                    <span className="flex items-center gap-1"><Clock size={11} /> {mission.estimatedMinutes}m</span>
                    <span className="flex items-center gap-1"><Zap size={11} /> {mission.xpReward}</span>
                    <span className={`badge-${mission.difficulty} !text-[10px]`}>{mission.difficulty}</span>
                  </div>
                  <ChevronRight size={16} className="text-subtle group-hover:text-brand-500 transition-colors shrink-0" />
                </Link>
              );
            })}
            {missions.length === 0 && (
              <div className="p-8 text-center text-subtle text-sm">No missions in this path yet.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ================= Catalog ================= */
  const featured = filtered.find((p) => p.isFeatured);
  const rest = filtered.filter((p) => p !== featured);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-1">Learn</div>
          <h1 className="text-2xl font-bold text-content">Learning Paths</h1>
          <p className="text-muted mt-1 text-sm">Structured tracks — lessons first, then a mission quiz to prove it.</p>
        </div>
        {totals.totalMissions > 0 && (
          <div className="card px-4 py-3 min-w-[190px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-subtle flex items-center gap-1.5"><Trophy size={12} className="text-yellow-600 dark:text-yellow-400" /> Your progress</span>
              <span className="font-bold text-content">{totals.pct}%</span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-600 to-cyber-500 rounded-full" style={{ width: `${totals.pct}%` }} />
            </div>
            <div className="text-[11px] text-subtle mt-1.5">{totals.done} of {totals.totalMissions} missions done</div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            className="input pl-9"
            placeholder="Search paths..."
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

      {/* Featured path — wide card */}
      {featured && <FeaturedCard path={featured} />}

      {/* Path grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {rest.map((path) => <PathCard key={path._id} path={path} />)}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <BookOpen size={32} className="mx-auto text-subtle mb-3" />
          <p className="text-subtle">{paths.length === 0 ? 'No learning paths published yet.' : 'No paths match your filters.'}</p>
        </div>
      )}
    </div>
  );
}

function pathStats(path) {
  const total = path.progress?.totalMissions ?? path.missions?.length ?? 0;
  const done = path.progress?.completedMissions ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const status = done === 0 ? 'not-started' : done === total && total > 0 ? 'done' : 'in-progress';
  return { total, done, pct, status };
}

function FeaturedCard({ path }) {
  const { total, done, pct, status } = pathStats(path);
  return (
    <Link to={`/app/learn/${path.slug}`} className="card overflow-hidden hover:border-brand-600/50 transition-all group block">
      <div className="h-1.5 bg-gradient-to-r from-brand-600 via-cyber-500 to-brand-600" />
      <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center text-4xl shrink-0">
          {path.icon || '🧠'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-content group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{path.title}</h3>
            <span className="badge bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 text-xs"><Sparkles size={10} /> Featured</span>
            <span className={`badge-${path.difficulty}`}>{path.difficulty}</span>
          </div>
          <p className="text-sm text-muted mt-1.5 line-clamp-2">{path.description}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-subtle">
            <span className="flex items-center gap-1"><Clock size={12} /> {path.estimatedHours}h</span>
            <span className="flex items-center gap-1"><Layers size={12} /> {total} missions</span>
            {status === 'done' && <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1"><CheckCircle2 size={12} /> Completed</span>}
          </div>
        </div>
        <div className="sm:w-48 shrink-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-subtle">{status === 'not-started' ? 'Not started' : `${done}/${total} done`}</span>
            <span className="font-bold text-brand-600 dark:text-brand-400">{pct}%</span>
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-3">
            <div className={`h-full rounded-full ${status === 'done' ? 'bg-green-500' : 'bg-gradient-to-r from-brand-600 to-cyber-500'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="btn-primary w-full text-sm justify-center">
            <Play size={14} /> {status === 'not-started' ? 'Start path' : status === 'done' ? 'Review' : 'Continue'}
          </div>
        </div>
      </div>
    </Link>
  );
}

function PathCard({ path }) {
  const { total, done, pct, status } = pathStats(path);
  return (
    <Link to={`/app/learn/${path.slug}`} className="card overflow-hidden hover:border-brand-600/50 transition-all group flex flex-col h-full">
      <div className={`h-1 ${status === 'done' ? 'bg-green-500' : 'bg-gradient-to-r from-brand-600 to-cyber-500'}`} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border-strong flex items-center justify-center text-2xl shrink-0">
            {path.icon || '🧠'}
          </div>
          <span className={`badge-${path.difficulty}`}>{path.difficulty}</span>
        </div>
        <h3 className="font-semibold text-content group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{path.title}</h3>
        <p className="text-sm text-muted mt-1 line-clamp-2 flex-1">{path.description}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-subtle">
          <span className="flex items-center gap-1"><Clock size={12} /> {path.estimatedHours}h</span>
          <span className="flex items-center gap-1"><Layers size={12} /> {total} missions</span>
        </div>
        <div className="mt-4 pt-4 border-t border-border/60">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className={status === 'done' ? 'text-green-600 dark:text-green-400 font-medium' : status === 'in-progress' ? 'text-brand-600 dark:text-brand-400 font-medium' : 'text-subtle'}>
              {status === 'not-started' ? 'Not started' : status === 'done' ? 'Completed' : `${done}/${total} done`}
            </span>
            <span className="text-subtle flex items-center gap-1">{pct}%<ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" /></span>
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${status === 'done' ? 'bg-green-500' : 'bg-gradient-to-r from-brand-600 to-cyber-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
