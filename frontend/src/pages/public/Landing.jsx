import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Blocks, Check, ChevronRight, Database,
  GitBranch, Loader2, Menu, ShieldCheck, Sparkles, X,
} from 'lucide-react';
import BrandLogo from '../../components/BrandLogo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import { careerMap, industries, tracks, weeks } from '../../lib/academy-data.js';
import heroImage from '../../assets/enterprise-ai-workspace.jpg';

/* ------------------------------------------------------------------ */
/* shadcn-style button variants used across the landing                */
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

const NAV = [
  ['Career paths', '#career-paths'],
  ['Career mapper', '#career-mapper'],
  ['Project lab', '#projects'],
  ['Program', '#program'],
  ['Project advisor', '#project-advisor'],
];

const PATHWAY = ['Your experience', 'AI skills', 'Industry project', 'AI career path'];

export default function Landing() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="ace overflow-hidden bg-background">
      {/* ============ HEADER ============ */}
      <header className="fixed inset-x-0 top-0 z-50 border-b hairline bg-ink/90 text-primary-foreground shadow-[0_12px_32px_-20px_oklch(var(--ace-glow)/28%)] backdrop-blur-xl">
        <div className="section-wrap flex h-[4.5rem] items-center justify-between">
          <a href="#top" className="flex items-center gap-3" aria-label="Cybervie.AI home">
            <span className="system-frame grid size-9 place-items-center border hairline bg-primary/15">
              <BrandLogo className="size-6" />
            </span>
            <span className="font-display text-sm font-semibold leading-tight">
              Cybervie<span className="text-signal">.AI</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="nav-link text-xs font-semibold text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            {user ? (
              <Link to="/app" className="nav-link text-xs font-semibold text-primary-foreground/70 transition-colors hover:text-primary-foreground">Dashboard</Link>
            ) : (
              <Link to="/login" className="nav-link text-xs font-semibold text-primary-foreground/70 transition-colors hover:text-primary-foreground">Sign in</Link>
            )}
            <a href="#apply" className={btn('default', 'sm')}>Apply to the program <ArrowUpRight /></a>
          </div>

          <button className="text-primary-foreground lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <nav className="section-wrap flex flex-col border-t hairline py-5 lg:hidden" onClick={() => setMenuOpen(false)}>
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="border-b hairline py-3 text-sm">{label}</a>
            ))}
            {user
              ? <Link to="/app" className="pt-4 text-sm font-bold text-signal">Dashboard</Link>
              : <Link to="/login" className="pt-4 text-sm font-bold text-signal">Sign in</Link>}
            <a href="#apply" className="pt-3 text-sm font-bold text-signal">Apply to the program</a>
          </nav>
        )}
      </header>

      {/* ============ HERO ============ */}
      <section id="top" className="relative min-h-[760px] bg-ink text-primary-foreground lg:min-h-[790px]">
        <img src={heroImage} width={1536} height={1024} alt="" aria-hidden="true" fetchpriority="high" decoding="async" className="absolute inset-0 size-full object-cover object-center" />
        <div className="hero-backdrop absolute inset-0" />
        <div className="hero-grid absolute inset-0 opacity-55" />
        <div className="section-wrap relative flex min-h-[760px] flex-col justify-center pb-40 pt-28 sm:pb-24 lg:min-h-[790px]">
          <div className="max-w-3xl fade-up">
            <p className="eyebrow mb-6 inline-flex items-center gap-3 border-l-2 border-signal bg-ink/50 py-2 pl-4 pr-5 text-signal">
              2-month career transition program
            </p>
            <h1 className="hero-title font-display text-5xl font-semibold leading-[.96] sm:text-7xl lg:text-[6.5rem]">
              Move your career <span className="text-signal">into AI.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-primary-foreground/70 sm:text-xl sm:leading-8">
              Build real enterprise AI projects, develop role-specific skills, and use your existing professional experience to transition into the AI ecosystem.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#career-paths" className={btn('default', 'lg', 'hero-cta h-12')}>Explore AI career paths <ArrowRight /></a>
              <a href="#program" className={btn('outline', 'lg', 'h-12 border-primary-foreground/25 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground')}>
                View the 8-week program
              </a>
            </div>
          </div>

          <div className="system-frame absolute inset-x-5 bottom-0 grid grid-cols-2 border-y hairline bg-ink/80 backdrop-blur-xl sm:grid-cols-4 lg:inset-x-auto lg:w-[min(100%-2.5rem,1320px)] fade-up-delay">
            {PATHWAY.map((item, i) => (
              <div key={item} className="pathway-step flex min-h-[4rem] items-center gap-2 border-b hairline px-3 [&:nth-last-child(-n+2)]:border-b-0 even:border-l sm:gap-3 sm:border-b-0 sm:border-r sm:px-4 sm:even:border-l-0 sm:last:border-r-0">
                <span className="data-label shrink-0 text-xs text-signal">0{i + 1}</span>
                <span className="text-[10px] font-semibold uppercase sm:text-xs">{item}</span>
                {i < 3 && <ChevronRight className="ml-auto hidden size-4 text-signal/50 sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY TRANSITION ============ */}
      <section className="light-grid border-b bg-surface py-20 lg:py-28">
        <div className="section-wrap grid gap-14 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="eyebrow text-primary">Why career transition</p>
            <h2 className="section-title mt-5">Your experience is not baggage. It is your advantage.</h2>
          </div>
          <div className="grid gap-px overflow-hidden border bg-border sm:grid-cols-2">
            {[
              { icon: Database, title: 'Start with domain knowledge', text: 'Understand the decisions, constraints, customers, and workflows that generic AI training misses.' },
              { icon: Blocks, title: 'Add applied AI skills', text: 'Learn LLMs, RAG, agents, evaluation, architecture, and governance through enterprise use cases.' },
              { icon: GitBranch, title: 'Build evidence', text: 'Create a project, architecture, business case, implementation roadmap, and executive presentation.' },
              { icon: ArrowUpRight, title: 'Translate into a role', text: 'Map what you already know to engineering, architecture, product, delivery, consulting, or governance.' },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="interactive-panel bg-card p-7 lg:p-9">
                <Icon className="size-6 text-primary" />
                <h3 className="mt-8 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="section-wrap mt-14 flex flex-col items-start justify-between gap-6 border-t pt-8 lg:flex-row lg:items-center">
          <p className="font-display text-2xl font-medium lg:text-3xl">
            Domain Experience <span className="text-primary">+</span> AI Skills <span className="text-primary">=</span> AI Career Opportunity
          </p>
          <span className="text-xs font-bold uppercase text-muted-foreground">Built for working professionals</span>
        </div>
      </section>

      <CareerExplorer />
      <CareerMapper />
      <ProjectLab />
      <Program />
      <LearningTracks />
      <Portfolio />
      <ProjectAdvisor />
      <ApplicationForm user={user} />

      {/* ============ FOOTER ============ */}
      <footer className="bg-ink py-10 text-primary-foreground">
        <div className="section-wrap flex flex-col justify-between gap-6 border-t hairline pt-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <BrandLogo className="size-5" />
            <span className="font-display font-semibold">Cybervie<span className="text-signal">.AI</span></span>
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-xs font-semibold text-primary-foreground/70">
            <Link to="/paths" className="transition-colors hover:text-primary-foreground">Paths</Link>
            <Link to="/rankings" className="transition-colors hover:text-primary-foreground">Rankings</Link>
            <Link to="/about" className="transition-colors hover:text-primary-foreground">About</Link>
            {user
              ? <Link to="/app" className="transition-colors hover:text-primary-foreground">Dashboard</Link>
              : <Link to="/login" className="transition-colors hover:text-primary-foreground">Sign in</Link>}
          </nav>
          <p className="max-w-md text-xs leading-5 text-primary-foreground/55">
            A professional education program. Participation does not guarantee employment, placement, salary, or a specific career outcome.
          </p>
        </div>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Career path explorer — five tracks, role-level detail               */
/* ------------------------------------------------------------------ */
function CareerExplorer() {
  const [active, setActive] = useState(0);
  const track = tracks[active];
  const [role, setRole] = useState('AI Engineer');
  const selectTrack = (i) => {
    const next = tracks[i];
    if (!next) return;
    setActive(i);
    setRole(next.roles[0] ?? 'AI role');
  };
  if (!track) return null;

  return (
    <section id="career-paths" className="section-divider bg-background py-20 lg:py-28">
      <div className="section-wrap">
        <div className="max-w-3xl">
          <p className="eyebrow text-primary">AI Career Path Explorer</p>
          <h2 className="section-title mt-5">Find where your experience can take you.</h2>
          <p className="mt-5 text-muted-foreground">Explore five career tracks and thirty role options—without discarding the expertise you have already built.</p>
        </div>

        <div className="mt-12 flex overflow-x-auto border-b">
          {tracks.map((t, i) => (
            <button
              key={t.name}
              onClick={() => selectTrack(i)}
              className={`h-14 shrink-0 rounded-none border-b-2 px-5 text-sm font-medium transition-colors ${active === i ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="system-frame grid border-x border-b lg:grid-cols-[.75fr_1.25fr]">
          <aside className="border-b p-5 lg:border-b-0 lg:border-r lg:p-8">
            <p className="eyebrow text-muted-foreground">Roles in this track</p>
            <div className="mt-5 flex flex-wrap gap-2 lg:flex-col">
              {track.roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`${btn(role === r ? 'secondary' : 'ghost', 'default', 'justify-between text-left')}`}
                >
                  {r}
                  {role === r && <ArrowRight className="text-primary" />}
                </button>
              ))}
            </div>
          </aside>

          <article className="p-6 lg:p-10">
            <div className="flex flex-col justify-between gap-5 border-b pb-7 sm:flex-row">
              <div>
                <p className="eyebrow text-primary">{track.name}</p>
                <h3 className="mt-3 text-3xl font-semibold">{role}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{track.description}</p>
              </div>
              <DepthMeter technical={track.technical} business={track.business} />
            </div>
            <div className="grid gap-8 py-8 sm:grid-cols-2">
              <Info title="Typical responsibilities" items={track.responsibilities} />
              <Info title="Existing backgrounds" items={track.backgrounds} />
              <Info title="Skills required" items={track.skills} />
              <Info title="AI concepts required" items={track.concepts} />
            </div>
            <div className="grid gap-px border bg-border sm:grid-cols-2">
              <div className="bg-surface p-5">
                <p className="eyebrow text-muted-foreground">Example industry project</p>
                <p className="mt-2 font-semibold">{track.project}</p>
              </div>
              <div className="bg-surface p-5">
                <p className="eyebrow text-muted-foreground">Portfolio deliverables</p>
                <p className="mt-2 font-semibold">{track.deliverables.join(' · ')}</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function DepthMeter({ technical, business }) {
  return (
    <div className="min-w-[13rem] space-y-3 border-l pl-5">
      <Meter label="Technical depth" value={technical} />
      <Meter label="Business depth" value={business} />
    </div>
  );
}

function Meter({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
        <span>{label}</span><span>{value}/5</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`h-1.5 flex-1 ${n <= value ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
    </div>
  );
}

function Info({ title, items }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase text-muted-foreground">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.map((x) => (
          <li key={x} className="flex gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />{x}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Career mapper — existing role → AI roles                            */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Industry project lab                                                */
/* ------------------------------------------------------------------ */
function ProjectLab() {
  const [industryIndex, setIndustryIndex] = useState(0);
  const [projectIndex, setProjectIndex] = useState(0);
  const industry = industries[industryIndex];
  const project = industry?.projects[Math.min(projectIndex, industry.projects.length - 1)];
  const chooseIndustry = (i) => { setIndustryIndex(i); setProjectIndex(0); };
  if (!industry || !project) return null;

  return (
    <section id="projects" className="bg-background py-20 lg:py-28">
      <div className="section-wrap">
        <div className="max-w-4xl">
          <p className="eyebrow text-primary">Industry Project Lab</p>
          <h2 className="section-title mt-5">Build AI solutions around real industry problems.</h2>
          <p className="mt-5 max-w-2xl text-muted-foreground">Not generic chatbot exercises. Each project moves from a business problem through architecture, technology, value, and career evidence.</p>
        </div>

        <div className="mt-12 flex overflow-x-auto border-b">
          {industries.map((x, i) => (
            <button
              key={x.name}
              onClick={() => chooseIndustry(i)}
              className={`h-14 shrink-0 rounded-none border-b-2 px-5 text-sm font-medium transition-colors ${industryIndex === i ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {x.short}
            </button>
          ))}
        </div>

        <div className="system-frame grid border-x border-b lg:grid-cols-[.67fr_1.33fr]">
          <aside className="border-b bg-surface p-6 lg:border-b-0 lg:border-r lg:p-8">
            <p className="eyebrow text-primary">{industry.name}</p>
            <div className="mt-6 space-y-2">
              {industry.projects.map((p, i) => (
                <button
                  key={p.title}
                  onClick={() => setProjectIndex(i)}
                  className={btn(projectIndex === i ? 'secondary' : 'ghost', 'default', 'h-auto min-h-[3rem] w-full justify-between whitespace-normal text-left')}
                >
                  {p.title}<ChevronRight />
                </button>
              ))}
            </div>
          </aside>

          <article className="p-6 lg:p-10">
            <span className="eyebrow text-muted-foreground">Enterprise project</span>
            <h3 className="mt-3 text-3xl font-semibold">{project.title}</h3>
            {project.note && (
              <p className="mt-4 border-l-2 border-primary bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground">{project.note}</p>
            )}
            <div className="mt-8 grid gap-px overflow-hidden border bg-border sm:grid-cols-2">
              <ProjectField number="01" title="Business problem" body={project.problem} />
              <ProjectField number="02" title="AI solution" body={project.solution} />
              <ProjectField number="03" title="Business value" body={project.value} />
              <ProjectField number="04" title="Career roles demonstrated" body={project.roles.join(' · ')} />
            </div>
            <div className="mt-6 bg-ink p-6 text-primary-foreground">
              <p className="eyebrow text-signal">Architecture</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {project.architecture.split(' → ').map((step, i, arr) => (
                  <span key={step} className="contents">
                    <span className="border hairline bg-primary-foreground/5 px-3 py-2 text-xs font-semibold">{step}</span>
                    {i < arr.length - 1 && <ArrowRight className="size-4 text-signal" />}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {project.technologies.map((t) => (
                  <span key={t} className="rounded-sm bg-primary/20 px-2.5 py-1 text-xs text-signal">{t}</span>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function ProjectField({ number, title, body }) {
  return (
    <div className="bg-card p-5">
      <span className="text-xs font-bold text-primary">{number}</span>
      <h4 className="mt-2 font-semibold">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8-week program                                                      */
/* ------------------------------------------------------------------ */
function Program() {
  const [active, setActive] = useState(0);
  const week = weeks[active];
  if (!week) return null;

  return (
    <section id="program" className="light-grid bg-surface py-20 lg:py-28">
      <div className="section-wrap">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow text-primary">8-week program</p>
            <h2 className="section-title mt-5">From transition map to professional portfolio.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">A focused two-month sequence that connects technical foundations, enterprise delivery, and your target role.</p>
        </div>

        <div className="system-frame mt-12 grid border bg-border lg:grid-cols-[.7fr_1.3fr]">
          <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-1">
            {weeks.map((w, i) => (
              <button
                key={w.title}
                onClick={() => setActive(i)}
                className={`h-auto min-h-[4rem] justify-start rounded-none px-5 text-left text-sm font-medium transition-colors ${active === i ? 'border-l-4 border-primary bg-card text-primary' : 'border-l-4 border-transparent bg-card text-foreground hover:bg-accent'}`}
              >
                <span className="data-label mr-2 text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                <span className="whitespace-normal">{w.title}</span>
              </button>
            ))}
          </div>

          <div className="bg-card p-7 lg:p-12">
            <p className="eyebrow text-primary">Week {active + 1}</p>
            <h3 className="mt-4 text-3xl font-semibold lg:text-4xl">{week.title}</h3>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {week.topics.map((x) => (
                <div key={x} className="flex items-center gap-3 border-b py-3 text-sm">
                  <span className="size-1.5 bg-primary" />{x}
                </div>
              ))}
            </div>
            <div className="mt-10 border-l-2 border-primary bg-surface p-5">
              <p className="eyebrow text-muted-foreground">Weekly deliverable</p>
              <p className="mt-2 font-display text-xl font-semibold">{week.deliverable}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Learning tracks                                                     */
/* ------------------------------------------------------------------ */
function LearningTracks() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="section-wrap">
        <p className="eyebrow text-primary">Role-based learning tracks</p>
        <h2 className="section-title mt-5 max-w-4xl">One program. Different professional destinations.</h2>
        <div className="mt-12 grid gap-px border bg-border md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((t, i) => (
            <article key={t.name} className="interactive-panel bg-card p-7">
              <span className="data-label text-sm text-primary">0{i + 1}</span>
              <h3 className="mt-10 text-2xl font-semibold">{t.name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{t.description}</p>
              <div className="mt-7 border-t pt-5 text-xs font-semibold">{t.roles.slice(0, 3).join(' · ')} + more</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Portfolio                                                           */
/* ------------------------------------------------------------------ */
function Portfolio() {
  return (
    <section className="dark-grid bg-ink py-20 text-primary-foreground lg:py-28">
      <div className="section-wrap grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <p className="eyebrow text-signal">Professional portfolio</p>
          <h2 className="section-title mt-5">Leave with evidence of how you think and build.</h2>
          <p className="mt-5 max-w-xl text-primary-foreground/65">Your final portfolio brings technical work and enterprise communication together for your target role.</p>
        </div>
        <div className="grid gap-px border hairline bg-line sm:grid-cols-2">
          {[['01', 'Industry AI project'], ['02', 'Architecture diagram'], ['03', 'Business case'], ['04', 'Technical documentation'], ['05', 'Implementation roadmap'], ['06', 'Executive presentation']].map(([n, x]) => (
            <div key={x} className="bg-ink-soft p-6">
              <span className="text-xs text-signal">{n}</span>
              <p className="mt-8 font-display text-lg font-semibold">{x}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="section-wrap mt-16 grid gap-px border-y hairline bg-line sm:grid-cols-4">
        {['Learn', 'Build', 'Apply', 'Present'].map((x, i) => (
          <div key={x} className="bg-ink py-6 text-center">
            <span className="text-xs text-signal">0{i + 1}</span>
            <p className="mt-1 font-display text-xl font-semibold">{x}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Project advisor — local recommender over the curriculum dataset     */
/* (the Lovable version called a server AI function; this matches      */
/*  keyword overlap against real program projects instead)             */
/* ------------------------------------------------------------------ */
const ALL_ROLES = tracks.flatMap((t) => t.roles);

function recommendProject(industryName, desiredRole, experience) {
  const industry = industries.find((i) => i.name === industryName) ?? industries[0];
  const words = experience.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
  let best = industry.projects[0];
  let bestScore = -1;
  for (const p of industry.projects) {
    const hay = `${p.title} ${p.problem} ${p.solution} ${p.technologies.join(' ')} ${p.roles.join(' ')}`.toLowerCase();
    const score = words.filter((w) => hay.includes(w)).length;
    if (score > bestScore) { best = p; bestScore = score; }
  }
  const track = tracks.find((t) => t.roles.includes(desiredRole));
  return {
    title: best.title,
    summary: best.solution,
    businessProblem: best.problem,
    architecture: best.architecture.split(' → '),
    technologies: best.technologies,
    deliverables: track?.deliverables ?? ['Working project', 'Architecture diagram', 'Business case'],
    note: best.note || '',
    whyItFits: `Your ${industryName} background maps directly onto this project's problem space. Completed well, it demonstrates ${best.roles.slice(0, 2).join(' and ')} capability — concrete evidence for a ${desiredRole} transition.`,
  };
}

function ProjectAdvisor() {
  const [industry, setIndustry] = useState(industries[0]?.name ?? '');
  const [role, setRole] = useState(ALL_ROLES[0] ?? '');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rec, setRec] = useState(null);

  function submit(e) {
    e.preventDefault();
    if (experience.trim().length < 10) return setError('Please describe your experience in a sentence or two.');
    setLoading(true); setError(''); setRec(null);
    // Small delay so the matching state is perceivable
    setTimeout(() => {
      setRec(recommendProject(industry, role, experience));
      setLoading(false);
    }, 700);
  }

  return (
    <section id="project-advisor" className="section-divider bg-background py-20 lg:py-28">
      <div className="section-wrap grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="eyebrow text-primary">AI project advisor</p>
          <h2 className="section-title mt-5">Find the portfolio project that fits your transition.</h2>
          <p className="mt-5 max-w-xl text-muted-foreground">Share your industry, experience, and target AI role. The advisor suggests a portfolio project you could build during the program.</p>
          <form onSubmit={submit} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">Industry
              <select className={SELECT_CLS} value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {industries.map((i) => <option key={i.name}>{i.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">Desired AI role
              <select className={SELECT_CLS} value={role} onChange={(e) => setRole(e.target.value)}>
                {ALL_ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">Professional experience
              <textarea rows={4} maxLength={1500} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 9 years as a business analyst in retail banking, working on loan origination workflows." className={`${FIELD_CLS} py-2`} />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={loading} className={btn('default', 'default', 'h-11 w-fit gap-2')}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? 'Designing your project…' : 'Recommend a project'}
            </button>
          </form>
        </div>

        <div className="border bg-card p-6 lg:p-8">
          {!rec && !loading && <p className="text-sm text-muted-foreground">Your recommended project will appear here.</p>}
          {loading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Matching your experience to an industry problem…</p>}
          {rec && (
            <div className="grid gap-6">
              <div>
                <p className="eyebrow text-primary">Recommended project</p>
                <h3 className="mt-3 font-display text-2xl font-semibold">{rec.title}</h3>
                <p className="mt-3 text-muted-foreground">{rec.summary}</p>
                {rec.note && <p className="mt-3 border-l-2 border-primary bg-accent px-4 py-3 text-xs font-semibold text-accent-foreground">{rec.note}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business problem</p>
                <p className="mt-2 text-sm">{rec.businessProblem}</p>
              </div>
              {rec.architecture.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Architecture</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {rec.architecture.map((s, i) => (
                      <span key={i} className="flex items-center gap-2 text-sm">
                        <span className="border px-2 py-1">{s}</span>
                        {i < rec.architecture.length - 1 && <ChevronRight className="size-4 text-primary" />}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {rec.technologies.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Technologies</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rec.technologies.map((t) => <span key={t} className="bg-secondary px-2 py-1 text-xs">{t}</span>)}
                  </div>
                </div>
              )}
              {rec.deliverables.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portfolio deliverables</p>
                  <ul className="mt-2 list-disc pl-5 text-sm">{rec.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
                </div>
              )}
              <div className="border-l-2 border-primary pl-4 text-sm text-muted-foreground">{rec.whyItFits}</div>
              <p className="text-xs text-muted-foreground">Suggestion for educational planning. It does not guarantee admission, employment, or career outcomes.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Application form — posts to our backend /api/applications           */
/* ------------------------------------------------------------------ */
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
