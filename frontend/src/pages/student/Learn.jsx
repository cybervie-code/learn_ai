import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import {
  Clock, ArrowRight, ArrowLeft, Zap,
  CheckCircle2, Target, Layers, Play, BookOpen, Trophy, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DIFFICULTIES = [
  { value: '', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

/** Ordered lessons for a path, sorted by their stored order. */
function lessonsOf(path) {
  return (path?.missions || [])
    .filter((m) => m.mission)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function pathStats(path) {
  const lessons = lessonsOf(path);
  const total = path.progress?.totalMissions ?? lessons.length;
  const done = path.progress?.completedMissions ?? lessons.filter((m) => m.completed).length;
  const next = lessons.find((m) => !m.completed) || null;
  const pct = total ? Math.round((done / total) * 100) : 0;
  // Paths can have several tiered finals; fall back to the legacy single key
  const finals = path.finalAssessments?.length
    ? path.finalAssessments
    : path.finalAssessment ? [path.finalAssessment] : [];
  const nextFinal = finals.find((f) => !f.passed) || null;
  const lessonsDone = total > 0 && done >= total;
  return { lessons, total, done, next, pct, finals, nextFinal, lessonsDone };
}

export default function Learn() {
  const { slug } = useParams();
  const [paths, setPaths] = useState([]);
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    setLoading(true);
    const req = slug ? api.getPath(slug) : api.listPaths();
    req.then((res) => {
      if (slug) setPath(res.data.data);
      else setPaths(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const filtered = useMemo(
    () => paths.filter((p) => !difficulty || p.difficulty === difficulty),
    [paths, difficulty]
  );

  // The journey continues on the first path with work in progress — including
  // one whose lessons are done but whose final exam is still unpassed.
  const resumePath = useMemo(() => {
    const inProgress = paths.find((p) => {
      const s = pathStats(p);
      return (s.done > 0 && s.next) || (s.lessonsDone && s.nextFinal);
    });
    if (inProgress) return inProgress;
    const fresh = paths.find((p) => p.isFeatured && pathStats(p).next)
      || paths.find((p) => pathStats(p).next);
    return fresh || null;
  }, [paths]);

  if (loading) return <div className="text-subtle p-8">Loading...</div>;

  /* ================= Path detail ================= */
  if (slug && path) {
    const { lessons, total, done, next, pct, finals, nextFinal } = pathStats(path);
    const nextIdx = lessons.findIndex((m) => !m.completed);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/app/learn" className="text-sm text-muted hover:text-content flex items-center gap-1 w-fit">
          <ArrowLeft size={14} /> Back to your journey
        </Link>

        {/* Path header */}
        <div className="card overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-brand-600 via-cyber-500 to-brand-600" />
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center text-3xl sm:text-4xl shrink-0">
                {path.icon || '🧠'}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-content">{path.title}</h1>
                <p className="text-muted mt-1.5 text-sm">{path.description}</p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs text-subtle">
                  <span className="flex items-center gap-1.5"><Clock size={13} /> {path.estimatedHours}h total</span>
                  <span className={`badge-${path.difficulty}`}>{path.difficulty}</span>
                  <span className="flex items-center gap-1.5"><Layers size={13} /> {total} lessons</span>
                </div>
              </div>
            </div>

            {total > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-subtle font-medium">{done} of {total} lessons completed</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{pct}%</span>
                </div>
                <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-600 to-cyber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lesson track */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-content text-sm uppercase tracking-wider">Course track</h2>
            {next ? (
              <span className="text-xs text-subtle">Next up: Lesson {nextIdx + 1}</span>
            ) : nextFinal ? (
              <span className="text-xs text-subtle">Next up: Level {nextFinal.level ?? 1} Final</span>
            ) : null}
          </div>
          {lessons.length === 0 && finals.length === 0 ? (
            <div className="p-8 text-center text-subtle text-sm">No lessons in this path yet.</div>
          ) : (
            <LessonTrack lessons={lessons} finals={finals} pathSlug={path.slug} />
          )}
        </div>
      </div>
    );
  }

  /* ================= Journey (catalog) ================= */
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-1">Learn</div>
        <h1 className="text-2xl font-bold text-content">Your learning journey</h1>
        <p className="text-muted mt-1 text-sm">Guided courses — read each lesson, then pass its checkpoint quiz to earn XP.</p>
      </div>

      {/* Resume hero */}
      {resumePath && <ResumeHero path={resumePath} />}

      {/* Difficulty filter */}
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

      {/* Paths as curriculum tracks */}
      {filtered.map((p) => (
        <PathSection key={p._id} path={p} />
      ))}

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <BookOpen size={32} className="mx-auto text-subtle mb-3" />
          <p className="text-subtle">{paths.length === 0 ? 'No learning paths published yet.' : 'No paths at this level.'}</p>
        </div>
      )}

      {/* Wayfinding */}
      <div className="card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-content text-sm">Already know the material?</p>
          <p className="text-xs text-subtle mt-0.5">Skip the lessons and test yourself in scored quizzes.</p>
        </div>
        <Link to="/app/quiz" className="btn-secondary text-sm">
          Go to Quizzes <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

/* ================= Components ================= */

function ResumeHero({ path }) {
  const { total, done, next, pct, nextFinal, lessonsDone } = pathStats(path);
  const started = done > 0;
  const examReady = lessonsDone && nextFinal;

  return (
    <div className="card overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-brand-600 via-cyber-500 to-brand-600" />
      <div className="p-6 sm:p-7">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-3">
          {examReady ? 'One step left' : started ? 'Continue where you left off' : 'Start here'}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center text-3xl shrink-0">
            {path.icon || '🧠'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-content">{path.title}</h2>
            {next ? (
              <p className="text-sm text-muted mt-0.5 truncate">
                Next lesson: <span className="text-content font-medium">{next.mission.title}</span>
              </p>
            ) : examReady ? (
              <p className="text-sm text-muted mt-0.5">
                All lessons complete — finish with the <span className="text-content font-medium">{nextFinal.totalQuestions}-question Level {nextFinal.level ?? 1} final</span>
              </p>
            ) : null}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-subtle">{done} of {total} lessons done</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">{pct}%</span>
              </div>
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-600 to-cyber-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
          {next ? (
            <Link to={`/app/learn/mission/${next.mission.slug}`} className="btn-primary shrink-0 justify-center sm:w-44">
              <Play size={15} /> {started ? 'Resume lesson' : 'Start lesson 1'}
            </Link>
          ) : examReady ? (
            <Link
              to={`/app/quiz/${nextFinal._id}`}
              state={{ from: 'path', pathSlug: path.slug }}
              className="btn-primary shrink-0 justify-center sm:w-44"
            >
              <Trophy size={15} /> Take Level {nextFinal.level ?? 1} final
            </Link>
          ) : (
            <Link to={`/app/learn/${path.slug}`} className="btn-secondary shrink-0 justify-center sm:w-44">
              Review path
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function PathSection({ path }) {
  const { lessons, total, done, pct, finals, nextFinal, lessonsDone } = pathStats(path);
  const complete = lessonsDone && !nextFinal;
  const examPending = lessonsDone && Boolean(nextFinal);

  return (
    <section className="card overflow-hidden">
      {/* Path header */}
      <Link to={`/app/learn/${path.slug}`} className="flex items-start gap-4 p-5 pb-4 group">
        <div className="w-11 h-11 rounded-xl bg-surface-2 border border-border-strong flex items-center justify-center text-2xl shrink-0">
          {path.icon || '🧠'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-content group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {path.title}
            </h3>
            <span className={`badge-${path.difficulty}`}>{path.difficulty}</span>
            {complete && (
              <span className="badge bg-green-500/15 text-green-600 dark:text-green-400 text-xs">
                <CheckCircle2 size={11} /> Completed
              </span>
            )}
            {examPending && (
              <span className="badge bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 text-xs">
                <Trophy size={11} /> Level {nextFinal.level ?? 1} final left
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-subtle">
            <span className="flex items-center gap-1"><Clock size={11} /> {path.estimatedHours}h</span>
            <span className="flex items-center gap-1"><Layers size={11} /> {total} lessons</span>
            <span>{done} done · {pct}%</span>
          </div>
        </div>
        <div className="w-24 shrink-0 hidden sm:block pt-1">
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${complete ? 'bg-green-500' : 'bg-gradient-to-r from-brand-600 to-cyber-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Link>

      {/* Lesson steps + final assessment nodes */}
      {(lessons.length > 0 || finals.length > 0) && (
        <div className="px-5 pb-5">
          <LessonTrack lessons={lessons} finals={finals} pathSlug={path.slug} />
        </div>
      )}
    </section>
  );
}

function LessonTrack({ lessons, finals = [], pathSlug = null }) {
  const [shaking, setShaking] = useState(null);
  const nextIdx = lessons.findIndex((m) => !m.completed);
  const lessonsDone = lessons.length > 0 && nextIdx === -1;
  const nextFinal = finals.find((f) => !f.passed) || null;

  // Locked rows give playful feedback instead of navigating
  const pokeLocked = (key, msg) => {
    setShaking(key);
    toast(msg, { icon: '🔒' });
    setTimeout(() => setShaking((s) => (s === key ? null : s)), 500);
  };

  return (
    <ol>
      {lessons.map((m, i) => {
        const lesson = m.mission;
        const completed = m.completed;
        const isNext = !completed && i === nextIdx;
        // Server-provided flag, with a local fallback for older payloads
        const locked = m.locked ?? (nextIdx !== -1 && i > nextIdx);
        const last = i === lessons.length - 1 && finals.length === 0;
        const rowKey = m._id || lesson._id || i;
        return (
          <li key={rowKey} className="relative">
            {/* Connecting rail — dashed ahead of the current position */}
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute left-[25px] top-10 -bottom-1 border-l-2 ${
                  completed ? 'border-green-500/40 border-solid' : locked ? 'border-border border-dashed' : 'border-border border-solid'
                }`}
              />
            )}
            {locked ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => pokeLocked(rowKey, `Locked — pass Lesson ${nextIdx + 1}'s checkpoint first`)}
                onKeyDown={(e) => e.key === 'Enter' && pokeLocked(rowKey, `Locked — pass Lesson ${nextIdx + 1}'s checkpoint first`)}
                className={`relative flex items-center gap-4 px-2 py-3 rounded-lg cursor-not-allowed select-none ${
                  shaking === rowKey ? 'animate-lock-shake' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border z-10 bg-surface-2 border-border-strong text-subtle">
                  <Lock size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate text-subtle">{lesson.title}</h4>
                    <span className="badge bg-surface-2 text-subtle border border-border-strong text-[10px] shrink-0">
                      <Lock size={9} /> Locked
                    </span>
                  </div>
                  <p className="text-xs text-subtle mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>Lesson {i + 1}</span>
                    <span>unlocks after Lesson {nextIdx + 1}</span>
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-subtle/60 shrink-0">
                  <span className="flex items-center gap-1"><Clock size={11} /> {lesson.estimatedMinutes}m</span>
                  <span className="flex items-center gap-1"><Zap size={11} /> {lesson.xpReward} XP</span>
                </div>
              </div>
            ) : (
              <Link
                to={`/app/learn/mission/${lesson.slug}`}
                className={`relative flex items-center gap-4 px-2 py-3 rounded-lg transition-colors group ${
                  isNext ? 'bg-brand-500/5' : 'hover:bg-surface-2/40'
                }`}
              >
                {/* Step node — the next lesson pulses to say "you are here" */}
                <div className="relative w-9 h-9 shrink-0">
                  {isNext && (
                    <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-500 animate-ping opacity-40" />
                  )}
                  <div className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border z-10 ${
                    completed
                      ? 'bg-green-500/15 border-green-500/30 text-green-600 dark:text-green-400'
                      : isNext
                      ? 'bg-brand-600 border-brand-600 text-white animate-pulse-glow'
                      : 'bg-surface-2 border-border-strong text-subtle'
                  }`}>
                    {completed ? <CheckCircle2 size={17} className="animate-unlock-pop" /> : i + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium text-sm truncate transition-colors ${
                      completed
                        ? 'text-muted'
                        : 'text-content group-hover:text-brand-600 dark:group-hover:text-brand-400'
                    }`}>
                      {lesson.title}
                    </h4>
                    {isNext && (
                      <span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400 text-[10px] shrink-0">Up next</span>
                    )}
                  </div>
                  <p className="text-xs text-subtle mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>Lesson {i + 1}</span>
                    {lesson.quiz && (
                      <span className="flex items-center gap-1"><Target size={10} /> + checkpoint quiz</span>
                    )}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-xs text-subtle shrink-0">
                  <span className="flex items-center gap-1"><Clock size={11} /> {lesson.estimatedMinutes}m</span>
                  <span className="flex items-center gap-1"><Zap size={11} /> {lesson.xpReward} XP</span>
                </div>
              </Link>
            )}
          </li>
        );
      })}

      {/* Final assessments — the journey's destination, tiered by level */}
      {finals.map((f, fi) => {
        const level = f.level ?? 1;
        // Server sends locked; fall back to local sequencing for old payloads
        const fLocked = f.locked ?? (!lessonsDone || finals.slice(0, fi).some((x) => !x.passed));
        const fIsNext = lessonsDone && nextFinal && String(f._id) === String(nextFinal._id);
        const rowKey = `final-${f._id || fi}`;
        const lockMsg = !lessonsDone
          ? 'Locked — pass every lesson checkpoint to unlock the final'
          : `Locked — pass the Level ${level - 1} final to unlock`;
        const lastItem = fi === finals.length - 1;
        return (
          <li key={rowKey} className="relative">
            {!lastItem && (
              <span
                aria-hidden="true"
                className={`absolute left-[25px] top-10 -bottom-1 border-l-2 ${
                  f.passed ? 'border-green-500/40 border-solid' : fLocked ? 'border-border border-dashed' : 'border-border border-solid'
                }`}
              />
            )}
            {fLocked && !f.passed ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => pokeLocked(rowKey, lockMsg)}
                onKeyDown={(e) => e.key === 'Enter' && pokeLocked(rowKey, lockMsg)}
                className={`relative flex items-center gap-4 px-2 py-3 rounded-lg cursor-not-allowed select-none ${
                  shaking === rowKey ? 'animate-lock-shake' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border z-10 bg-surface-2 border-border-strong text-subtle">
                  <Lock size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate text-subtle">{f.title}</h4>
                    <span className="badge bg-surface-2 text-subtle border border-border-strong text-[10px] shrink-0">
                      <Lock size={9} /> Locked
                    </span>
                  </div>
                  <p className="text-xs text-subtle mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><Trophy size={10} /> Final · Level {level}</span>
                    <span>{f.totalQuestions} questions</span>
                    <span>
                      {!lessonsDone ? 'unlocks when all checkpoints pass' : `unlocks after the Level ${level - 1} final`}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <Link
                to={`/app/quiz/${f._id}`}
                state={{ from: 'path', pathSlug }}
                className={`relative flex items-center gap-4 px-2 py-3 rounded-lg transition-colors group ${
                  fIsNext ? 'bg-yellow-500/5' : 'hover:bg-surface-2/40'
                }`}
              >
                <div className="relative w-9 h-9 shrink-0">
                  {fIsNext && (
                    <span aria-hidden="true" className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-40" />
                  )}
                  <div className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border z-10 ${
                    f.passed
                      ? 'bg-green-500/15 border-green-500/30 text-green-600 dark:text-green-400'
                      : fIsNext
                      ? 'bg-yellow-500 border-yellow-500 text-white animate-pulse-glow'
                      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {f.passed ? <CheckCircle2 size={17} className="animate-unlock-pop" /> : <Trophy size={16} />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium text-sm truncate transition-colors ${
                      f.passed
                        ? 'text-muted'
                        : 'text-content group-hover:text-yellow-600 dark:group-hover:text-yellow-400'
                    }`}>
                      {f.title}
                    </h4>
                    {fIsNext && (
                      <span className="badge bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 text-[10px] shrink-0">Up next</span>
                    )}
                    {f.passed && (
                      <span className="badge bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] shrink-0">Passed</span>
                    )}
                  </div>
                  <p className="text-xs text-subtle mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><Trophy size={10} /> Final · Level {level}</span>
                    <span>{f.totalQuestions} questions</span>
                    {f.rules?.timeLimit > 0 && <span>{Math.round(f.rules.timeLimit / 60)} min</span>}
                    <span>{f.rules?.passingScore ?? 60}% to pass</span>
                  </p>
                </div>
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
