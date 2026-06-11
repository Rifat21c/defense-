"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, EmptyState, Panel, StatCard } from "@/components/AppShell";
import { getData, gradeLabel, joinCourse, requireRole, scorePercent } from "@/lib/demoStore";
import type { AppData, User } from "@/lib/types";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const auth = requireRole(["student"]);
    if (auth.redirect) {
      router.replace(auth.redirect);
      return;
    }
    setUser(auth.user);
    setData(getData());
  }, [router]);

  const model = useMemo(() => {
    if (!user || !data) return null;
    const enrollments = data.enrollments.filter((item) => item.student_id === user.id);
    const courseIds = enrollments.map((item) => item.course_id);
    const courses = data.courses.filter((course) => courseIds.includes(course.id));
    const enrolledJoinCodes = courses.map((course) => course.join_code);
    const relatedCourseIds = data.courses
      .filter((course) => courseIds.includes(course.id) || enrolledJoinCodes.includes(course.join_code))
      .map((course) => course.id);
    const availableCourses = data.courses.filter(
      (course) => !relatedCourseIds.includes(course.id) && !enrolledJoinCodes.includes(course.join_code),
    );
    const quizzes = data.quizzes.filter((quiz) => relatedCourseIds.includes(quiz.course_id));
    const submissions = data.submissions.filter((submission) => submission.student_id === user.id);
    const analytics = data.analytics.filter((item) => item.student_id === user.id);
    const average =
      submissions.reduce((total, submission) => {
        const quiz = data.quizzes.find((item) => item.id === submission.quiz_id);
        return total + scorePercent(submission.score, quiz?.total_marks || 0);
      }, 0) / Math.max(submissions.length, 1);

    return { availableCourses, courses, quizzes, submissions, analytics, average: Math.min(100, Math.round(average)) };
  }, [data, user]);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    joinByCode(joinCode);
  }

  function joinByCode(code: string) {
    if (!user) return;
    const result = joinCourse(user.id, code);
    setMessage(result.error || "Course joined successfully.");
    setJoinCode("");
    setData(getData());
  }

  if (!user || !data || !model) return null;

  return (
    <AppShell user={user} title="Student Dashboard" subtitle="Join courses, take assessments, and review AI-powered learning recommendations.">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Enrolled courses" value={model.courses.length} helper="Active learning spaces" />
        <StatCard label="Available quizzes" value={model.quizzes.length} helper="Across your courses" />
        <StatCard label="Completed" value={model.submissions.length} helper="Submitted assessments" />
        <StatCard label="Average score" value={`${model.average}%`} helper="From completed quizzes" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Join Course" eyebrow="enrollment">
          <form onSubmit={handleJoin} className="flex flex-col gap-3 sm:flex-row">
            <input
              className="premium-input min-w-0 flex-1 rounded-lg p-3"
              placeholder="Enter join code, e.g. AI2026"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              required
            />
            <button className="premium-button px-5 py-3">Join</button>
          </form>
          {message && <p className="mt-3 text-sm text-on-surface-variant">{message}</p>}
        </Panel>

        <Panel title="Revision Recommendations" eyebrow="nova feedback">
          <div className="space-y-3">
            {model.analytics.length === 0 && <EmptyState title="No recommendations yet" text="Submit a quiz to generate focused revision guidance." />}
            {model.analytics.map((item) => {
              const course = data.courses.find((courseItem) => courseItem.id === item.course_id);
              return (
                <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-semibold">{course?.title}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Weak topics: {item.weak_topics.join(", ") || "None"}</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface">{item.recommendation}</p>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="My Courses" eyebrow="learning spaces" action={<Link className="secondary-button px-3 py-2 text-sm" href="/analytics">View analytics</Link>}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {model.courses.map((course) => {
            const quizCount = data.quizzes.filter((quiz) => quiz.course_id === course.id).length;
            return (
              <Link key={course.id} href={`/courses/${course.id}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-primary-fixed-dim/45">
                <p className="font-semibold">{course.title}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">{course.description}</p>
                <p className="mt-4 text-sm font-medium text-primary-fixed-dim">{quizCount} quizzes</p>
              </Link>
            );
          })}
          {model.courses.length === 0 && (
            <EmptyState title="No courses joined" text="Use a course join code or pick one from Discover Courses." />
          )}
        </div>
      </Panel>

      <Panel title="Available Quizzes" eyebrow="assessment queue">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {model.quizzes.map((quiz) => {
            const course = data.courses.find((item) => item.id === quiz.course_id);
            const questionCount = data.questions.filter((item) => item.quiz_id === quiz.id).length;
            const submitted = model.submissions.some((item) => item.quiz_id === quiz.id);
            return (
              <div key={quiz.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold">{quiz.title}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{course?.title}</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {quiz.duration} min / {quiz.total_marks} marks / {questionCount} questions
                </p>
                <Link href={`/quizzes/${quiz.id}`} className="premium-button mt-4 inline-block px-4 py-2 text-sm">
                  {submitted ? "Retake quiz" : "Take quiz"}
                </Link>
              </div>
            );
          })}
          {model.quizzes.length === 0 && (
            <EmptyState title="No quizzes available" text="Join a course that has published quizzes." />
          )}
        </div>
      </Panel>

      <Panel title="Discover Courses" eyebrow="catalog">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {model.availableCourses.map((course) => {
            const professor = data.users.find((item) => item.id === course.professor_id);
            const quizCount = data.quizzes.filter((quiz) => quiz.course_id === course.id).length;
            return (
              <div key={course.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold">{course.title}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{professor?.name}</p>
                <p className="mt-2 text-sm text-on-surface-variant">{quizCount} quizzes / code {course.join_code}</p>
                <button
                  onClick={() => joinByCode(course.join_code)}
                  className="secondary-button mt-4 px-4 py-2 text-sm"
                >
                  Join course
                </button>
              </div>
            );
          })}
          {model.availableCourses.length === 0 && (
            <EmptyState title="Catalog complete" text="You are enrolled in every available course." />
          )}
        </div>
      </Panel>

      <Panel title="Recent Results" eyebrow="performance history">
        <div className="overflow-x-auto">
          <table className="premium-table min-w-[680px] text-left text-sm">
            <thead>
              <tr>
                <th className="py-3">Quiz</th>
                <th>Course</th>
                <th>Score</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {model.submissions.map((submission) => {
                const quiz = data.quizzes.find((item) => item.id === submission.quiz_id);
                const course = data.courses.find((item) => item.id === quiz?.course_id);
                return (
                  <tr key={submission.id} className="border-t border-slate-100">
                    <td className="py-3 font-medium">{quiz?.title}</td>
                    <td>{course?.title}</td>
                    <td>{gradeLabel(submission.score, quiz?.total_marks || 0)}</td>
                    <td>{new Date(submission.submitted_at).toLocaleDateString()}</td>
                    <td><Link className="font-semibold text-primary-fixed-dim underline" href={`/results/${submission.id}`}>Open</Link></td>
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
