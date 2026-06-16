import { Link } from 'react-router-dom';
import DashboardPreview from "../components/DashboardPreview";

const fadeUpClass = 'translate-y-0 opacity-100';

function Icon({ children }) {
  return (
    <span className="grid size-12 place-items-center rounded-xl bg-brand-accent/10 text-xl text-brand-accent">
      {children}
    </span>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="grid size-8 place-items-center rounded-lg bg-brand-accent font-bold text-white shadow-lg shadow-brand-accent/30">
        S
      </div>
      <span className="font-display text-xl font-semibold tracking-tight">SmartNotes AI</span>
    </Link>
  );
}

function ArrowIcon() {
  return <span className="transition-transform group-hover:translate-x-0.5">→</span>;
}

export default function Landing() {
  return (
    <div className="min-h-dvh bg-brand-bg text-foreground selection:bg-brand-accent/30">
      <nav className="nav-blur fixed top-0 z-50 w-full border-b border-brand-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <div className="hidden items-center gap-8 text-sm font-medium text-brand-muted md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-brand-muted transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all hover:scale-[1.02] active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="px-6 pt-40 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="landing-fade mb-6 inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs font-semibold text-brand-accent">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-accent opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-accent" />
            </span>
            New: PDF Intelligence v2.0
          </div>

          <h1 className="landing-fade font-display mb-8 text-5xl leading-[1.05] font-bold tracking-tight text-balance md:text-7xl">
            Your Notes. Your PDFs.
            <br />
            <span className="bg-linear-to-r from-brand-accent to-violet-300 bg-clip-text text-transparent">
              Your AI Assistant.
            </span>
          </h1>

          <p className="landing-fade mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-brand-muted md:text-xl">
            Upload notes and documents, ask complex questions, generate summaries, and study
            smarter with AI-powered retrieval.
          </p>

          <div className="landing-fade flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-accent px-8 py-4 font-semibold text-white shadow-lg shadow-brand-accent/20 transition-all hover:scale-[1.02] active:scale-95 sm:w-auto"
            >
              Start Free
              <ArrowIcon />
            </Link>
            <a
              href="#how"
              className="w-full rounded-xl border border-brand-border bg-brand-surface px-8 py-4 font-semibold transition-all hover:border-brand-muted sm:w-auto"
            >
              Watch Demo
            </a>
          </div>
        </div>
        <div className="landing-fade mx-auto mt-20 max-w-6xl">
          <DashboardPreview />
        </div>
      </section>

      <section id="features" className="border-t border-brand-border px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className={`${fadeUpClass} mx-auto mb-16 max-w-2xl text-center`}>
            <h2 className="font-display mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Everything you need to learn faster.
            </h2>
            <p className="text-brand-muted">
              A focused workspace designed around the way real students and researchers think.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: '✦',
                title: 'AI Chat',
                desc: 'Ask nuanced questions about your notes and get instant, context-aware answers.',
              },
              {
                icon: 'N',
                title: 'Smart Notes',
                desc: 'Rich editing with auto-save and intelligent organization out of the box.',
              },
              {
                icon: 'P',
                title: 'PDF Intelligence',
                desc: 'Upload research papers and chat with their contents using advanced RAG.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card group rounded-2xl p-8 transition-all hover:-translate-y-1 hover:border-brand-accent/50"
              >
                <div className="mb-6">
                  <Icon>{feature.icon}</Icon>
                </div>
                <h3 className="font-display mb-3 text-xl font-bold">{feature.title}</h3>
                <p className="leading-relaxed text-brand-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how"
        className="overflow-hidden border-y border-brand-border bg-brand-surface/50 px-6 py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-display mb-6 text-4xl font-bold tracking-tight">
              The command center for knowledge.
            </h2>
            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Create notes or upload PDFs',
                  desc: 'Drag, drop, write - your library grows with you.',
                },
                {
                  step: '02',
                  title: 'AI retrieves relevant content',
                  desc: 'Embeddings pull the exact passages your question needs.',
                },
                {
                  step: '03',
                  title: 'Gemini generates contextual answers',
                  desc: 'Responses are grounded in your sources, not the open web.',
                },
              ].map((step) => (
                <div
                  key={step.step}
                  className="rounded-xl border border-brand-border p-4 transition-colors hover:border-brand-accent/40"
                >
                  <div className="mb-1 flex items-center gap-3">
                    <span className="font-display text-xs font-bold tracking-widest text-brand-accent">
                      {step.step}
                    </span>
                    <h4 className="font-semibold text-foreground">{step.title}</h4>
                  </div>
                  <p className="pl-8 text-sm text-brand-muted">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
  <div className="glass-card rounded-3xl p-8">
    <div className="flex flex-col items-center gap-6">

      <div className="w-full max-w-sm rounded-2xl border border-brand-border bg-brand-bg p-5 text-center">
        <div className="mb-2 text-3xl">📄</div>
        <h3 className="font-semibold">Notes & PDFs</h3>
        <p className="mt-1 text-sm text-brand-muted">
          Upload lecture notes, research papers and documents
        </p>
      </div>

      <div className="text-3xl text-brand-accent animate-bounce">
        ↓
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-brand-accent/30 bg-brand-accent/10 p-5 text-center">
        <div className="mb-2 text-3xl">🧠</div>
        <h3 className="font-semibold">RAG Retrieval Engine</h3>
        <p className="mt-1 text-sm text-brand-muted">
          Finds the most relevant content from your documents
        </p>
      </div>

      <div className="text-3xl text-brand-accent animate-bounce">
        ↓
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-violet-400/30 bg-violet-500/10 p-5 text-center">
        <div className="mb-2 text-3xl">✨</div>
        <h3 className="font-semibold">Gemini AI</h3>
        <p className="mt-1 text-sm text-brand-muted">
          Uses retrieved context to generate grounded answers
        </p>
      </div>

      <div className="text-3xl text-brand-accent animate-bounce">
        ↓
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-center">
        <div className="mb-2 text-3xl">💬</div>
        <h3 className="font-semibold">AI Response</h3>
        <p className="mt-1 text-sm text-brand-muted">
          Answers, summaries and insights based on YOUR data
        </p>
      </div>

    </div>
  </div>
</div>
        </div>
      </section>

      <section id="pricing" className="px-6 py-32">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl p-12 text-center">
          <div className="absolute inset-0 bg-brand-accent/5" />
          <div className="relative z-10">
            <div className="mx-auto mb-4 grid size-10 place-items-center rounded-full bg-brand-accent/10 text-brand-accent">
              ✦
            </div>
            <h2 className="font-display mb-6 text-4xl font-bold tracking-tight md:text-5xl">
              Start learning smarter today.
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-brand-muted">
              Join students and professionals using SmartNotes AI to accelerate their learning.
            </p>
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-2xl bg-foreground px-10 py-5 text-lg font-bold text-background transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95"
            >
              Create your free account
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-brand-border px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <Logo />
          <div className="flex gap-8 text-sm text-brand-muted">
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              Twitter
            </a>
            <a href="https://github.com/AnushkaIndeed/smartnotes-ai" className="hover:text-foreground">
              GitHub
            </a>
          </div>
          <div className="font-mono text-xs text-brand-muted opacity-60">
            © 2026 SMARTNOTES.SYSTEM
          </div>
        </div>
      </footer>
    </div>
  );
}
