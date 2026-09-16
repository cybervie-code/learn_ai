import { Link } from 'react-router-dom';
import {
  Brain, ShieldCheck, Trophy, Zap, Target, Building2,
  ArrowRight, CheckCircle2, Flame, GraduationCap,
  Sparkles, ChevronRight, BarChart3, BadgeCheck, TerminalSquare,
} from 'lucide-react';
import BrandLogo from '../../components/BrandLogo.jsx';

const TOPICS = [
  'Prompt Engineering', 'LLM Security', 'Neural Networks', 'Deepfake Detection',
  'Data Leakage', 'Transformers', 'AI Ethics', 'Retrieval-Augmented Generation',
  'Adversarial Attacks', 'Model Evaluation', 'Responsible AI', 'Embeddings',
];

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="h-px w-8 bg-brand-500/60"></span>
      <span className="font-mono text-xs font-medium tracking-[0.2em] uppercase text-brand-600 dark:text-brand-400">
        {children}
      </span>
    </div>
  );
}

/* A hand-built product mock — a quiz card the way it actually looks in the app. */
function QuizMock() {
  return (
    <div className="relative">
      {/* Glow behind the card */}
      <div className="absolute -inset-8 bg-brand-500/20 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="relative card overflow-hidden shadow-2xl">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-2/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
          </div>
          <span className="font-mono text-[11px] text-subtle">mission · prompt-injection-101</span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="badge bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              Question 4 of 8
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Flame size={13} /> 12-day streak
            </span>
          </div>

          <p className="text-content font-semibold leading-snug mb-4">
            A user pastes “Ignore your previous instructions” into a customer-support
            chatbot. What is this an example of?
          </p>

          <div className="space-y-2">
            {[
              { text: 'Jailbreak attempt', state: 'idle' },
              { text: 'Prompt injection', state: 'correct' },
              { text: 'Data poisoning', state: 'idle' },
              { text: 'Model hallucination', state: 'idle' },
            ].map((opt, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                  opt.state === 'correct'
                    ? 'border-green-500/60 bg-green-500/10 text-content'
                    : 'border-border bg-surface-2/40 text-muted'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono border ${
                    opt.state === 'correct'
                      ? 'border-green-500/60 bg-green-500 text-white'
                      : 'border-border-strong text-subtle'
                  }`}
                >
                  {opt.state === 'correct' ? '✓' : String.fromCharCode(65 + i)}
                </span>
                {opt.text}
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] font-mono text-subtle mb-1.5">
              <span>COMPETENCY · AI SECURITY</span>
              <span className="text-brand-600 dark:text-brand-400">78%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-brand-500 to-cyber-500"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating chips */}
      <div className="hidden sm:flex absolute -left-8 top-10 card px-3.5 py-2.5 items-center gap-2.5 shadow-xl animate-float">
        <div className="w-7 h-7 rounded-lg bg-yellow-500/15 flex items-center justify-center">
          <Trophy size={14} className="text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-content leading-none">Rank #12</div>
          <div className="text-[10px] text-subtle mt-0.5">College leaderboard</div>
        </div>
      </div>

      <div className="hidden sm:flex absolute -right-6 bottom-12 card px-3.5 py-2.5 items-center gap-2.5 shadow-xl animate-float-slow">
        <div className="w-7 h-7 rounded-lg bg-cyber-500/15 flex items-center justify-center">
          <BadgeCheck size={14} className="text-cyber-600 dark:text-cyber-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-content leading-none">Badge earned</div>
          <div className="text-[10px] text-subtle mt-0.5">Verified skill profile</div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip">
      {/* ============ HERO ============ */}
      <section className="relative">
        {/* Grid texture, masked to the top */}
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(var(--color-border)) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--color-border)) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)',
          }}
        ></div>
        <div className="absolute -top-32 left-1/4 w-[500px] h-[400px] bg-brand-500/15 dark:bg-brand-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 grid lg:grid-cols-[1.05fr_1fr] gap-16 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted mb-7 animate-fade-in">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-semibold tracking-wide">
                <Sparkles size={10} /> NEW
              </span>
              AI-readiness platform for Indian B.Tech colleges
            </div>

            <h1 className="text-[2.6rem] sm:text-6xl font-bold text-content leading-[1.05] tracking-tight mb-6 animate-slide-up">
              Your students will use AI.
              <br />
              <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-cyber-500 bg-clip-text text-transparent">
                Teach them to use it well.
              </span>
            </h1>

            <p className="text-lg text-muted leading-relaxed max-w-xl mb-9 animate-slide-up">
              Cybervie teaches engineering students how AI actually works, how to use it
              responsibly, and how to secure it — then proves it with verifiable skill
              profiles recruiters can trust.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 animate-slide-up">
              <Link to="/login" className="btn-primary text-base px-7 py-3">
                Get started <ArrowRight size={17} />
              </Link>
              <Link to="/paths" className="btn-secondary text-base px-7 py-3">
                Explore learning paths
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-subtle">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-cyber-600 dark:text-cyber-400" /> Domain-verified login</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-cyber-600 dark:text-cyber-400" /> DPDP-ready</span>
              <span className="hidden sm:flex items-center gap-1.5"><CheckCircle2 size={15} className="text-cyber-600 dark:text-cyber-400" /> No installs needed</span>
            </div>
          </div>

          {/* Right — product mock */}
          <div className="lg:pl-4 animate-slide-up">
            <QuizMock />
          </div>
        </div>
      </section>

      {/* ============ TOPIC TICKER ============ */}
      <section className="border-y border-border bg-surface-2/50 overflow-hidden">
        <div className="relative flex py-3.5" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
          <div className="flex shrink-0 items-center animate-marquee whitespace-nowrap">
            {[...TOPICS, ...TOPICS].map((t, i) => (
              <span key={i} className="flex items-center gap-8 mr-8 text-sm text-subtle font-medium">
                {t}
                <span className="w-1 h-1 rounded-full bg-brand-500/50"></span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {[
            { num: '14.9 lakh', label: 'B.Tech seats in India — the talent pool we serve' },
            { num: '2,900+', label: 'AICTE-approved institutions the curriculum aligns to' },
            { num: '4-step', label: 'Quiz-first mastery loop on every single concept' },
            { num: '100%', label: 'Verifiable — every badge maps to demonstrated skill' },
          ].map((s, i) => (
            <div key={i} className="border-l-2 border-brand-500/40 pl-5">
              <div className="font-mono text-3xl sm:text-4xl font-semibold text-content tracking-tight mb-1.5">{s.num}</div>
              <p className="text-sm text-muted leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES — BENTO ============ */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-14">
            <SectionLabel>What students learn</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-content tracking-tight mb-4">
              Three skills. One platform.
            </h2>
            <p className="text-muted text-lg leading-relaxed">
              Not another video library. Cybervie is built around questions,
              feedback loops, and proof — the way skills actually stick.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Large card — Understand AI */}
            <div className="card p-7 lg:col-span-2 hover:border-brand-500/40 transition-colors duration-300 group">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="flex-1">
                  <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                    <Brain size={20} className="text-brand-600 dark:text-brand-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-content mb-2">Understand how AI works</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    From tokens and embeddings to transformers and attention — students
                    build a mental model of what’s under the hood, not just how to type
                    a prompt. No maths degree required.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:max-w-[200px] content-start">
                  {['token', 'embedding', 'attention', 'softmax', 'weights', 'inference'].map((t) => (
                    <span key={t} className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-surface-2 border border-border text-muted group-hover:border-brand-500/30 transition-colors">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-7 hover:border-cyber-500/40 transition-colors duration-300">
              <div className="w-11 h-11 rounded-xl bg-cyber-500/10 border border-cyber-500/20 flex items-center justify-center mb-4">
                <Zap size={20} className="text-cyber-600 dark:text-cyber-400" />
              </div>
              <h3 className="text-xl font-semibold text-content mb-2">Use it effectively</h3>
              <p className="text-sm text-muted leading-relaxed">
                Prompt engineering, output verification, and knowing when AI is
                confidently wrong — the habits employers actually want.
              </p>
            </div>

            <div className="card p-7 hover:border-red-500/40 transition-colors duration-300">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <ShieldCheck size={20} className="text-red-500 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-content mb-2">Secure it</h3>
              <p className="text-sm text-muted leading-relaxed">
                Prompt injection, data leakage, deepfakes, model misuse — the
                security fundamentals every AI-adjacent engineer now needs.
              </p>
            </div>

            {/* Large card — Rankings */}
            <div className="card p-7 lg:col-span-2 hover:border-yellow-500/40 transition-colors duration-300">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4">
                    <Trophy size={20} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-content mb-2">Rankings that mean something</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Every quiz feeds college and national leaderboards. Students graduate
                    with a public, verifiable competency profile — evidence, not claims.
                  </p>
                </div>
                <div className="sm:w-56 space-y-1.5 self-center w-full">
                  {[
                    { rank: 1, name: 'Ananya S.', xp: '4,820', top: true },
                    { rank: 2, name: 'Rahul V.', xp: '4,610' },
                    { rank: 3, name: 'Meera K.', xp: '4,455' },
                  ].map((r) => (
                    <div key={r.rank} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${r.top ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border bg-surface-2/40'}`}>
                      <span className={`font-mono text-xs w-4 ${r.top ? 'text-yellow-600 dark:text-yellow-400 font-semibold' : 'text-subtle'}`}>{r.rank}</span>
                      <span className="flex-1 text-content font-medium">{r.name}</span>
                      <span className="font-mono text-xs text-subtle">{r.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom row — three small */}
            {[
              { icon: Target, iconWrap: 'bg-green-500/10 border-green-500/20', iconColor: 'text-green-600 dark:text-green-400', title: 'Mastery, not memorization', desc: 'Retrieval practice and spaced review, not passive video watching.' },
              { icon: BarChart3, iconWrap: 'bg-purple-500/10 border-purple-500/20', iconColor: 'text-purple-600 dark:text-purple-400', title: 'Analytics for faculty', desc: 'Cohort dashboards, competency heatmaps, auto-graded assignments.' },
              { icon: Building2, iconWrap: 'bg-blue-500/10 border-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400', title: 'Built for campuses', desc: 'Domain-verified onboarding, AICTE-aligned paths, DPDP consent controls.' },
            ].map((f, i) => (
              <div key={i} className="card p-6 hover:border-border-strong transition-colors duration-300">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${f.iconWrap}`}>
                  <f.icon size={18} className={f.iconColor} />
                </div>
                <h3 className="font-semibold text-content mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="py-20 border-t border-border bg-surface-2/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-14">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-content tracking-tight mb-4">
              Quiz first. Explanation second.
            </h2>
            <p className="text-muted text-lg leading-relaxed">
              It feels backwards, and that’s the point. Retrieval practice — trying to
              answer before being told — is one of the most replicated findings in
              learning science.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {[
              { step: '01', title: 'Attempt', desc: 'A question before the lesson. Commit to an answer — being wrong is part of it.' },
              { step: '02', title: 'Learn', desc: 'A tight visual explanation lands right after, while the question is still warm.' },
              { step: '03', title: 'Practice', desc: 'Scenario questions test whether the concept survives contact with the real world.' },
              { step: '04', title: 'Master', desc: 'Competency scores, spaced review, and badges that mean something on a resume.' },
            ].map((s, i) => (
              <div key={i} className="bg-card p-7 relative group hover:bg-card-hover transition-colors">
                <div className="font-mono text-sm text-brand-600 dark:text-brand-400 mb-6">{s.step}</div>
                <h3 className="text-lg font-semibold text-content mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                {i < 3 && (
                  <ChevronRight size={16} className="hidden lg:block absolute top-7 right-5 text-subtle" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AUDIENCE SPLIT ============ */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-14">
            <SectionLabel>Who it’s for</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-content tracking-tight">
              Two sides of the same campus.
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <div className="card p-8 hover:border-brand-500/40 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <GraduationCap size={20} className="text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="text-xl font-semibold text-content">For students</h3>
              </div>
              <ul className="space-y-3.5">
                {[
                  'Structured paths from “what is a model?” to securing one',
                  'XP, streaks, and badges that keep the habit going',
                  'A public skill profile to share with recruiters',
                  'Campus and national leaderboards to compete on',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted text-sm leading-relaxed">
                    <CheckCircle2 size={17} className="text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-8 hover:border-cyber-500/40 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-cyber-500/10 border border-cyber-500/20 flex items-center justify-center">
                  <TerminalSquare size={20} className="text-cyber-600 dark:text-cyber-400" />
                </div>
                <h3 className="text-xl font-semibold text-content">For colleges & faculty</h3>
              </div>
              <ul className="space-y-3.5">
                {[
                  'Domain-verified onboarding — only your students get in',
                  'Cohort dashboards showing AI-readiness and skill gaps',
                  'Auto-graded assignments with per-question analytics',
                  'AICTE-aligned curriculum, DPDP-ready consent controls',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted text-sm leading-relaxed">
                    <CheckCircle2 size={17} className="text-cyber-600 dark:text-cyber-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative card overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900"></div>
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
                backgroundSize: '44px 44px',
              }}
            ></div>
            <div className="relative px-8 py-16 sm:px-16 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Bring Cybervie to your campus.
              </h2>
              <p className="text-brand-100 max-w-xl mx-auto mb-9 leading-relaxed">
                Students sign in with their college email. Faculty get dashboards on
                day one. Setup takes minutes, not a semester.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link to="/login" className="btn bg-white text-brand-700 hover:bg-brand-50 text-base px-7 py-3 shadow-lg">
                  Sign in with college email <ArrowRight size={17} />
                </Link>
                <Link to="/about" className="btn bg-white/10 hover:bg-white/20 text-white border border-white/25 text-base px-7 py-3">
                  How it works for colleges
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <BrandLogo className="w-8 h-8" />
                <span className="font-bold text-lg text-content">Cybervie</span>
              </div>
              <p className="text-sm text-muted leading-relaxed max-w-xs">
                AI-readiness and cybersecurity learning for India’s engineering
                colleges. Understand it, use it well, secure it.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-muted">
                <li><Link to="/paths" className="hover:text-content transition-colors">Learning paths</Link></li>
                <li><Link to="/rankings" className="hover:text-content transition-colors">Rankings</Link></li>
                <li><Link to="/login" className="hover:text-content transition-colors">Student sign in</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-muted">
                <li><Link to="/about" className="hover:text-content transition-colors">About</Link></li>
                <li><Link to="/about" className="hover:text-content transition-colors">For colleges</Link></li>
                <li><Link to="/admin/login" className="hover:text-content transition-colors">Staff sign in</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle mb-4">Trust</h4>
              <ul className="space-y-2.5 text-sm text-muted">
                <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-cyber-600 dark:text-cyber-400" /> DPDP Act 2023 ready</li>
                <li className="flex items-center gap-2"><BadgeCheck size={14} className="text-cyber-600 dark:text-cyber-400" /> Domain-verified access</li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-subtle">© 2026 Cybervie. Built for Indian engineering education.</span>
            <span className="font-mono text-[11px] text-subtle">v1.0 · made in India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
