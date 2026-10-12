/* ======================================================================
   Landing — CCAEP 2026 design ported from the Lovable "cybervie-hub"
   remix (TanStack/TS + Tailwind v4 source → our JSX + Tailwind v3 stack).

   Styling lives in index.css scoped under the .ccaep wrapper. Two sections
   of the previous landing are preserved verbatim and rendered inside .ace
   wrappers: the career mapper ("Existing experience → AI role") and the
   application form ("Apply").
   ====================================================================== */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, Cloud, Code2,
  Cpu, Download, Layers3, Menu, Moon, Network, ScanLine, ShieldCheck,
  Sun, Terminal, Workflow, X,
} from 'lucide-react';
import BrandLogo from '../../components/BrandLogo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { api } from '../../api/client.js';
import { careerMap, industries, tracks } from '../../lib/academy-data.js';
import coreImage from '../../assets/ai-engine-core.jpg';

/* ------------------------------------------------------------------ */
/* Button helpers — new design (shadcn-style variants)                 */
/* ------------------------------------------------------------------ */
const LP_BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';
const LP_VARIANTS = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
};
const LP_SIZES = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-10 rounded-md px-8',
  icon: 'h-9 w-9',
};
const lp = (variant = 'default', size = 'default', cls = '') =>
  `${LP_BASE} ${LP_VARIANTS[variant]} ${LP_SIZES[size]} ${cls}`;

/* ------------------------------------------------------------------ */
/* Button machinery kept for the preserved .ace sections below         */
/* ------------------------------------------------------------------ */
const BTN_BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';
const BTN_VARIANTS = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
};
const BTN_SIZES = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-10 rounded-md px-8',
  icon: 'h-9 w-9',
};

// Minimal tailwind-merge stand-in: when `cls` re-specifies a property that the
// base/variant already set (rounded, justify, h, whitespace, text size/color,
// bg, border color), drop the earlier conflicting class so the override wins.
const MERGE_RULES = [
  [/\brounded/, /\brounded(-\S+)?\b/g],
  [/\bjustify-/, /\bjustify-\S+/g],
  [/\bh-(auto|\d)/, /\bh-\S+/g],
  [/\bwhitespace-/, /\bwhitespace-\S+/g],
  [/\btext-(xs|sm|base|lg|xl|\d+xl)\b/, /\btext-sm\b/g],
  [/\bbg-/, /\b\S*bg-\S+/g],
  [/\btext-(?!(xs|sm|base|lg|xl|\d+xl|left|right|center|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty)\b)/, /\b\S*text-(?!(xs|sm|base|lg|xl|\d+xl|left|right|center|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty)\b)\S+/g],
  [/\bborder-(?!\d|b\b|t\b|l\b|r\b|x\b|y\b)/, /\bborder-(?!\d|b\b|t\b|l\b|r\b|x\b|y\b)\S*/g],
];
function mergeCls(base, cls) {
  let out = base;
  for (const [detect, strip] of MERGE_RULES) {
    if (detect.test(cls)) out = out.replace(strip, '');
  }
  return `${out.replace(/\s+/g, ' ').trim()} ${cls}`;
}

const btn = (variant = 'default', size = 'default', cls = '') =>
  mergeCls(`${BTN_BASE} ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]}`, cls);

const FIELD_CLS =
  'flex w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
const INPUT_CLS = `${FIELD_CLS} h-11`;
const SELECT_CLS = `${FIELD_CLS} h-11 bg-background`;

