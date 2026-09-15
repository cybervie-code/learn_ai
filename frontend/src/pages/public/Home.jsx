import { Link } from 'react-router-dom';
import {
  Brain, ShieldCheck, Trophy, BookOpen, Zap, Target, Users, Building2,
  CheckCircle2, ArrowRight, Sparkles, Lock, BarChart3,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/40 via-gray-950 to-gray-950"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[120px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-sm font-medium mb-6 animate-fade-in">
            <Sparkles size={14} />
            Built for Indian B.Tech Colleges
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-content leading-tight mb-6 animate-slide-up">
            Understand AI. Use it intelligently.
            <br />
            <span className="bg-gradient-to-r from-brand-400 via-cyber-400 to-brand-500 bg-clip-text text-transparent">
              Secure it responsibly.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 animate-slide-up">
            An AI readiness and cybersecurity learning platform that helps engineering students
            understand AI, use it responsibly, demonstrate practical skills, and become career-ready.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link to="/login" className="btn-primary text-base px-8 py-3">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/paths" className="btn-secondary text-base px-8 py-3">
              <BookOpen size={18} /> Explore Paths
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Brain, label: 'AI Literacy', color: 'text-brand-600 dark:text-brand-400' },
              { icon: ShieldCheck, label: 'AI Security', color: 'text-cyber-600 dark:text-cyber-400' },
              { icon: Trophy, label: 'Rankings', color: 'text-yellow-600 dark:text-yellow-400' },
              { icon: Target, label: 'Mastery Learning', color: 'text-green-600 dark:text-green-400' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
                  <item.icon size={22} className={item.color} />
                </div>
                <span className="text-sm text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-content mb-4">Why Cybervie?</h2>
            <p className="text-muted max-w-2xl mx-auto">
              We combine quiz-first mastery learning, real-world AI scenarios, and cybersecurity
              to prepare students for the AI era.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'Understand AI',
                desc: 'Learn how AI, ML, and generative AI work internally. From tokens to transformers, build real understanding.',
                color: 'from-brand-500 to-brand-700',
              },
              {
                icon: Zap,
                title: 'Use AI Effectively',
                desc: 'Master prompt engineering, verify AI output, and use AI tools responsibly for learning and work.',
                color: 'from-cyber-500 to-cyber-700',
              },
              {
                icon: ShieldCheck,
                title: 'Secure AI',
                desc: 'Learn AI security fundamentals: prompt injection, data leakage, deepfakes, and secure AI application design.',
                color: 'from-red-500 to-red-700',
              },
              {
                icon: Trophy,
                title: 'Compete & Rank',
                desc: 'Participate in college and national rankings. Build a public, verifiable skill profile for recruiters.',
                color: 'from-yellow-500 to-orange-600',
              },
              {
                icon: BarChart3,
                title: 'Measurable Outcomes',
                desc: 'Colleges get dashboards showing student AI readiness, skill gaps, and placement preparation.',
                color: 'from-green-500 to-green-700',
              },
              {
                icon: Building2,
                title: 'College-Ready',
                desc: 'Domain-verified login, faculty tools, auto-graded assignments, and AICTE-aligned curriculum.',
                color: 'from-purple-500 to-purple-700',
              },
            ].map((f, i) => (
              <div key={i} className="card p-6 hover:border-brand-600/50 transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} className="text-content" />
                </div>
                <h3 className="text-lg font-semibold text-content mb-2">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-content mb-4">How Learning Works</h2>
            <p className="text-muted">Quiz-first mastery learning inspired by the science of retrieval practice.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Attempt', desc: 'Start with a question before the explanation. Commit to an answer.' },
              { step: '02', title: 'Learn', desc: 'Get a visual micro-explanation and immediate corrective feedback.' },
              { step: '03', title: 'Practice', desc: 'Answer scenario-based questions that test real understanding.' },
              { step: '04', title: 'Master', desc: 'Build competency scores and earn verified badges. Spaced review keeps it fresh.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="text-4xl font-bold text-brand-600/30 mb-2">{s.step}</div>
                <h3 className="text-lg font-semibold text-content mb-2">{s.title}</h3>
                <p className="text-sm text-muted">{s.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-6 -right-3 text-subtle">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="card p-12 bg-gradient-to-br from-brand-950/50 to-gray-900">
            <h2 className="text-3xl font-bold text-content mb-4">Ready to build AI readiness?</h2>
            <p className="text-muted mb-8 max-w-xl mx-auto">
              Join your college on Cybervie and start your AI learning journey today.
              Measure and improve the AI readiness of every student.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" className="btn-primary text-base px-8 py-3">
                Sign In with College Email <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="btn-secondary text-base px-8 py-3">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center font-bold text-white text-sm">C</div>
            <span className="text-sm text-subtle">Cybervie © 2026. AI Learning & Cybersecurity Platform.</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-subtle">
            <Link to="/about">About</Link>
            <Link to="/rankings">Rankings</Link>
            <span className="flex items-center gap-1"><Lock size={12} /> DPDP Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
