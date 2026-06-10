"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Panel, RiskBadge, StatCard } from "@/components/AppShell";
import { getData, getIntegritySummary, requireRole } from "@/lib/demoStore";
import { eventLabel, riskLevel } from "@/lib/risk";
import type { AppData, IntegrityLog, RiskLevel, User } from "@/lib/types";

type LiveSession = {
  id: string;
  quiz_id: string;
  quiz_title: string;
  student_id: string;
  student_name: string;
  started_at: string;
  last_seen_at: string;
  active: boolean;
  events: number;
  risk_points_total: number;
  risk: RiskLevel;
};

type MonitorSnapshot = {
  sessions: LiveSession[];
  logs: IntegrityLog[];
};

export default function IntegrityReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [live, setLive] = useState<MonitorSnapshot>({ sessions: [], logs: [] });

  useEffect(() => {
    const auth = requireRole(["professor", "admin"]);
    if (auth.redirect) {
      router.replace(auth.redirect);
      return;
    }
    setUser(auth.user);
    setData(getData());

    async function refreshLive() {
      try {
        const currentUser = getData().users.find((item) => item.id === auth.user?.id);
        const response = await fetch("/api/monitor/logs", {
          cache: "no-store",
          headers: {
            "x-assessnova-role": currentUser?.role || "",
          },
        });
        if (response.ok) setLive((await response.json()) as MonitorSnapshot);
      } catch {
        setLive({ sessions: [], logs: [] });
      }
    }

    refreshLive();
    const timer = window.setInterval(refreshLive, 3000);
    return () => window.clearInterval(timer);
  }, [router]);

  const reports = useMemo(() => {
    if (!user || !data) return [];
    const submissions =
      user.role === "admin"
        ? data.submissions
        : data.submissions.filter((submission) => {
            const quiz = data.quizzes.find((item) => item.id === submission.quiz_id);
            const course = data.courses.find((item) => item.id === quiz?.course_id);
            const professorJoinCodes = data.courses
              .filter((courseItem) => courseItem.professor_id === user.id)
              .map((courseItem) => courseItem.join_code);
            return course?.professor_id === user.id || professorJoinCodes.includes(course?.join_code || "");
          });

    return submissions.map((submission) => {
      const localSummary = getIntegritySummary(submission.quiz_id, submission.student_id);
      const liveLogs = live.logs.filter(
        (log) => log.quiz_id === submission.quiz_id && log.student_id === submission.student_id,
      );
      const points =
        localSummary.points + liveLogs.reduce((total, log) => total + log.risk_points, 0);

      return {
        submission,
        summary: {
          logs: [...localSummary.logs, ...liveLogs],
          points,
          risk: riskLevel(points),
          integrityScore: Math.max(0, 100 - points * 8),
        },
      };
    });
  }, [data, live.logs, user]);

  if (!user || !data) return null;

  const combinedLogs = [...data.integrity_logs, ...live.logs];
  const highRisk = reports.filter((item) => item.summary.risk === "High").length;
  const mediumRisk = reports.filter((item) => item.summary.risk === "Medium").length;
  const activeSessions = live.sessions.filter((session) => session.active);

  return (
    <AppShell
      user={user}
      title="Integrity Reports"
      subtitle="Professor and admin-only monitoring for student exam integrity signals. No webcam, biometrics, microphone, or screen recording."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Reports" value={reports.length} helper="Submitted quizzes" />
        <StatCard label="High risk" value={highRisk} helper="Needs review" />
        <StatCard label="Live sessions" value={activeSessions.length} helper="Desktop client bridge" />
        <StatCard label="Events" value={combinedLogs.length} helper="Recorded signals" />
      </div>

      <Panel
        title="Live Monitoring"
        action={
          <a className="secondary-button px-3 py-2 text-sm" href="/api/downloads/monitor">
            Download monitor installer
          </a>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-3">Student</th>
                <th>Exam</th>
                <th>Status</th>
                <th>Events</th>
                <th>Risk points</th>
                <th>Risk</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {live.sessions.map((session) => (
                <tr key={session.id} className="border-t border-slate-100">
                  <td className="py-3 font-medium">{session.student_name}</td>
                  <td>{session.quiz_title}</td>
                  <td>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        session.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {session.active ? "Active" : "Ended"}
                    </span>
                  </td>
                  <td>{session.events}</td>
                  <td>{session.risk_points_total}</td>
                  <td><RiskBadge risk={session.risk} /></td>
                  <td>{new Date(session.last_seen_at).toLocaleTimeString()}</td>
                </tr>
              ))}
              {live.sessions.length === 0 && (
                <tr>
                  <td className="py-4 text-slate-600" colSpan={7}>
                    No active desktop monitoring sessions yet. A student must start a quiz and sign into AssessNova Monitor; professors/admins review the session here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Suspicious Activity">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-3">Student</th>
                <th>Quiz</th>
                <th>Events</th>
                <th>Risk points</th>
                <th>Integrity score</th>
                <th>Risk level</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(({ submission, summary }) => {
                const student = data.users.find((item) => item.id === submission.student_id);
                const quiz = data.quizzes.find((item) => item.id === submission.quiz_id);
                return (
                  <tr key={submission.id} className="border-t border-slate-100">
                    <td className="py-3 font-medium">{student?.name}</td>
                    <td>{quiz?.title}</td>
                    <td>{summary.logs.length}</td>
                    <td>{summary.points}</td>
                    <td>{summary.integrityScore}/100</td>
                    <td><RiskBadge risk={summary.risk} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Event Log">
        <div className="grid gap-3 md:grid-cols-2">
          {combinedLogs.map((log) => {
            const student = data.users.find((item) => item.id === log.student_id);
            const quiz = data.quizzes.find((item) => item.id === log.quiz_id);
            return (
              <div key={log.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{eventLabel(log.event_type)}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {student?.name || log.student_id} / {quiz?.title || log.quiz_id}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                    {log.source || "web"}
                  </span>
                </div>
                {log.details && <p className="mt-2 text-sm text-slate-600">{log.details}</p>}
                <p className="mt-2 text-sm text-slate-500">
                  {log.risk_points} risk points / {new Date(log.event_time).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </Panel>
    </AppShell>
  );
}
