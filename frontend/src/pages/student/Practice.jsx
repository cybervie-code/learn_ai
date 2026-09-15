import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Brain, ArrowRight, Clock, Zap } from 'lucide-react';

export default function Practice() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listQuizzes({ status: 'published' }).then((res) => {
      setQuizzes(res.data.data.quizzes || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-subtle p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content flex items-center gap-2">
          <Brain size={24} className="text-brand-600 dark:text-brand-400" /> Practice Quizzes
        </h1>
        <p className="text-muted mt-1">Sharpen your AI and cybersecurity knowledge</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {quizzes.map((q) => (
          <div key={q._id} className="card p-5 hover:border-brand-600/50 transition-all">
            <h3 className="font-semibold text-content">{q.title}</h3>
            {q.description && <p className="text-sm text-muted mt-1">{q.description}</p>}
            <div className="flex items-center gap-3 mt-3 text-xs text-subtle">
              <span className="flex items-center gap-1"><Clock size={12} /> {q.estimatedMinutes} min</span>
              <span>{q.totalQuestions} questions</span>
              <span className={`badge-${q.difficulty}`}>{q.difficulty}</span>
            </div>
            <button onClick={() => navigate(`/app/quiz/${q._id}`)} className="btn-primary w-full mt-4">
              Start Quiz <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {quizzes.length === 0 && (
        <div className="card p-12 text-center text-subtle">No practice quizzes available yet.</div>
      )}
    </div>
  );
}
