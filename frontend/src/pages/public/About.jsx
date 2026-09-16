import { Link } from 'react-router-dom';
import { Brain, ShieldCheck, Trophy, BookOpen, Building2, Target, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-content mb-4">About Cybervie</h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          An AI readiness and cybersecurity learning platform built for Indian B.Tech colleges.
          We help students understand AI, use it responsibly, and prove what they know.
        </p>
      </div>

      <div className="card p-8">
        <h2 className="text-2xl font-bold text-content mb-4">Our Mission</h2>
        <p className="text-muted leading-relaxed">
          India has over 2,900 AICTE-approved engineering institutions and approximately 14.9 lakh B.Tech seats.
          Yet many students graduate without practical exposure to AI, machine learning, and cybersecurity —
          the very skills employers now demand. Cybervie bridges this gap with quiz-first mastery learning,
          real-world AI scenarios, and verifiable competency profiles.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          { icon: Brain, title: 'Understand AI', desc: 'Learn how AI models work internally — from training data to transformers, tokens to embeddings.' },
          { icon: ShieldCheck, title: 'Use AI Responsibly', desc: 'Master prompt engineering, verify AI output, and avoid common pitfalls like hallucinations.' },
          { icon: Target, title: 'Secure AI Systems', desc: 'Learn AI security: prompt injection, data leakage, deepfakes, and secure AI application design.' },
          { icon: Trophy, title: 'Prove Competency', desc: 'Build a verified public profile with badges, competency scores, and ranking evidence.' },
        ].map((f, i) => (
          <div key={i} className="card p-6">
            <div className="w-10 h-10 rounded-lg bg-brand-600/15 flex items-center justify-center mb-3">
              <f.icon size={20} className="text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-content mb-2">{f.title}</h3>
            <p className="text-sm text-muted">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="card p-8 bg-gradient-to-br from-brand-600/10 to-brand-600/5">
        <h2 className="text-2xl font-bold text-content mb-4">For Colleges</h2>
        <div className="space-y-3">
          {[
            'Domain-verified student login via Google Workspace',
            'Faculty dashboards with cohort progress and competency heatmaps',
            'Auto-graded assignments with detailed analytics',
            'AICTE-aligned curriculum and UNESCO AI Competency Framework',
            'DPDP Act 2023 ready with granular consent controls',
            'Low-bandwidth mobile-first design for Indian networks',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-muted">
              <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <Link to="/login" className="btn-primary mt-6">
          Get Started <ArrowRight size={16} />
        </Link>
      </div>

      <div className="text-center text-sm text-subtle">
        <p>Cybervie © 2026 — Built for Indian Engineering Education</p>
      </div>
    </div>
  );
}