/* ------------------------------------------------------------------ */
/* CCAEP landing content                                               */
/* ------------------------------------------------------------------ */
const modules = [
  { icon: Cpu, title: 'Understand the intelligence.', detail: 'Neural networks, tokens, embeddings and attention. Build a GPT from scratch, then optimize it for inference.', classes: '01–10', topic: 'MODEL FOUNDATIONS' },
  { icon: Layers3, title: 'Build beyond the prompt.', detail: 'Production LLM APIs, streaming, structured outputs and end-to-end RAG with hybrid search and reranking.', classes: '11–23', topic: 'LLM APPLICATIONS & RAG' },
  { icon: Workflow, title: 'Give AI the ability to act.', detail: 'ReAct agents, LangGraph, memory, context engineering, MCP and multi-agent systems with human approval.', classes: '27–32', topic: 'AGENTS & ORCHESTRATION' },
  { icon: ScanLine, title: 'Make quality measurable.', detail: 'Golden datasets, RAG evaluation, LLM-as-judge, tracing and observability. Test intelligence, not just code.', classes: '24–26', topic: 'EVALUATION & OBSERVABILITY' },
  { icon: Cloud, title: 'Ship it to the real world.', detail: 'Reasoning and multimodal models, LoRA, vLLM, Docker, Kubernetes, AWS Bedrock and production LLMOps.', classes: '33–40', topic: 'CUSTOMIZATION & DEPLOYMENT' },
  { icon: ShieldCheck, title: 'Engineer with confidence.', detail: 'AI security, guardrails and governance. Deliver your capstone, sharpen system design and map your next career move.', classes: '41–45', topic: 'SECURITY & CAREER LAUNCH' },
];

const projects = [
  ['Production RAG system', 'An evaluated, fully traced retrieval application with a live dashboard and real document-grounded answers.'],
  ['Multi-agent application', 'Agents with memory, MCP tools, human approval and a complete evaluation suite.'],
  ['Customized model', 'Hands-on model customization and inference serving with the fine-tuning tools covered in class.'],
  ['Production LLMOps pipeline', 'A pipeline that tests, evaluates, builds and deploys on merge, with a runbook and incident simulation.'],
  ['Your deployed capstone', 'Bring everything together in a deployed AI product, with a live demo, GitHub repository and system-design story.'],
];

const faqs = [
  ['Who is CCAEP for?', 'Software developers, IT professionals, data practitioners, technical leads, founders, fresh graduates and career switchers who want to build production AI systems.'],
  ['Do I need an AI or machine learning background?', 'The course starts with neural networks and model foundations. Working Python is expected for fresh graduates and career switchers; an AI-specific degree is not required.'],
  ['How is the course structured?', 'There are 45 live classes, with roughly 60% of class time devoted to hands-on labs. The journey covers model internals, LLM applications, RAG, evaluation, agents, cloud deployment, security and career planning.'],
  ['What will I have built by the end?', 'Four portfolio projects and a deployed capstone, with practical work across RAG, multi-agent systems, model customization and production LLMOps.'],
  ['Which tools and platforms will I use?', 'Python, PyTorch, FastAPI, OpenAI, Claude, Gemini, pgvector, LangChain, LangGraph, MCP, Docker and Kubernetes. Cloud training focuses on AWS Bedrock, with Azure and GCP compared.'],
  ['Where can I find fees and upcoming batch dates?', 'Visit Cybervie for the latest enrollment information. Fees and upcoming batch dates are not specified in the course brochure.'],
];

const curriculum = [
  ['01', '01–06', 'Neural networks, tokens & attention', 'Train a neural network on MNIST. Explore tokenization, embeddings, QKV projections and self-, cross- and multi-head attention.', 'Lab: build a multi-head attention module.'],
  ['02', '07–10', 'Build & optimize a transformer', 'Causal masking, decoder-only transformers, pretraining and post-training, distributed training, KV caching, quantization and LoRA.', 'Lab: code a GPT from scratch and explore inference optimization.'],
  ['03', '11–15', 'Production LLM applications', 'Prompting, provider APIs, structured outputs, tool calling, caching, routing, cost and latency control, and serving with FastAPI.', 'Deliverable: a tested streaming chat API with a lightweight UI.'],
  ['04', '16–23', 'Retrieval-augmented generation', 'Chunking, vector databases, hybrid search, reranking, query rewriting, GraphRAG, KAG, agentic and multimodal RAG, guardrails and Code RAG.', 'Build: an end-to-end document-grounded RAG system.'],
  ['05', '24–26', 'Evaluation & observability', 'Golden datasets, RAG-specific evaluation, LLM-as-judge, CI evaluation gates, Langfuse, LangSmith and OpenTelemetry tracing.', 'Deliverable: a fully traced RAG project with a live dashboard.'],
  ['06', '27–32', 'Agents, context engineering & MCP', 'ReAct, Pydantic AI, LangChain, LangGraph, context engineering, memory, MCP, multi-agent orchestration and agent evaluation.', 'Project: multi-agent system with memory, MCP tools and human approval.'],
  ['07', '33–37', 'Reasoning, multimodal & customization', 'Thinking models, CLIP, vision-language models, diffusion, prompting vs RAG vs fine-tuning, LoRA/QLoRA and vLLM.', 'Practice: customize models and serve inference.'],
  ['08', '38–40', 'Cloud deployment & LLMOps', 'Docker, Kubernetes, AWS Bedrock, Azure and GCP comparisons, GitHub Actions, MLflow, monitoring, rollbacks and cost governance.', 'Project: a tested deployment pipeline, runbook and simulated incident.'],
  ['09', '41', 'AI security & governance', 'Prompt-injection defense, guardrails, PII handling, OWASP LLM Top 10, NIST AI RMF, ISO/IEC 42001 and the EU AI Act.', 'Practice: secure and govern production AI systems.'],
  ['10', '42–45', 'Capstone & career launch', 'Deploy your capstone, present a live demo, prepare for system-design interviews and map the transition from your current IT role.', 'Deliverable: a polished portfolio, personal career plan and 10 target roles.'],
];

