import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Clock, Zap, ArrowRight, ArrowLeft, Target, BookOpen, Play } from 'lucide-react';

export default function MissionDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMission(slug).then((res) => {
      setMission(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="text-subtle p-8">Loading...</div>;
  if (!mission) return <div className="text-subtle p-8">Mission not found.</div>;

  const startQuiz = () => {
    if (mission.quiz?._id) {
      navigate(`/app/quiz/${mission.quiz._id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/app/learn" className="text-sm text-muted hover:text-content flex items-center gap-1">
        <ArrowLeft size={14} /> Back to Paths
      </Link>

      {/* Mission header */}
      <div className="card p-8 bg-gradient-to-br from-brand-600/10 to-brand-600/5">
        <div className="text-5xl mb-4">{mission.icon || '📘'}</div>
        <h1 className="text-3xl font-bold text-content mb-2">{mission.title}</h1>
        <p className="text-muted mb-6">{mission.description}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-subtle">
          <span className="flex items-center gap-1"><Clock size={14} /> {mission.estimatedMinutes} min</span>
          <span className="flex items-center gap-1"><Zap size={14} /> {mission.xpReward} XP</span>
          <span className={`badge-${mission.difficulty}`}>{mission.difficulty}</span>
        </div>
      </div>

      {/* Learning objectives */}
      {mission.learningObjectives?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-content mb-4 flex items-center gap-2">
            <Target size={18} className="text-cyber-600 dark:text-cyber-400" /> Learning Objectives
          </h2>
          <ul className="space-y-2">
            {mission.learningObjectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <span className="text-brand-600 dark:text-brand-400 mt-0.5">•</span> {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content blocks */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-content flex items-center gap-2">
          <BookOpen size={18} className="text-brand-600 dark:text-brand-400" /> Lesson
        </h2>
        {mission.contentBlocks?.map((block, i) => {
          if (block.type === 'heading') {
            return <h3 key={i} className="text-xl font-semibold text-content mt-4">{block.content}</h3>;
          }
          if (block.type === 'text') {
            return <p key={i} className="text-muted leading-relaxed">{block.content}</p>;
          }
          if (block.type === 'callout') {
            return (
              <div key={i} className="p-4 rounded-lg bg-brand-500/10 border border-brand-500/20 text-sm text-content">
                {block.content}
              </div>
            );
          }
          if (block.type === 'image') {
            return <img key={i} src={block.url} alt={block.altText || ''} className="rounded-lg w-full" />;
          }
          return null;
        })}
      </div>

      {/* Start quiz */}
      {mission.quiz && (
        <div className="card p-6 bg-gradient-to-br from-cyber-500/10 to-cyber-500/5 border-cyber-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-content">Ready to test your knowledge?</h2>
              <p className="text-sm text-muted mt-1">
                {mission.quiz.totalQuestions || 'Multiple'} questions • Immediate feedback • Earn {mission.xpReward} XP
              </p>
            </div>
            <button onClick={startQuiz} className="btn-primary">
              <Play size={16} /> Start Quiz <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
