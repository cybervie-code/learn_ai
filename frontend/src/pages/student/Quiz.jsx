import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import {
  Brain, ArrowRight, Clock, CheckCircle2,
  RotateCcw, Trophy, Zap, Play, Layers, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Same completion rule as Learn: a finalised attempt at >= 60%
const PASS_MARK = 60;

// Semantic palette only: indigo = current/locked, green = passed,
// amber = final assessment. Difficulty is just coloured text, not a banner.
const DIFF_TEXT = {
  beginner: 'text-green-600 dark:text-green-400',
  intermediate: 'text-amber-600 dark:text-amber-400',
  advanced: 'text-red-600 dark:text-red-400',
};

const stripCheckpointSuffix = (title) => title.replace(/\s*—\s*Checkpoint\s*$/i, '');

// Staggered entrance — capped so late cards don't wait forever
const enterStyle = (i) => ({
  animationDelay: `${Math.min(i, 10) * 45}ms`,
  animationFillMode: 'backwards',
});

export default function Quiz() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [attemptsByQuiz, setAttemptsByQuiz] = useState({});
  const [inProgress, setInProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listQuizzes({ status: 'published', limit: 100 }).catch(() => null),
      api.getMyAttempts({ status: 'finalised', limit: 100 }).catch(() => null),
      api.getMyAttempts({ status: 'in-progress', limit: 20 }).catch(() => null),
    ]).then(([qRes, aRes, ipRes]) => {
      setQuizzes(qRes?.data?.data?.quizzes || []);
      const map = {};
      (aRes?.data?.data?.attempts || []).forEach((a) => {
        const id = String(a.quiz);
        if (!map[id]) map[id] = { best: 0, count: 0 };
        map[id].count += 1;
        if (a.percentage > map[id].best) map[id].best = a.percentage;
      });
      setAttemptsByQuiz(map);
      // One row per quiz — attempts arrive newest-first, and attempts on
      // quizzes that no longer exist are dropped by the quiz-id filter below
      const seen = new Set();
      setInProgress((ipRes?.data?.data?.attempts || []).filter((a) => {
        const id = String(a.quiz);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      }));
      setLoading(false);
    });
  }, []);

  // Hide resume rows whose quiz is gone (deleted/retired/unpublished)
  const resumable = useMemo(() => {
    const ids = new Set(quizzes.map((q) => String(q._id)));
    return inProgress.filter((a) => ids.has(String(a.quiz)));
  }, [inProgress, quizzes]);

  // Assessment lens of the same data spine as Learn: quizzes that belong to a
  // path group under that path (checkpoints by lesson order, final last).
  const pathGroups = useMemo(() => {
    const byPath = new Map();
    for (const q of quizzes) {
      const lp = q.learningPath;
      if (lp && (lp.slug || lp._id)) {
        const key = lp.slug || String(lp._id);
        if (!byPath.has(key)) {
          byPath.set(key, {
            key,
            title: lp.title || 'Course',
            slug: lp.slug || null,
            icon: lp.icon || null,
            quizzes: [],
          });
        }
        byPath.get(key).quizzes.push(q);
      }
    }

    const groups = [...byPath.values()].sort((a, b) => a.title.localeCompare(b.title));
    for (const g of groups) {
      g.quizzes.sort((a, b) => {
        const aFinal = !a.mission;
        const bFinal = !b.mission;
        if (aFinal !== bFinal) return aFinal ? 1 : -1;
        // Checkpoints by lesson order; tiered finals by level
        if (aFinal) return (a.level ?? 1) - (b.level ?? 1);
        return (a.mission?.order ?? 0) - (b.mission?.order ?? 0);
      });
      const bestOf = (q) => attemptsByQuiz[String(q._id)]?.best ?? 0;
      g.passedCount = g.quizzes.filter((q) => bestOf(q) >= PASS_MARK).length;
      // Sequential gating mirrors Learn: everything after the first unpassed
      // assessment (incl. the final) stays locked
      const firstUnpassedIdx = g.quizzes.findIndex((q) => bestOf(q) < PASS_MARK);
      g.upNextId = firstUnpassedIdx === -1 ? null : g.quizzes[firstUnpassedIdx]._id;
      g.lockedIds = new Set(
        firstUnpassedIdx === -1 ? [] : g.quizzes.slice(firstUnpassedIdx + 1).map((q) => String(q._id))
      );
      g.checkpointsLeft = g.quizzes.filter((q) => q.mission && bestOf(q) < PASS_MARK).length;
    }
    return groups;
  }, [quizzes, attemptsByQuiz]);

  const stats = useMemo(() => {
    const visible = pathGroups.flatMap((g) => g.quizzes);
    const attempted = Object.values(attemptsByQuiz);
    return {
      total: visible.length,
      passed: visible.filter((q) => (attemptsByQuiz[String(q._id)]?.best ?? 0) >= PASS_MARK).length,
      inProgress: resumable.length,
      avgBest: attempted.length ? Math.round(attempted.reduce((s, x) => s + x.best, 0) / attempted.length) : 0,
    };
  }, [pathGroups, attemptsByQuiz, resumable]);

  if (loading) return <div className="text-subtle p-8">Loading...</div>;

  const openQuiz = (q) => navigate(`/app/quiz/${q._id}`, { state: { from: 'quiz' } });

  const statItems = [
    { icon: Layers, label: 'assessments', value: stats.total, color: 'text-brand-600 dark:text-brand-400' },
    { icon: Trophy, label: 'passed', value: stats.passed, color: 'text-green-600 dark:text-green-400' },
    { icon: Play, label: 'in progress', value: stats.inProgress, color: 'text-amber-600 dark:text-amber-400' },
    { icon: Zap, label: 'avg best', value: `${stats.avgBest}%`, color: 'text-cyber-600 dark:text-cyber-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-1">Quiz Arena</div>
        <h1 className="text-2xl font-bold text-content">Assessments</h1>
        <p className="text-muted mt-1 text-sm">
          Score {PASS_MARK}%+ to clear each assessment — your best run feeds XP and leaderboard rank.
        </p>
      </div>

      {/* Stats strip */}
      <div className="card px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8">
        {statItems.map((s) => (
          <span key={s.label} className="flex items-center gap-2 text-sm text-subtle">
            <s.icon size={15} className={s.color} />
            <b className="text-content font-semibold">{s.value}</b> {s.label}
          </span>
        ))}
      </div>

      {/* Resume in-progress attempts */}
      {resumable.length > 0 && (
        <section className="card overflow-hidden animate-fade-in">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2.5">
            <span className="relative flex w-2 h-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
            </span>
            <h2 className="font-semibold text-content text-xs uppercase tracking-[0.15em]">Resume where you left off</h2>
            <span className="ml-auto text-[11px] text-subtle">{resumable.length} in progress</span>
          </div>
          <ul className="divide-y divide-border">
            {resumable.map((a) => {
              const total = a.totalQuestions || 0;
              const answered = a.answeredCount || 0;
              const pct = total ? Math.round((answered / total) * 100) : 0;
              return (
                <li key={a._id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                    <Clock size={14} className="text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-content truncate">{a.quizTitle || 'Quiz'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 w-24 bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] text-subtle">{answered}/{total}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/app/quiz/${a.quiz}`, { state: { from: 'quiz' } })}
                    className="btn-primary text-xs px-4 py-2 shrink-0"
                  >
                    Resume <ArrowRight size={13} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Course sections — the assessment view of each learning path */}
      {pathGroups.map((g) => {
        const allCleared = g.quizzes.length > 0 && g.passedCount === g.quizzes.length;
        const pct = g.quizzes.length ? Math.round((g.passedCount / g.quizzes.length) * 100) : 0;
        return (
          <section key={g.key} className="animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-3 px-0.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-lg shrink-0">
                  {g.icon || '📚'}
                </div>
                <h2 className="font-semibold text-content truncate">{g.title}</h2>
                {allCleared && (
                  <span className="badge bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-[10px] shrink-0">
                    <CheckCircle2 size={10} /> Cleared
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-1 w-16 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${allCleared ? 'bg-green-500' : 'bg-brand-600'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-subtle whitespace-nowrap">{g.passedCount}/{g.quizzes.length}</span>
                </div>
                {g.slug && (
                  <Link to={`/app/learn/${g.slug}`} className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline whitespace-nowrap">
                    View course →
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {g.quizzes.map((q, i) => {
                const locked = g.lockedIds.has(String(q._id));
                const prev = i > 0 ? g.quizzes[i - 1] : null;
                const prevTitle = prev ? stripCheckpointSuffix(prev.title) : null;
                return !q.mission ? (
                  <FinalBanner
                    key={q._id}
                    quiz={q}
                    index={i}
                    stat={attemptsByQuiz[String(q._id)]}
                    upNext={q._id === g.upNextId}
                    locked={locked}
                    remaining={g.checkpointsLeft}
                    onOpen={() => openQuiz(q)}
                  />
                ) : (
                  <AssessmentCard
                    key={q._id}
                    quiz={q}
                    index={i}
                    fallbackIndex={i}
                    stat={attemptsByQuiz[String(q._id)]}
                    upNext={q._id === g.upNextId}
                    locked={locked}
                    prevTitle={prevTitle}
                    onOpen={() => openQuiz(q)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {pathGroups.length === 0 && (
        <div className="card p-12 text-center">
          <Brain size={32} className="mx-auto text-subtle mb-3" />
          <p className="text-subtle">No quizzes available yet.</p>
        </div>
      )}

      {/* Wayfinding */}
      <div className="card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-content text-sm">Haven't learned this yet?</p>
          <p className="text-xs text-subtle mt-0.5">Follow a guided course — lessons first, checkpoint quizzes after.</p>
        </div>
        <Link to="/app/learn" className="btn-secondary text-sm">
          Go to Learn <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

/* A lesson checkpoint rendered as a clean card. */
function AssessmentCard({ quiz: q, fallbackIndex, index = 0, stat, upNext, locked = false, prevTitle, onOpen }) {
  const [shaking, setShaking] = useState(false);
  const attempted = Boolean(stat);
  const best = stat?.best ?? 0;
  const passed = best >= PASS_MARK;
  const lessonNo = q.mission?.order ?? fallbackIndex + 1;
  const title = stripCheckpointSuffix(q.title);
  const gate = prevTitle || 'the previous checkpoint';

  const poke = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    toast(`Locked — clear “${gate}” first`, { icon: '🔒' });
  };

  if (locked) {
    // Soft indigo "upcoming" state: colourful but quiet, clearly not clickable
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={poke}
        onKeyDown={(e) => e.key === 'Enter' && poke()}
        className={`card relative flex flex-col text-left cursor-not-allowed select-none border-dashed border-brand-500/30 bg-brand-500/[0.03] transition-colors hover:border-brand-500/50 animate-slide-up ${
          shaking ? 'animate-lock-shake' : ''
        }`}
        style={enterStyle(index)}
      >
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-dashed border-brand-500/30 flex items-center justify-center text-brand-500">
              <Lock size={15} />
            </div>
            <span className="badge bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/25 text-[10px] shrink-0">
              <Lock size={9} /> Locked
            </span>
          </div>
          <h3 className="mt-3 font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem] text-content">{title}</h3>
          <p className="text-xs text-subtle mt-0.5 pb-1">Lesson {lessonNo} checkpoint</p>
          <div className="mt-auto">
            <div className="mt-3 pt-3 border-t border-dashed border-brand-500/20 flex items-center justify-between gap-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-brand-600/80 dark:text-brand-400/80 min-w-0">
                <Lock size={10} className="shrink-0" />
                <span className="truncate">Clear “{gate}” to unlock</span>
              </span>
              <span className="flex items-center gap-2 text-subtle shrink-0">
                <span className="flex items-center gap-1"><Clock size={11} /> {q.estimatedMinutes}m</span>
                <span>{q.totalQuestions}q</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={`card relative flex flex-col text-left cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 animate-slide-up ${
        upNext
          ? 'border-brand-500/50 shadow-md shadow-brand-500/10 hover:shadow-lg'
          : 'hover:border-brand-500/40 hover:shadow-lg'
      }`}
      style={enterStyle(index)}
    >
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-xs ${
            passed
              ? 'bg-green-500/10 border-green-500/25 text-green-600 dark:text-green-400'
              : upNext
              ? 'bg-brand-600 border-brand-600 text-white'
              : 'bg-surface-2 border-border text-muted'
          }`}>
            {passed ? <CheckCircle2 size={16} /> : `L${lessonNo}`}
          </div>

          {passed ? (
            <span className="badge bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-[10px] shrink-0">
              {best}%
            </span>
          ) : upNext ? (
            <span className="badge bg-brand-600 text-white text-[10px] shrink-0">Up next</span>
          ) : attempted ? (
            <span className="badge bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] shrink-0">
              Best {best}%
            </span>
          ) : (
            <span className="badge bg-surface-2 text-subtle border border-border text-[10px] shrink-0">New</span>
          )}
        </div>

        <h3 className={`mt-3 font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem] transition-colors ${
          passed ? 'text-muted' : 'text-content group-hover:text-brand-600 dark:group-hover:text-brand-400'
        }`}>
          {title}
        </h3>
        <p className="text-xs text-subtle mt-0.5 pb-1">Lesson {lessonNo} checkpoint</p>

        <div className="mt-auto">
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-subtle min-w-0">
              <span className="flex items-center gap-1"><Clock size={11} /> {q.estimatedMinutes}m</span>
              <span>{q.totalQuestions}q</span>
              <span className={DIFF_TEXT[q.difficulty] || 'text-subtle'}>{q.difficulty}</span>
              {(q.rules?.negativeMarking || 0) > 0 && (
                <span className="text-amber-600/90 dark:text-amber-400/90">−{Math.round(q.rules.negativeMarking * 100)}% per wrong</span>
              )}
            </span>
            <span className={`flex items-center gap-1 font-medium shrink-0 transition-colors ${
              attempted ? 'text-muted group-hover:text-content' : 'text-brand-600 dark:text-brand-400'
            }`}>
              {attempted
                ? <><RotateCcw size={12} /> {passed ? 'Replay' : 'Retry'}</>
                : <><Play size={12} /> Start</>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* The path's final assessment — a full-width banner with a quiet amber accent. */
function FinalBanner({ quiz: q, index = 0, stat, upNext, locked = false, remaining = 0, onOpen }) {
  const [shaking, setShaking] = useState(false);
  const attempted = Boolean(stat);
  const best = stat?.best ?? 0;
  const passed = best >= PASS_MARK;
  const passPct = q.rules?.passingScore ?? PASS_MARK;
  const minutes = q.rules?.timeLimit ? Math.round(q.rules.timeLimit / 60) : q.estimatedMinutes;
  const level = q.level ?? 1;
  // Checkpoints all passed but a lower-level final is still unpassed
  const gatedByFinal = locked && remaining === 0;

  const poke = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    toast(
      gatedByFinal
        ? `Locked — pass the Level ${level - 1} final to unlock`
        : `Locked — clear ${remaining} more checkpoint${remaining === 1 ? '' : 's'} to unlock the final`,
      { icon: '🔒' }
    );
  };

  if (locked) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={poke}
        onKeyDown={(e) => e.key === 'Enter' && poke()}
        className={`sm:col-span-2 lg:col-span-3 xl:col-span-4 card relative overflow-hidden cursor-not-allowed select-none border-dashed border-amber-500/30 bg-amber-500/[0.03] transition-colors hover:border-amber-500/50 animate-slide-up ${
          shaking ? 'animate-lock-shake' : ''
        }`}
        style={enterStyle(index)}
      >
        <div className="flex items-center gap-3 sm:gap-4 p-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-dashed border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Lock size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Final Assessment · Level {level}</span>
              <span className="badge bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px]">
                <Lock size={9} /> Locked
              </span>
            </div>
            <h3 className="font-semibold text-sm text-content truncate mt-1">{q.title}</h3>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              {gatedByFinal
                ? `Pass the Level ${level - 1} final to unlock`
                : `Clear ${remaining} more checkpoint${remaining === 1 ? '' : 's'} to unlock`} · {q.totalQuestions} questions
              {(q.rules?.negativeMarking || 0) > 0 && ` · −${Math.round(q.rules.negativeMarking * 100)}% per wrong`}
            </p>
          </div>
          <Trophy size={20} className="text-amber-500/25 shrink-0 hidden sm:block" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={`sm:col-span-2 lg:col-span-3 xl:col-span-4 card relative overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-lg animate-slide-up ${
        upNext ? 'border-amber-500/50 shadow-md shadow-amber-500/10' : 'hover:border-amber-500/40'
      }`}
      style={enterStyle(index)}
    >
      <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-amber-500" />
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3 py-4 pl-5 pr-4">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
          passed
            ? 'bg-green-500/10 border-green-500/25 text-green-600 dark:text-green-400'
            : upNext
            ? 'bg-amber-500 border-amber-500 text-white'
            : 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
        }`}>
          {passed ? <CheckCircle2 size={18} /> : <Trophy size={17} />}
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
              Final Assessment · Level {level}
            </span>
            {upNext && !passed && (
              <span className="badge bg-amber-500 text-white text-[10px]">Up next</span>
            )}
            {passed && (
              <span className="badge bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-[10px]">Passed · {best}%</span>
            )}
            {attempted && !passed && (
              <span className="badge bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px]">Best {best}%</span>
            )}
          </div>
          <h3 className="font-semibold text-content truncate mt-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {q.title}
          </h3>
          <p className="text-xs text-subtle mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>{q.totalQuestions} questions</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {minutes}m</span>
            <span>{passPct}% to pass</span>
            {(q.rules?.maxAttempts || 0) > 0 && <span>{q.rules.maxAttempts} attempts max</span>}
            {(q.rules?.negativeMarking || 0) > 0 && (
              <span className="text-amber-600/90 dark:text-amber-400/90">−{Math.round(q.rules.negativeMarking * 100)}% per wrong · skip = 0</span>
            )}
          </p>
        </div>

        <span className={`btn text-xs px-4 py-2 shrink-0 w-full sm:w-auto justify-center ${
          passed || attempted
            ? 'bg-card hover:bg-card-hover text-content border border-border-strong'
            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25'
        }`}>
          {passed
            ? <><RotateCcw size={13} /> Retake</>
            : attempted
            ? <><RotateCcw size={13} /> Retry final</>
            : <><Trophy size={13} /> Take the final</>}
        </span>
      </div>
    </div>
  );
}