const roadmapSteps = [
  ['Map your starting point', 'Connect your development, data, infrastructure, testing or business experience to a target AI role.', 'Your skills → your role'],
  ['Build the engineering foundation', 'Learn model internals, reliable APIs and retrieval. Turn knowledge into working, tested applications.', 'Classes 01–23'],
  ['Prove production readiness', 'Add evaluation, agents, cloud deployment and security. Build four portfolio projects that show your depth.', 'Classes 24–41'],
  ['Ship your capstone & portfolio', 'Deploy a complete system. Publish a live demo and GitHub repository, with clear technical trade-offs.', 'Classes 42–44'],
  ['Launch your career transition', 'Polish your resume and LinkedIn profile, shortlist 10 target roles and build a job-search and 12-month growth plan.', 'Class 45 · your next chapter'],
];

const careerCards = [
  ['Software development', 'AI Engineer · Applied AI Engineer', Code2],
  ['Data & machine learning', 'LLM Engineer · AI Platform Engineer', Network],
  ['Infrastructure & DevOps', 'MLOps Engineer · LLMOps Engineer', Cloud],
  ['Testing & security', 'AI Evaluation Engineer · AI Security Engineer', ShieldCheck],
];

const NAV_LINKS = [
  ['Curriculum', '#curriculum'],
  ['Projects', '#projects'],
  ['Career paths', '#careers'],
  ['FAQs', '#faq'],
];

/* ------------------------------------------------------------------ */
/* Header / shared bits                                                */
/* ------------------------------------------------------------------ */
function Brand() {
  return (
    <a href="#top" className="brand gap-3" aria-label="Cybervie home">
      <BrandLogo className="brand-logo" />
      <span className="font-display text-lg font-semibold leading-none">
        Cybervie<span className="text-primary">.AI</span>
      </span>
    </a>
  );
}

function ApplyButton({ compact = false }) {
  return <a href="#apply" className={lp('default', compact ? 'default' : 'lg')}>Apply now <ArrowUpRight /></a>;
}

function SyllabusButton() {
  return (
    <a href="/CCAEP_Brochure.pdf" download="CCAEP_Brochure.pdf" className={lp('outline', 'lg')}>
      <Download /> Download syllabus
    </a>
  );
}

