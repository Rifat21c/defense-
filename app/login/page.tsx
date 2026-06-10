"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { login, routeForRole } from "@/lib/demoStore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const result = login(email, password);

    if (!result.user) {
      setError(result.error);
      return;
    }

    router.push(routeForRole(result.user.role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-on-surface">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-white/10 bg-surface/70 shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="aura-card flex flex-col justify-between p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-container text-background shadow-glow">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="mt-6 font-label text-sm font-semibold uppercase tracking-[0.25em] text-primary-fixed-dim">AssessNova AI</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Welcome back.</h1>
            <p className="mt-4 max-w-md leading-7 text-on-surface-variant">
              Sign in to access protected assessment dashboards, academic analytics, and integrity review tools.
            </p>
          </div>

          <div className="mt-10 grid gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed-dim/10 text-primary-fixed-dim">
                  <UserCheck size={18} />
                </span>
                <div>
                  <p className="font-semibold">Role-aware access</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Students, faculty, and administrators enter their own workspace.</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <LockKeyhole size={18} />
                </span>
                <div>
                  <p className="font-semibold">Protected sessions</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Assessment activity remains tied to verified account access.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleLogin} className="flex flex-col justify-center p-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 font-label text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            <Sparkles size={15} />
            Secure role access
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Enter your account credentials to continue.</p>

          {error && <p className="mt-5 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">{error}</p>}

          <label className="mt-6 block text-sm font-medium text-on-surface-variant">Email</label>
          <input
            className="premium-input mt-2 w-full rounded-lg p-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="name@example.edu"
            autoComplete="email"
            required
          />

          <label className="mt-4 block text-sm font-medium text-on-surface-variant">Password</label>
          <input
            className="premium-input mt-2 w-full rounded-lg p-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />

          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container p-3 font-bold text-background shadow-glow transition hover:brightness-110">
            Sign in
            <ArrowRight size={18} />
          </button>

          <p className="mt-5 text-sm text-on-surface-variant">
            No account? <Link className="font-semibold underline" href="/register">Create one</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
