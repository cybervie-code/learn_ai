import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Clock, BookOpen, ArrowRight } from 'lucide-react';

export default function PublicPaths() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listPaths().then((res) => {
      setPaths(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-content mb-3">Learning Paths</h1>
        <p className="text-muted max-w-2xl mx-auto">
          Structured tracks to master AI fundamentals, generative AI, responsible use, and AI security.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {paths.map((path) => (
          <div key={path._id} className="card p-6 hover:border-brand-600/50 transition-all">
            <div className="text-4xl mb-3">{path.icon || '🧠'}</div>
            <h3 className="text-xl font-semibold text-content mb-2">{path.title}</h3>
            <p className="text-sm text-muted mb-4">{path.description}</p>
            <div className="flex items-center gap-3 text-xs text-subtle mb-4">
              <span className="flex items-center gap-1"><Clock size={12} /> {path.estimatedHours}h</span>
              <span className={`badge-${path.difficulty}`}>{path.difficulty}</span>
              <span>{path.missions?.length || 0} missions</span>
            </div>
            <Link to="/login" className="btn-secondary w-full text-sm">
              Start Learning <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>

      {loading && <div className="text-center text-subtle py-12">Loading...</div>}
      {!loading && paths.length === 0 && (
        <div className="card p-12 text-center">
          <BookOpen size={32} className="mx-auto text-subtle mb-3" />
          <p className="text-subtle">No learning paths published yet.</p>
        </div>
      )}
    </div>
  );
}