function LandingHeader() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      {NAV_LINKS.map(([label, href]) => (
        <a key={href} href={href} className="nav-link" onClick={() => setOpen(false)}>{label}</a>
      ))}
    </>
  );

  const sessionButton = (
    <Link
      to={user ? '/app' : '/login'}
      className={lp('outline', 'default', 'w-fit')}
      onClick={() => setOpen(false)}
    >
      {user ? 'Dashboard' : 'Sign in'}
    </Link>
  );

  return (
    <header className="site-header">
      <div className="page-width flex h-full items-center justify-between gap-3">
        <Brand />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">{nav}</nav>
        <div className="flex items-center gap-3">
          <div className="theme-switch" role="group" aria-label="Color theme">
            <button type="button" className={lp('ghost', 'icon')} onClick={() => setTheme('light')} aria-label="Light theme" title="Light theme" aria-pressed={theme === 'light'}><Sun /></button>
            <button type="button" className={lp('ghost', 'icon')} onClick={() => setTheme('dark')} aria-label="Dark theme" title="Dark theme" aria-pressed={theme === 'dark'}><Moon /></button>
          </div>
          <div className="hidden sm:flex items-center gap-2">{sessionButton}<ApplyButton compact /></div>
          <button type="button" className={`${lp('ghost', 'icon')} lg:hidden`} onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-menu flex flex-col gap-6 lg:hidden" aria-label="Mobile navigation">
          {nav}
          <div className="flex gap-3">
            {sessionButton}
            <a href="#apply" className={lp('default', 'default', 'w-fit')} onClick={() => setOpen(false)}>Apply now <ArrowUpRight /></a>
          </div>
        </nav>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section id="top" className="hero">
      <img className="hero-art" src={coreImage} alt="Exploded AI computing core with illuminated cyan circuits" width={1920} height={1024} fetchpriority="high" />
      <div className="page-width hero-content entrance">
        <div className="eyebrow"><span className="live-dot" /> CCAEP / 2026 EDITION</div>
        <h1 className="hero-title">AI Engineering<br /><span>Professional</span></h1>
        <div className="credential">
          <span className="credential-name">Cybervie Certified AI Engineering Professional</span>
          <span className="credential-short">(CCAEP)</span>
        </div>
        <div className="mb-4 font-display text-xl font-medium">Don’t just use AI. Engineer it.</div>
        <p className="hero-copy">Go from transformer internals to production-ready GenAI, RAG and agents. Build real systems. Ship a portfolio that speaks for itself.</p>
        <div className="mt-8 flex flex-wrap gap-3"><ApplyButton /><SyllabusButton /></div>
        <div className="mt-6 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <Terminal className="size-3.5 text-primary" /> BUILT FOR DEVELOPERS. DESIGNED FOR THE REAL WORLD.
        </div>
      </div>
      <div className="hero-tag"><span className="text-accent">SYSTEM_01 / INTELLIGENCE CORE</span><br />MODELS → RETRIEVAL → AGENTS → PRODUCTION</div>
    </section>
  );
}

