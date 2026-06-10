"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, ClipboardCheck, Download, ServerCog, Users } from "lucide-react";
import { ActionCard, AppShell, Panel, StatCard } from "@/components/AppShell";
import { getData, requireRole, systemHealth } from "@/lib/demoStore";
import type { AppData, User } from "@/lib/types";

type HealthCapability = {
  name: string;
  status: "Ready" | "Configured" | "Needs setup";
  detail: string;
};

type HealthSnapshot = {
  status: string;
  generated_at: string;
  capabilities: HealthCapability[];
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [healthSnapshot, setHealthSnapshot] = useState<HealthSnapshot | null>(null);

  useEffect(() => {
    const auth = requireRole(["admin"]);
    if (auth.redirect) {
      router.replace(auth.redirect);
      return;
    }
    setUser(auth.user);
    setData(getData());

    fetch("/api/health", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: HealthSnapshot | null) => setHealthSnapshot(payload))
      .catch(() => setHealthSnapshot(null));
  }, [router]);

  const model = useMemo(() => {
    if (!data) return null;
    const health = systemHealth(data);
    return {
      health,
      students: data.users.filter((item) => item.role === "student").length,
      professors: data.users.filter((item) => item.role === "professor").length,
      departments: Array.from(new Set(data.users.map((item) => item.department))).length,
    };
  }, [data]);

  if (!user || !data || !model) return null;

  return (
    <AppShell user={user} title="Admin Dashboard" subtitle="Manage users, departments, academic activity, and platform health.">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total users" value={data.users.length} helper="All roles" />
        <StatCard label="Students" value={model.students} helper="Registered learners" />
        <StatCard label="Professors" value={model.professors} helper="Teaching staff" />
        <StatCard label="Courses" value={data.courses.length} helper={`${model.departments} departments`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="System Health" eyebrow="operations">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between rounded-lg border border-primary-fixed-dim/20 bg-primary-fixed-dim/10 p-4 text-primary-fixed-dim">
              <span>Status</span>
              <strong>{healthSnapshot?.status || model.health.status}</strong>
            </div>
            <div className="flex justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <span>Database</span>
              <strong>{model.health.database}</strong>
            </div>
            <div className="flex justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <span>AI</span>
              <strong>{model.health.ai}</strong>
            </div>
          </div>
        </Panel>

        <Panel title="Admin Controls" eyebrow="workspace">
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionCard href="/admin/users" title="User management" description="Assign roles, departments, and platform access." icon={<Users size={18} />} />
            <ActionCard href="/integrity" title="Integrity reports" description="Admin and teachers monitor risk scoring and suspicious activity." icon={<Activity size={18} />} />
            <ActionCard href="/monitor" title="Monitor installer" description="Download the Windows desktop client used during live quiz sessions." icon={<Download size={18} />} />
            <ActionCard href="/analytics" title="Academic reports" description="Review course-level outcomes and weak topics." icon={<BarChart3 size={18} />} />
            <ActionCard href="/results" title="Submissions" description="Audit grades, feedback, and submission records." icon={<ClipboardCheck size={18} />} />
          </div>
        </Panel>
      </div>

      <Panel
        title="System Activity Logs"
        eyebrow="audit trail"
        action={<Link className="secondary-button px-3 py-2 text-sm" href="/integrity">Open integrity center</Link>}
      >
        <div className="overflow-x-auto">
          <table className="premium-table min-w-[720px] text-left text-sm">
            <thead>
              <tr>
                <th className="py-3">User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.activity_logs.slice(0, 10).map((log) => {
                const actor = data.users.find((item) => item.id === log.user_id);
                return (
                  <tr key={log.id} className="border-t border-slate-100">
                    <td className="py-3 font-medium">{actor?.name || "System"}</td>
                    <td className="capitalize">{actor?.role || "system"}</td>
                    <td>{log.action}</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {healthSnapshot && (
        <Panel title="Platform Readiness" eyebrow="deployment checks">
          <div className="grid gap-3 md:grid-cols-2">
            {healthSnapshot.capabilities.map((item) => (
              <div key={item.name} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-fixed-dim/10 text-primary-fixed-dim">
                      <ServerCog size={17} />
                    </span>
                    <p className="font-semibold">{item.name}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "Needs setup"
                        ? "bg-amber-400/10 text-amber-300"
                        : "bg-cyan-300/10 text-cyan-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-on-surface-variant">{item.detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </AppShell>
  );
}
