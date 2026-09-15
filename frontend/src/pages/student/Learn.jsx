import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Clock, ArrowRight, BookOpen, Zap } from 'lucide-react';

export default function Learn() {
  const { slug } = useParams();
  const [paths, setPaths] = useState([]);
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) return <div className="text-subtle p-8">Loading...</div>;

  // Path detail view
  if (slug && path) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/app/learn" className="text-sm text-muted hover:text-content flex items-center gap-1">
          <ArrowRight size={14} className="rotate-180" /> All Paths
        </Link>

        <div className="card p-8 bg-gradient-to-br from-brand-950/30 to-gray-900">
          <div className="text-5xl mb-4">{path.icon || '🧠'}</div>
          <h1 className="text-3xl font-bold text-content mb-3">{path.title}</h1>
          <p className="text-muted mb-6">{path.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-subtle">
            <span className="flex items-center gap-1"><Clock size={14} /> {path.estimatedHours} hours</span>
            <span className={`badge-${path.difficulty}`}>{path.difficulty}</span>
            <span>{path.missions?.length || 0} missions</span>
            {path.competencies?.length > 0 && <span>{path.competencies.length} competencies</span>}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-content">Missions</h2>
          {path.missions?.map((m, i) => {
            const mission = m.mission;
            if (!mission) return null;
            return (
              <Link
                key={m._id || i}
                to={`/app/learn/mission/${mission.slug}`}
                className="card p-5 hover:border-brand-600/50 transition-all group flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center text-2xl shrink-0">
                  {mission.icon || '📘'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-subtle font-mono">Mission {i + 1}</span>
                  <h3 className="font-semibold text-content group-hover:text-brand-600 dark:text-brand-400 transition-colors">{mission.title}</h3>
                  <p className="text-sm text-muted line-clamp-1">{mission.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-subtle">
                    <span className="flex items-center gap-1"><Clock size={11} /> {mission.estimatedMinutes} min</span>
                    <span className="flex items-center gap-1"><Zap size={11} /> {mission.xpReward} XP</span>
                    <span className={`badge-${mission.difficulty}`}>{mission.difficulty}</span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-subtle group-hover:text-brand-600 dark:text-brand-400 transition-colors shrink-0" />
              </Link>
            );
          })}
          {(!path.missions || path.missions.length === 0) && (
            <div className="card p-8 text-center text-subtle">No missions in this path yet.</div>
          )}
        </div>
      </div>
    );
  }

  // Path list view
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content">Learning Paths</h1>
        <p className="text-muted mt-1">Choose a track and start mastering AI</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {paths.map((path) => (
          <Link key={path._id} to={`/app/learn/${path.slug}`} className="card p-6 hover:border-brand-600/50 transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand-600/10 flex items-center justify-center text-3xl shrink-0">
                {path.icon || '🧠'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-content group-hover:text-brand-600 dark:text-brand-400 transition-colors">{path.title}</h3>
                  {path.isFeatured && <span className="badge bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 text-xs">Featured</span>}
                </div>
                <p className="text-sm text-muted line-clamp-2">{path.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-subtle">
                  <span className="flex items-center gap-1"><Clock size={12} /> {path.estimatedHours}h</span>
                  <span className={`badge-${path.difficulty}`}>{path.difficulty}</span>
                  <span>{path.missions?.length || 0} missions</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {paths.length === 0 && (
        <div className="card p-12 text-center">
          <BookOpen size={32} className="mx-auto text-subtle mb-3" />
          <p className="text-subtle">No learning paths published yet.</p>
        </div>
      )}
    </div>
  );
}