function StatsStrip() {
  return (
    <div className="page-width">
      <div className="stats">
        {[['45', 'Live, instructor-led classes'], ['4 + 1', 'Portfolio projects + capstone'], ['60%', 'Hands-on learning'], ['10 years', 'Of upskilling with Cybervie']].map(([value, label]) => (
          <div className="stat" key={value}>
            <div className="stat-value">{value}<span className="text-primary">.</span></div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
      <div className="stack-strip flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
        <span className="font-mono text-[10px] text-muted-foreground">YOUR PRODUCTION STACK</span>
        {['Python', 'PyTorch', 'LangChain', 'LangGraph', 'FastAPI', 'AWS Bedrock'].map((name) => (
          <span className="stack-name" key={name}>{name}</span>
        ))}
      </div>
    </div>
  );
}

function ModuleGrid() {
  return (
    <section id="modules" className="section page-width">
      <div className="flex flex-wrap items-end justify-between gap-7">
        <div>
          <div className="eyebrow">THE LEARNING PATH</div>
          <h2 className="section-title">From first principles.<br />To production systems.</h2>
        </div>
        <a href="#curriculum" className={lp('outline')}>Explore the curriculum <ArrowUpRight /></a>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, i) => (
          <article className="module-card" key={m.topic}>
            <div className="flex items-center justify-between">
              <m.icon className="module-icon" />
              <span className="module-number">{String(i + 1).padStart(2, '0')} / 06</span>
            </div>
            <h3>{m.title}</h3>
            <p>{m.detail}</p>
            <div className="module-footer flex flex-wrap justify-between gap-2">
              <span>{m.topic}</span>
              <span>CLASSES {m.classes}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DetailedCurriculum() {
  return (
    <section id="curriculum" className="section page-width" aria-labelledby="curriculum-heading">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow">45 LIVE CLASSES / 10 MODULES</div>
          <h2 id="curriculum-heading" className="section-title">The course curriculum.</h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">A complete journey from understanding models to deploying secure, measurable AI systems.</p>
        </div>
        <SyllabusButton />
      </div>
      <div className="curriculum-list mt-10">
        {curriculum.map(([number, classes, title, description, lab], i) => (
          <details className="curriculum-item" key={number} open={i === 0}>
            <summary>
              <span className="curriculum-index">{number}</span>
              <span className="curriculum-name">{title}</span>
              <span className="curriculum-classes">CLASSES {classes}</span>
              <ChevronDown className="curriculum-chevron" />
            </summary>
            <div className="curriculum-detail">
              <p>{description}</p>
              <div className="mt-4 flex items-start gap-2 text-sm text-accent">
                <Check className="mt-0.5 size-4 shrink-0" /><span>{lab}</span>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function CareerRoadmap() {
  return (
    <section className="roadmap-band" aria-labelledby="roadmap-heading">
      <div className="section page-width">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow">FROM YOUR CURRENT ROLE TO YOUR NEXT</div>
            <h2 id="roadmap-heading" className="section-title">Your AI career roadmap.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">A practical progression built around skills, shipped work and a focused career plan.</p>
          </div>
          <a href="#careers" className={lp('outline')}>Explore career paths <ArrowUpRight /></a>
        </div>
        <ol className="career-timeline mt-12">
          {roadmapSteps.map(([title, detail, phase], i) => (
            <li className="career-step" key={title}>
              <span className="career-step-marker">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="eyebrow">{phase}</div>
                <h3 className="mt-3 font-display text-xl font-medium">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 border-t border-border pt-7">
          <span className="eyebrow">KEEP GROWING</span>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">AI Engineer → Senior / Staff Engineer · Specialist in agents, evaluation or AI security · AI / Solutions Architect · Forward-Deployed Engineer · AI engineering leadership</p>
        </div>
      </div>
    </section>
  );
}

function Careers() {
  return (
    <section id="careers" className="section page-width">
      <div className="eyebrow">YOUR NEXT CHAPTER</div>
      <h2 className="section-title">Your IT experience.<br />An AI engineering future.</h2>
      <p className="mt-6 max-w-2xl text-sm leading-8 text-muted-foreground">Build on the skills you already have. The course maps your current background to target roles, then turns your projects into a practical transition plan.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {careerCards.map(([from, to, Icon]) => (
          <article className="module-card" key={from}>
            <Icon className="module-icon" />
            <h3>{from}</h3>
            <p>{to}</p>
          </article>
        ))}
      </div>
      <div className="mt-9 flex flex-wrap gap-x-8 gap-y-4 text-sm text-muted-foreground">
        {['System-design interviews', 'GitHub portfolio', 'Personal career plan'].map((text) => (
          <span key={text} className="flex items-center gap-2"><Check className="size-4 text-primary" />{text}</span>
        ))}
      </div>
    </section>
  );
}

function Projects() {
  return (
    <section id="projects" className="section page-width">
      <div className="eyebrow">BUILD. DEPLOY. SHOW YOUR WORK.</div>
      <h2 className="section-title mb-10">A portfolio. Not just a certificate.</h2>
      {projects.map(([name, description], i) => (
        <article className="project-row" key={name}>
          <span className="font-mono text-sm text-primary">{String(i + 1).padStart(2, '0')}</span>
          <h3>{name}{i === 4 && <span className="mt-2 block font-mono text-xs text-accent">CAPSTONE</span>}</h3>
          <p>{description}</p>
        </article>
      ))}
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="section page-width">
      <div className="eyebrow">GOOD QUESTIONS. CLEAR ANSWERS.</div>
      <h2 className="section-title mb-8">Before you start.</h2>
      {faqs.map(([question, answer]) => (
        <details className="faq-item" key={question}>
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>
      ))}
    </section>
  );
}

function ClosingBand() {
  return (
    <section className="closing-band">
      <div className="page-width flex flex-wrap items-center justify-between gap-8">
        <div>
          <div className="eyebrow">LESS THEORY. MORE SHIPPING.</div>
          <h2 className="section-title">Build what comes next.</h2>
          <p className="mt-4 text-sm text-muted-foreground">Your journey from AI user to AI engineer starts here.</p>
        </div>
        <ApplyButton />
      </div>
    </section>
  );
}

function LandingFooter() {
  const { user } = useAuth();
  return (
    <footer className="page-width flex flex-wrap items-center justify-between gap-5 py-8">
      <Brand />
      <nav className="flex flex-wrap items-center gap-6" aria-label="Footer navigation">
        <Link to="/paths" className="nav-link">Paths</Link>
        <Link to="/rankings" className="nav-link">Rankings</Link>
        <Link to="/about" className="nav-link">About</Link>
        <Link to={user ? '/app' : '/login'} className="nav-link">{user ? 'Dashboard' : 'Sign in'}</Link>
      </nav>
      <span className="font-mono text-[10px] text-muted-foreground">© 2026 CYBERVIE. ALL RIGHTS RESERVED.</span>
      <a href="https://cybervie.com" target="_blank" rel="noreferrer" className={lp('link')}>cybervie.com <ArrowRight /></a>
    </footer>
  );
}

export default function Landing() {
  const { user } = useAuth();

  useEffect(() => {
    const previous = document.title;
    document.title = 'CCAEP 2026 — Cybervie Certified AI Engineering Professional';
    return () => { document.title = previous; };
  }, []);

  return (
    <>
      <div className="ccaep overflow-x-clip">
        <LandingHeader />
        <main>
          <Hero />
          <StatsStrip />
          <ModuleGrid />
          <DetailedCurriculum />
          <CareerRoadmap />
          <Careers />
          <Projects />
          <Faq />
        </main>
      </div>

      {/* ======== Preserved sections, recolored to the CCAEP palette ======== */}
      <div className="ace ace-ccaep">
        <CareerMapper />
        <ApplicationForm user={user} />
      </div>

      <div className="ccaep">
        <ClosingBand />
        <LandingFooter />
      </div>
    </>
  );
}

/* ================================================================== */
/* Preserved: career mapper — existing role → AI roles (unchanged)     */
/* ================================================================== */
function CareerMapper() {
  const [selected, setSelected] = useState(0);
  const item = careerMap[selected];
  if (!item) return null;

  return (
    <section id="career-mapper" className="dark-grid bg-ink py-20 text-primary-foreground lg:py-28">
      <div className="section-wrap">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="eyebrow text-signal">Existing experience → AI role</p>
            <h2 className="section-title mt-5">You don't need to start your career again.</h2>
            <p className="mt-5 max-w-xl text-primary-foreground/65">Add AI capabilities to the experience you already have.</p>
            <div className="mt-9 grid grid-cols-2 gap-2">
              {careerMap.map((x, i) => (
                <button
                  key={x.from}
                  onClick={() => setSelected(i)}
                  className={btn('outline', 'default', `h-auto min-h-[2.75rem] whitespace-normal border-primary-foreground/15 text-left text-xs ${selected === i ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground'}`)}
                >
                  {x.from}
                </button>
              ))}
            </div>
          </div>

          <div className="system-frame flex flex-col justify-center border hairline bg-primary-foreground/5 p-7 backdrop-blur-sm lg:p-10">
            <p className="eyebrow text-signal">Your transition map</p>
            <div className="mt-8 flex items-center gap-4">
              <div className="border border-signal/40 bg-primary/10 p-5 font-display text-xl font-semibold">{item.from}</div>
              <ArrowRight className="shrink-0 text-signal" />
            </div>
            <div className="ml-5 mt-3 border-l border-signal/35 py-5 pl-8">
              <p className="text-sm leading-6 text-primary-foreground/65">{item.bridge}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {item.to.map((r, i) => (
                <div key={r} className="interactive-panel relative border hairline bg-ink-soft p-4">
                  <span className="data-label text-[10px] font-bold text-signal">PATH {String(i + 1).padStart(2, '0')}</span>
                  <p className="mt-2 text-sm font-semibold">{r}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Preserved: application form — posts to /api/applications (unchanged) */
/* ================================================================== */
function ApplicationForm({ user }) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const options = useMemo(() => ({
    industries: industries.map((x) => x.name),
    roles: tracks.flatMap((x) => x.roles),
    tracks: tracks.map((x) => x.name),
  }), []);

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setSubmitting(true); setError('');
    const data = new FormData(form);
    try {
      await api.submitApplication({
        name: String(data.get('name')),
        email: String(data.get('email')),
        phone: String(data.get('phone')),
        currentRole: String(data.get('currentRole')),
        yearsExperience: String(data.get('yearsExperience')),
        industry: String(data.get('industry')),
        currentSkills: String(data.get('skills')),
        desiredAiRole: String(data.get('desiredRole')),
        preferredTrack: String(data.get('track')),
        transitionReason: String(data.get('reason')),
        linkedin: String(data.get('linkedin') || ''),
      });
      form.reset();
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'We could not submit your application. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="apply" className="bg-surface py-20 lg:py-28">
      <div className="section-wrap grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="eyebrow text-primary">Apply</p>
          <h2 className="section-title mt-5">Make your next move an informed one.</h2>
          <p className="mt-5 text-muted-foreground">Tell us where you are now and where you want AI to take your career.</p>
          <div className="mt-9 border-t pt-7">
            <div className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-primary" />
              <p className="text-xs leading-5 text-muted-foreground">Your application is private. We use it only to understand your background and program goals. No employment or placement outcome is guaranteed.</p>
            </div>
          </div>
        </div>

        <div className="system-frame border bg-card p-6 lg:p-10">
          {success ? (
            <div className="grid min-h-[24rem] place-items-center text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent"><Check className="size-7 text-primary" /></span>
                <h3 className="mt-6 text-3xl font-semibold">Application received.</h3>
                <p className="mt-3 text-muted-foreground">Thank you. Your career transition details have been submitted.</p>
                <button className={btn('outline', 'default', 'mt-7')} onClick={() => setSuccess(false)}>Submit another application</button>
                {user && <Link to="/app" className={btn('default', 'default', 'mt-7 ml-3')}>Go to dashboard <ArrowRight /></Link>}
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
              {/* honeypot — hidden from humans, bots fill it */}
              <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="pointer-events-none absolute left-[-9999px] size-0 opacity-0" />
              <Field label="Name"><input name="name" required className={INPUT_CLS} /></Field>
              <Field label="Email"><input name="email" type="email" required className={INPUT_CLS} /></Field>
              <Field label="Phone"><input name="phone" type="tel" required className={INPUT_CLS} /></Field>
              <Field label="Current role"><input name="currentRole" required className={INPUT_CLS} /></Field>
              <Field label="Years of experience"><input name="yearsExperience" required placeholder="e.g. 8 years" className={INPUT_CLS} /></Field>
              <Field label="Industry"><NativeSelect name="industry" options={options.industries} /></Field>
              <Field label="Desired AI role"><NativeSelect name="desiredRole" options={options.roles} /></Field>
              <Field label="Preferred career track"><NativeSelect name="track" options={options.tracks} /></Field>
              <Field label="Current skills" wide><textarea name="skills" required className={`${FIELD_CLS} min-h-[6rem] py-2`} /></Field>
              <Field label="Why are you transitioning?" wide><textarea name="reason" required className={`${FIELD_CLS} min-h-[7rem] py-2`} /></Field>
              <Field label="LinkedIn" wide><input name="linkedin" type="url" placeholder="https://linkedin.com/in/..." className={INPUT_CLS} /></Field>
              {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2">
                <button type="submit" className={btn('default', 'lg', 'h-12 w-full sm:w-auto')} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit application'}<ArrowRight />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children, wide = false }) {
  return (
    <label className={wide ? 'sm:col-span-2' : ''}>
      <span className="mb-2 block text-xs font-bold uppercase text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NativeSelect({ name, options }) {
  return (
    <select name={name} required defaultValue="" className={SELECT_CLS}>
      <option value="" disabled>Select</option>
      {options.map((x) => <option key={x} value={x}>{x}</option>)}
    </select>
  );
}
