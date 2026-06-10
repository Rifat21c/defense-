"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  ClipboardList,
  Database,
  Download,
  FileSearch,
  GraduationCap,
  Home,
  LogOut,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { logout, resetDemoData } from "@/lib/demoStore";
import type { Role, User } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
};

const navItems: NavItem[] = [
  { href: "/student", label: "Student", icon: <Home size={18} />, roles: ["student"] },
  { href: "/professor", label: "Professor", icon: <GraduationCap size={18} />, roles: ["professor"] },
  { href: "/admin", label: "Admin", icon: <ShieldCheck size={18} />, roles: ["admin"] },
  { href: "/analytics", label: "Analytics", icon: <BarChart3 size={18} />, roles: ["student", "professor", "admin"] },
  { href: "/integrity", label: "Integrity", icon: <Activity size={18} />, roles: ["professor", "admin"] },
  { href: "/monitor", label: "Monitor", icon: <Download size={18} />, roles: ["student", "professor", "admin"] },
  { href: "/admin/users", label: "Users", icon: <Users size={18} />, roles: ["admin"] },
  { href: "/results", label: "Results", icon: <ClipboardList size={18} />, roles: ["student", "professor", "admin"] },
];

export function AppShell({
  user,
  title,
  subtitle,
  children,
}: {
  user: User;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function handleReset() {
    resetDemoData();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_16%_18%,rgba(0,219,233,0.08),transparent_28rem),radial-gradient(circle_at_88%_14%,rgba(87,27,193,0.1),transparent_30rem)]" />

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/10 bg-surface/70 px-5 py-6 shadow-2xl shadow-black/20 backdrop-blur-xl lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-container text-background shadow-glow">
            <ShieldCheck size={22} />
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight text-primary-container">AssessNova AI</span>
            <span className="font-label text-xs uppercase tracking-[0.24em] text-on-surface-variant/70">
              Premium Integrity
            </span>
          </span>
        </Link>

        <div className="aura-card mt-8 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-primary-fixed-dim">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="mt-1 text-xs capitalize text-on-surface-variant">{user.role} / {user.department}</p>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[94%] rounded-full bg-primary-fixed-dim shadow-glow" />
          </div>
          <p className="mt-2 font-label text-[11px] uppercase tracking-[0.18em] text-primary-fixed-dim">
            Integrity health 94.8%
          </p>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg border-l-2 px-4 py-3 font-label text-sm font-medium transition ${
                  active
                    ? "border-primary-fixed-dim bg-white/10 text-primary-fixed-dim shadow-[inset_0_0_24px_rgba(0,219,233,0.06)]"
                    : "border-transparent text-on-surface-variant/75 hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/5 pt-5">
          <Link
            href={user.role === "student" ? "/student" : user.role === "professor" ? "/professor" : "/admin"}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-3 font-label text-sm font-bold text-background shadow-glow transition hover:brightness-110"
          >
            <Plus size={17} />
            New Analysis
          </Link>
          <button
            onClick={handleReset}
            className="flex w-full items-center gap-3 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
          >
            <RotateCcw size={17} />
            Reset workspace data
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg bg-white/5 px-4 py-3 text-sm font-medium text-on-surface hover:bg-white/10"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-white/5 bg-surface/55 px-5 py-4 backdrop-blur-xl lg:px-8">
          <div className="mx-auto flex max-w-container-max items-center justify-between gap-4">
            <div>
              <p className="font-label text-xs font-semibold uppercase tracking-[0.24em] text-primary-fixed-dim">
                Live Academic OS
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-on-surface">{title}</h1>
              {subtitle && <p className="mt-1 max-w-3xl text-sm text-on-surface-variant">{subtitle}</p>}
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="glass-card flex items-center gap-2 rounded-full px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-primary-fixed-dim shadow-glow" />
                <span className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-primary-fixed-dim">
                  Operational
                </span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={16} />
                <input className="premium-input h-10 w-56 rounded-full pl-9 pr-4 text-sm" placeholder="Search logs..." />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-on-surface-variant lg:hidden"
            >
              Logout
            </button>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${
                  pathname === item.href
                    ? "border-primary-fixed-dim bg-primary-fixed-dim/10 text-primary-fixed-dim"
                    : "border-white/10 text-on-surface-variant"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-container-max px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="glass-card group rounded-lg p-5 transition hover:-translate-y-0.5 hover:border-primary-fixed-dim/35">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-label text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant/75">{label}</p>
        <Database size={17} className="text-primary-fixed-dim/70" />
      </div>
      <p className="text-3xl font-bold tracking-tight text-primary">{value}</p>
      {helper && <p className="mt-2 text-sm text-on-surface-variant">{helper}</p>}
    </div>
  );
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card mt-6 rounded-lg p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow && (
            <p className="font-label text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-fixed-dim/80">
              {eyebrow}
            </p>
          )}
          <h2 className="text-lg font-semibold tracking-tight text-on-surface">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-primary-fixed-dim/45 hover:bg-white/[0.06]"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed-dim/10 text-primary-fixed-dim transition group-hover:bg-primary-fixed-dim/15">
        {icon}
      </div>
      <p className="font-semibold text-on-surface">{title}</p>
      <p className="mt-1 text-sm leading-6 text-on-surface-variant">{description}</p>
    </Link>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-6 text-center">
      <FileSearch className="mx-auto text-primary-fixed-dim/70" size={28} />
      <p className="mt-3 font-semibold text-on-surface">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-on-surface-variant">{text}</p>
    </div>
  );
}

export function RiskBadge({ risk }: { risk: "Low" | "Medium" | "High" }) {
  const styles = {
    Low: "bg-cyan-300/10 text-primary-fixed-dim ring-primary-fixed-dim/25",
    Medium: "bg-secondary/10 text-secondary ring-secondary/25",
    High: "bg-error/10 text-error ring-error/25",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles[risk]}`}>
      {risk}
    </span>
  );
}
