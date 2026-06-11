import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, CheckCircle2, Download, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {
    icon: <ShieldCheck size={28} />,
    title: "Teacher/Admin Monitoring",
    text: "Students are monitored during exams; professors and administrators review privacy-friendly integrity reports.",
  },
  {
    icon: <BarChart3 size={28} />,
    title: "Smart Analytics",
    text: "Course-level trends, weak-topic detection, and operational dashboards for every academic role.",
  },
  {
    icon: <BrainCircuit size={28} />,
    title: "Nova Feedback",
    text: "AI-assisted recommendations that help students revise without replacing original academic work.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-on-surface">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-surface/50 px-5 py-4 backdrop-blur-xl lg:px-10">
        <div className="mx-auto flex max-w-container-max items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-background shadow-glow">
              <ShieldCheck size={21} />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight text-primary-container">AssessNova AI</span>
              <span className="font-label text-[11px] uppercase tracking-[0.24em] text-on-surface-variant/70">
                Premium Integrity
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="/api/downloads/monitor" className="hidden items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-on-surface-variant transition hover:text-on-surface sm:inline-flex">
              <Download size={16} />
              Download monitor
            </a>
            <Link href="/login" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-on-surface-variant transition hover:text-on-surface">
              Log in
            </Link>
            <Link href="/register" className="rounded-lg bg-primary-container px-4 py-2 text-sm font-bold text-background shadow-glow">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[820px] max-w-container-max items-center gap-12 px-5 pb-20 pt-32 lg:grid-cols-[1.02fr_0.98fr] lg:px-10">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 font-label text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            <Sparkles size={16} />
            Integrity monitoring module live
          </div>
          <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Preserve academic <span className="text-gradient-premium">excellence</span> through advanced AI.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-on-surface-variant">
            AssessNova brings AI grading, learning analytics, and professor/admin integrity review into one polished platform for universities and coaching centers.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-6 py-4 font-bold text-background shadow-glow transition hover:brightness-110">
              Open platform
              <ArrowRight size={18} />
            </Link>
            <Link href="/register" className="rounded-lg border border-white/10 bg-white/5 px-6 py-4 font-bold text-primary transition hover:bg-white/10">
              Create account
            </Link>
            <a href="/api/downloads/monitor" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-4 font-bold text-on-surface transition hover:bg-white/10">
              <Download size={18} />
              Download monitor
            </a>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="glass-card relative overflow-hidden rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label text-xs uppercase tracking-[0.22em] text-on-surface-variant">Integrity Score</p>
                <p className="mt-3 text-6xl font-bold tracking-tight">98.4<span className="text-2xl text-primary-fixed-dim">%</span></p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-primary-fixed-dim/25 bg-primary-fixed-dim/10 text-primary-fixed-dim">
                <BarChart3 size={28} />
              </div>
            </div>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[98%] rounded-full bg-primary-fixed-dim shadow-glow" />
            </div>
            <div className="mt-3 flex justify-between text-xs text-on-surface-variant">
              <span>Risk level: minimal</span>
              <span>Threshold: 85%</span>
            </div>

            <div className="mt-8 grid grid-cols-7 items-end gap-3 border-t border-white/5 pt-8">
              {[60, 45, 82, 96, 72, 55, 84].map((height, index) => (
                <div key={index} className="rounded-t bg-primary-fixed-dim/25 transition hover:bg-primary-fixed-dim/50" style={{ height }} />
              ))}
            </div>
          </div>

          <div className="aura-card absolute -bottom-12 -left-8 w-56 rounded-lg p-4 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <BrainCircuit size={20} className="text-secondary" />
              <span className="font-label text-sm font-semibold">Nova Pulse</span>
            </div>
            <div className="space-y-2">
              {["Citation health", "Focus stability", "Originality"].map((label, index) => (
                <div key={label} className="flex items-center gap-3">
                  <CheckCircle2 size={15} className={index === 1 ? "text-secondary" : "text-primary-fixed-dim"} />
                  <span className="text-xs text-on-surface-variant">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-container-max px-5 py-20 lg:px-10">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Precision engineering for <span className="text-primary-fixed-dim">academic integrity</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-on-surface-variant">
            A modular ecosystem for assessments, course operations, AI feedback, and live integrity review.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="glass-card rounded-lg p-7 transition hover:-translate-y-1 hover:border-primary-fixed-dim/40">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-fixed-dim/10 text-primary-fixed-dim">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="glass-card rounded-lg p-10 text-center">
          <GraduationCap className="mx-auto mb-5 text-primary-fixed-dim" size={34} />
          <h2 className="text-3xl font-bold tracking-tight">Ready to upgrade your assessment standards?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-on-surface-variant">
            Use the seeded role accounts to explore student, professor, and administrator workflows.
          </p>
          <Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary-container px-6 py-4 font-bold text-background shadow-glow">
            Enter command center
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
