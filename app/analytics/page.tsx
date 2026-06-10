"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Panel, StatCard } from "@/components/AppShell";
import { getData, requireRole } from "@/lib/demoStore";
import type { AppData, User } from "@/lib/types";

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    const auth = requireRole(["student", "professor", "admin"]);
    if (auth.redirect) {
      router.replace(auth.redirect);
      return;
    }
    setUser(auth.user);
    setData(getData());
  }, [router]);

  const rows = useMemo(() => {
    if (!user || !data) return [];
    if (user.role === "student") return data.analytics.filter((item) => item.student_id === user.id);
    if (user.role === "admin") return data.analytics;
    const courseIds = data.courses.filter((course) => course.professor_id === user.id).map((course) => course.id);
    return data.analytics.filter((item) => courseIds.includes(item.course_id));
  }, [data, user]);

  if (!user || !data) return null;

  const average = Math.round(rows.reduce((total, item) => total + item.average_score, 0) / Math.max(rows.length, 1));
  const weakTopicCount = new Set(rows.flatMap((item) => item.weak_topics)).size;

  return (
    <AppShell user={user} title="Learning Analytics" subtitle="Weak topics, score trends, and recommendations for revision planning.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Average score" value={`${average}%`} helper="Across visible analytics" />
        <StatCard label="Weak topics" value={weakTopicCount} helper="Unique improvement areas" />
        <StatCard label="Reports" value={rows.length} helper="Generated analytics records" />
      </div>

      <Panel title="Performance Chart">
        <div className="space-y-4">
          {rows.map((item) => {
            const student = data.users.find((userItem) => userItem.id === item.student_id);
            const course = data.courses.find((courseItem) => courseItem.id === item.course_id);
            return (
              <div key={item.id}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium">{student?.name} · {course?.title}</span>
                  <span>{item.average_score}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-cyan-500" style={{ width: `${Math.min(item.average_score, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Recommendations">
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((item) => {
            const course = data.courses.find((courseItem) => courseItem.id === item.course_id);
            return (
              <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold">{course?.title}</p>
                <p className="mt-2 text-sm text-slate-600">Weak topics: {item.weak_topics.join(", ") || "None"}</p>
                <p className="mt-2 text-sm text-slate-700">{item.recommendation}</p>
              </div>
            );
          })}
        </div>
      </Panel>
    </AppShell>
  );
}
