import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Clock, Zap, ArrowRight, ArrowLeft, Target, BookOpen, Play, Lock } from 'lucide-react';

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

  // Locked lesson — sequential gating keeps the path in order
  if (mission.locked) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          to={mission.learningPath?.slug ? `/app/learn/${mission.learningPath.slug}` : '/app/learn'}
          className="text-sm text-muted hover:text-content flex items-center gap-1"
        >
          <ArrowLeft size={14} /> {mission.learningPath?.title ? `Back to ${mission.learningPath.title}` : 'Back to learning'}
        </Link>

        <div className="card p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-600/5 to-transparent pointer-events-none" />
          <div className="relative w-20 h-20 rounded-2xl mx-auto mb-6 bg-surface-2 border border-border-strong flex items-center justify-center animate-float">
            <Lock size={34} className="text-subtle" />
          </div>
          <h1 className="text-2xl font-bold text-content">This lesson is locked</h1>
          <p className="text-sm font-medium text-content mt-2">{mission.title}</p>
          <p className="text-muted mt-1 max-w-md mx-auto">
            {mission.lockedReason || 'Pass the previous lesson\u2019s checkpoint to unlock this lesson.'}
          </p>
          <Link
            to={mission.learningPath?.slug ? `/app/learn/${mission.learningPath.slug}` : '/app/learn'}
            className="btn-primary mt-6 inline-flex"
          >
            <ArrowLeft size={16} /> Back to the course track
          </Link>
        </div>
      </div>
    );
  }

  const startQuiz = () => {
    if (mission.quiz?._id) {
      navigate(`/app/quiz/${mission.quiz._id}`, {
        state: { from: 'mission', missionSlug: mission.slug },
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to={mission.learningPath?.slug ? `/app/learn/${mission.learningPath.slug}` : '/app/learn'}
        className="text-sm text-muted hover:text-content flex items-center gap-1"
      >
        <ArrowLeft size={14} /> {mission.learningPath?.title ? `Back to ${mission.learningPath.title}` : 'Back to learning'}
      </Link>

      {/* Mission header */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-brand-600/10 to-brand-600/5">
        <div className="text-5xl mb-4">{mission.icon || '📘'}</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-content mb-2">{mission.title}</h1>
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
          if (block.type === 'code') {
            return (
              <pre key={i} className="p-4 rounded-lg bg-surface-2 border border-border-strong text-sm font-mono text-content overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {block.content}
              </pre>
            );
          }
          if (block.type === 'image') {
            return <img key={i} src={block.url} alt={block.altText || ''} className="rounded-lg w-full" />;
          }
          return null;
        })}
      </div>

      {/* Checkpoint quiz */}
      {mission.quiz && (
        <div className="card p-6 bg-gradient-to-br from-cyber-500/10 to-cyber-500/5 border-cyber-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-content">Checkpoint quiz</h2>
              <p className="text-sm text-muted mt-1">
                {mission.quiz.totalQuestions || 'Multiple'} questions • Immediate feedback • Earn {mission.xpReward} XP
              </p>
            </div>
            <button onClick={startQuiz} className="btn-primary shrink-0 w-full sm:w-auto justify-center">
              <Play size={16} /> Take checkpoint <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Wayfinding */}
      <p className="text-center text-xs text-subtle">
        Want more drilling on this topic?{' '}
        <Link to="/app/quiz" className="text-brand-600 dark:text-brand-400 hover:underline">
          Head to Quizzes
        </Link>
      </p>
    </div>
  );
}
