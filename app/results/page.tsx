"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { getData, gradeLabel, requireRole } from "@/lib/demoStore";
import type { AppData, User } from "@/lib/types";

export default function ResultsPage() {
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

  const submissions = useMemo(() => {
    if (!user || !data) return [];
    if (user.role === "student") return data.submissions.filter((item) => item.student_id === user.id);
    if (user.role === "admin") return data.submissions;
    const courses = data.courses.filter((course) => course.professor_id === user.id);
    const professorJoinCodes = courses.map((course) => course.join_code);
    const relatedCourseIds = data.courses
      .filter((course) => course.professor_id === user.id || professorJoinCodes.includes(course.join_code))
      .map((course) => course.id);
    const quizIds = data.quizzes.filter((quiz) => relatedCourseIds.includes(quiz.course_id)).map((quiz) => quiz.id);
    return data.submissions.filter((item) => quizIds.includes(item.quiz_id));
  }, [data, user]);

  if (!user || !data) return null;

  return (
    <AppShell user={user} title="Results" subtitle="Review scores, AI feedback, and submission history.">
      <Panel title="Submissions">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-3">Student</th>
                <th>Quiz</th>
                <th>Course</th>
                <th>Score</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => {
                const quiz = data.quizzes.find((item) => item.id === submission.quiz_id);
                const course = data.courses.find((item) => item.id === quiz?.course_id);
                const student = data.users.find((item) => item.id === submission.student_id);
                return (
                  <tr key={submission.id} className="border-t border-slate-100">
                    <td className="py-3 font-medium">{student?.name}</td>
                    <td>{quiz?.title}</td>
                    <td>{course?.title}</td>
                    <td>{gradeLabel(submission.score, quiz?.total_marks || 0)}</td>
                    <td>{new Date(submission.submitted_at).toLocaleString()}</td>
                    <td><Link className="font-semibold underline" href={`/results/${submission.id}`}>Open</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
