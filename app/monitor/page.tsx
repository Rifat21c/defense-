import Link from "next/link";
import { ArrowLeft, Download, MonitorDown, ShieldCheck } from "lucide-react";

const monitorBackendUrl = "https://assessnova-ai-starter.vercel.app";

export default function MonitorDownloadPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-on-surface lg:px-10">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-background shadow-glow">
              <ShieldCheck size={21} />
            </span>
            <span className="font-bold text-primary-container">AssessNova AI</span>
          </Link>
          <Link href="/login" className="secondary-button px-4 py-2 text-sm">
            Open platform
          </Link>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-card rounded-lg p-7">
            <p className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-primary-fixed-dim">
              Windows client
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">AssessNova Monitor</h1>
            <p className="mt-4 leading-7 text-on-surface-variant">
              Desktop integrity client for live quiz sessions, browser activity signals, blocked app detection, and professor/admin review.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="/api/downloads/monitor"
                className="premium-button inline-flex items-center gap-2 px-5 py-3"
              >
                <Download size={18} />
                Download installer
              </a>
              <Link href="/" className="secondary-button inline-flex items-center gap-2 px-5 py-3">
                <ArrowLeft size={18} />
                Back
              </Link>
            </div>
          </div>

          <div className="glass-card rounded-lg p-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-fixed-dim/10 text-primary-fixed-dim">
              <MonitorDown size={26} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Package", "Windows installer"],
                ["Backend", monitorBackendUrl],
                ["Login", "Student account"],
                ["Reports", "Integrity center"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    {label}
                  </p>
                  <p className="mt-2 font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
