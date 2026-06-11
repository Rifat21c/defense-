"use client";

import type {
  Analytics,
  AppData,
  Difficulty,
  Enrollment,
  IntegrityLog,
  Question,
  Quiz,
  RiskLevel,
  Role,
  Submission,
  User,
} from "@/lib/types";
import { riskLevel } from "@/lib/risk";
import {
  buildGeneratedQuestions,
  buildSeedData,
  createId,
  demoAccounts,
  normalizeData,
  now,
} from "@/lib/seedData";

export { createId, demoAccounts };

const DATA_KEY = "assessnova:data:v3";
const SESSION_KEY = "assessnova:session:v3";
const DRAFT_PREFIX = "assessnova:draft:";

function canStore() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  if (!canStore()) return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (canStore()) window.localStorage.setItem(key, JSON.stringify(value));
}

function backendRequest<T>(method: "GET" | "PUT" | "POST", body?: unknown): T | null {
  if (typeof window === "undefined") return null;

  try {
    const request = new XMLHttpRequest();
    request.open(method, "/api/app-data", false);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(body ? JSON.stringify(body) : undefined);

    if (request.status < 200 || request.status >= 300 || !request.responseText) return null;
    return JSON.parse(request.responseText) as T;
  } catch {
    return null;
  }
}

function mergeById<T extends { id: string }>(backendItems: T[], cachedItems: T[]) {
  const merged = new Map<string, T>();

  backendItems.forEach((item) => merged.set(item.id, item));
  cachedItems.forEach((item) => merged.set(item.id, item));

  return Array.from(merged.values());
}

function mergeAppData(backendData: AppData, cachedData: AppData) {
  return normalizeData({
    users: mergeById(backendData.users, cachedData.users),
    courses: mergeById(backendData.courses, cachedData.courses),
    enrollments: mergeById(backendData.enrollments, cachedData.enrollments),
    quizzes: mergeById(backendData.quizzes, cachedData.quizzes),
    questions: mergeById(backendData.questions, cachedData.questions),
    submissions: mergeById(backendData.submissions, cachedData.submissions),
    integrity_logs: mergeById(backendData.integrity_logs, cachedData.integrity_logs),
    analytics: mergeById(backendData.analytics, cachedData.analytics),
    activity_logs: mergeById(backendData.activity_logs, cachedData.activity_logs),
  });
}

function hasDifferentCounts(left: AppData, right: AppData) {
  return (
    left.users.length !== right.users.length ||
    left.courses.length !== right.courses.length ||
    left.enrollments.length !== right.enrollments.length ||
    left.quizzes.length !== right.quizzes.length ||
    left.questions.length !== right.questions.length ||
    left.submissions.length !== right.submissions.length ||
    left.integrity_logs.length !== right.integrity_logs.length ||
    left.analytics.length !== right.analytics.length ||
    left.activity_logs.length !== right.activity_logs.length
  );
}

export function getData(): AppData {
  const cached = readJson<AppData | null>(DATA_KEY, null);
  const response = backendRequest<{ data: AppData }>("GET");
  if (response?.data) {
    const backendData = normalizeData(response.data);
    const normalized = cached ? mergeAppData(backendData, normalizeData(cached)) : backendData;
    writeJson(DATA_KEY, normalized);
    if (cached && hasDifferentCounts(normalized, backendData)) {
      backendRequest("PUT", { data: normalized });
    }
    return normalized;
  }

  if (cached) return normalizeData(cached);

  const seed = buildSeedData();
  writeJson(DATA_KEY, seed);
  return seed;
}

export function saveData(data: AppData) {
  const normalized = normalizeData(data);
  writeJson(DATA_KEY, normalized);
  backendRequest("PUT", { data: normalized });
}

export function resetDemoData() {
  const response = backendRequest<{ data: AppData }>("POST", { action: "reset" });
  const seed = response?.data || buildSeedData();
  writeJson(DATA_KEY, seed);
  if (canStore()) window.localStorage.removeItem(SESSION_KEY);
  return seed;
}

export function getCurrentUser(): User | null {
  const userId = readJson<string | null>(SESSION_KEY, null);
  if (!userId) return null;
  return getData().users.find((user) => user.id === userId) || null;
}

export function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getData().users.find(
    (item) => item.email.toLowerCase() === normalizedEmail && item.password === password,
  );

  if (!user) return { user: null, error: "Invalid email or password." };

  writeJson(SESSION_KEY, user.id);
  addActivity(user.id, "Logged in");
  return { user, error: "" };
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
}) {
  const data = getData();
  const email = input.email.trim().toLowerCase();

  if (!input.name.trim() || !email || !input.password || !input.department.trim()) {
    return { user: null, error: "Please fill in every field." };
  }

  if (input.password.length < 6) {
    return { user: null, error: "Password must be at least 6 characters." };
  }

  if (data.users.some((user) => user.email.toLowerCase() === email)) {
    return { user: null, error: "This email is already registered." };
  }

  const user: User = {
    id: createId("usr"),
    name: input.name.trim(),
    email,
    password: input.password,
    role: input.role,
    department: input.department.trim(),
    created_at: now(),
  };

  data.users.push(user);
  data.activity_logs.push({
    id: createId("act"),
    user_id: user.id,
    action: `Registered as ${user.role}`,
    created_at: now(),
  });
  saveData(data);
  writeJson(SESSION_KEY, user.id);

  return { user, error: "" };
}

export function logout() {
  const user = getCurrentUser();
  if (user) addActivity(user.id, "Logged out");
  if (canStore()) window.localStorage.removeItem(SESSION_KEY);
}

export function routeForRole(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "professor") return "/professor";
  return "/student";
}

export function requireRole(allowed: Role[]) {
  const user = getCurrentUser();
  if (!user) return { user: null, redirect: "/login" };
  if (!allowed.includes(user.role)) return { user: null, redirect: routeForRole(user.role) };
  return { user, redirect: "" };
}

export function addActivity(userId: string, action: string) {
  const data = getData();
  data.activity_logs.unshift({
    id: createId("act"),
    user_id: userId,
    action,
    created_at: now(),
  });
  saveData(data);
}

export function createCourse(input: {
  title: string;
  description: string;
  professor_id: string;
  department: string;
}) {
  const data = getData();
  const course = {
    id: createId("course"),
    title: input.title.trim(),
    description: input.description.trim(),
    professor_id: input.professor_id,
    join_code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    department: input.department,
    created_at: now(),
  };

  data.courses.unshift(course);
  data.activity_logs.unshift({
    id: createId("act"),
    user_id: input.professor_id,
    action: `Created course ${course.title}`,
    created_at: now(),
  });
  saveData(data);
  return course;
}

export function joinCourse(studentId: string, joinCode: string) {
  const data = getData();
  const course = data.courses.find((item) => item.join_code.toLowerCase() === joinCode.trim().toLowerCase());

  if (!course) return { error: "Invalid course code." };
  if (data.enrollments.some((item) => item.course_id === course.id && item.student_id === studentId)) {
    return { error: "You are already enrolled in this course." };
  }

  const enrollment: Enrollment = {
    id: createId("enroll"),
    course_id: course.id,
    student_id: studentId,
    created_at: now(),
  };

  data.enrollments.push(enrollment);
  data.activity_logs.unshift({
    id: createId("act"),
    user_id: studentId,
    action: `Joined course ${course.title}`,
    created_at: now(),
  });
  saveData(data);
  return { error: "" };
}

export function createQuiz(input: {
  course_id: string;
  title: string;
  description: string;
  duration: number;
  total_marks: number;
  difficulty: Difficulty;
  integrity_enabled: boolean;
  professor_id: string;
}) {
  const data = getData();
  const selectedCourse = data.courses.find((course) => course.id === input.course_id);
  const canonicalCourse =
    data.courses.find(
      (course) =>
        course.join_code === selectedCourse?.join_code &&
        course.professor_id === selectedCourse?.professor_id,
    ) || selectedCourse;
  const quiz: Quiz = {
    id: createId("quiz"),
    course_id: canonicalCourse?.id || input.course_id,
    title: input.title.trim(),
    description: input.description.trim(),
    duration: input.duration,
    total_marks: input.total_marks,
    difficulty: input.difficulty,
    integrity_enabled: input.integrity_enabled,
    created_at: now(),
  };

  data.quizzes.unshift(quiz);
  data.activity_logs.unshift({
    id: createId("act"),
    user_id: input.professor_id,
    action: `Created quiz ${quiz.title}`,
    created_at: now(),
  });
  saveData(data);
  return quiz;
}

export function addQuestion(input: Omit<Question, "id">) {
  const data = getData();
  const question: Question = { id: createId("q"), ...input };
  data.questions.push(question);
  saveData(data);
  return question;
}

export async function generateAiQuestions(quizId: string, topic: string, difficulty: Difficulty) {
  const data = getData();
  let questions = buildGeneratedQuestions(quizId, topic, difficulty);

  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/ai-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, topic, difficulty, count: 3 }),
      });
      const payload = (await response.json()) as { questions?: Question[] };
      if (response.ok && Array.isArray(payload.questions) && payload.questions.length > 0) {
        questions = payload.questions;
      }
    } catch {
      questions = buildGeneratedQuestions(quizId, topic, difficulty);
    }
  }

  data.questions.push(...questions);
  saveData(data);
  return questions;
}

export function saveDraft(quizId: string, studentId: string, answers: Record<string, string>) {
  writeJson(`${DRAFT_PREFIX}${quizId}:${studentId}`, answers);
}

export function getDraft(quizId: string, studentId: string) {
  return readJson<Record<string, string>>(`${DRAFT_PREFIX}${quizId}:${studentId}`, {});
}

export function logIntegrityEvent(input: {
  quiz_id: string;
  student_id: string;
  event_type: IntegrityLog["event_type"];
  risk_points: number;
  source?: IntegrityLog["source"];
  details?: string;
}) {
  const data = getData();
  data.integrity_logs.push({
    id: createId("log"),
    event_time: now(),
    ...input,
  });
  saveData(data);
}

export function submitQuiz(quizId: string, studentId: string, answers: Record<string, string>) {
  const data = getData();
  const quiz = data.quizzes.find((item) => item.id === quizId);
  const questions = data.questions.filter((item) => item.quiz_id === quizId);

  let score = 0;
  const missedTopics: string[] = [];

  questions.forEach((question) => {
    if (answers[question.id] === question.correct_answer) {
      score += question.marks;
    } else if (!missedTopics.includes(question.topic)) {
      missedTopics.push(question.topic);
    }
  });

  const percentage = quiz?.total_marks ? Math.round((score / quiz.total_marks) * 100) : 0;
  const ai_feedback =
    missedTopics.length > 0
      ? `You scored ${percentage}%. Focus next on ${missedTopics.join(", ")}. Review examples, retry practice questions, and summarize each weak topic in your own words.`
      : `Excellent work. You scored ${percentage}% and showed strong coverage across the quiz topics.`;

  const submission: Submission = {
    id: createId("sub"),
    quiz_id: quizId,
    student_id: studentId,
    answers,
    score,
    ai_feedback,
    submitted_at: now(),
  };

  data.submissions.unshift(submission);

  const courseId = quiz?.course_id || "";
  if (courseId) {
    const courseSubmissions = data.submissions.filter((item) => {
      const itemQuiz = data.quizzes.find((quizItem) => quizItem.id === item.quiz_id);
      return item.student_id === studentId && itemQuiz?.course_id === courseId;
    });
    const average =
      courseSubmissions.reduce((total, item) => {
        const itemQuiz = data.quizzes.find((quizItem) => quizItem.id === item.quiz_id);
        return total + (itemQuiz?.total_marks ? (item.score / itemQuiz.total_marks) * 100 : 0);
      }, 0) / Math.max(courseSubmissions.length, 1);

    const existing = data.analytics.find(
      (item) => item.student_id === studentId && item.course_id === courseId,
    );
    const analytics: Analytics = {
      id: existing?.id || createId("analytics"),
      student_id: studentId,
      course_id: courseId,
      weak_topics: missedTopics,
      average_score: Math.round(average),
      recommendation:
        missedTopics.length > 0
          ? `Revise ${missedTopics.join(", ")} and complete one short practice set before your next attempt.`
          : "Maintain your pace with mixed revision and higher difficulty questions.",
    };

    data.analytics = existing
      ? data.analytics.map((item) => (item.id === existing.id ? analytics : item))
      : [analytics, ...data.analytics];
  }

  data.activity_logs.unshift({
    id: createId("act"),
    user_id: studentId,
    action: `Submitted ${quiz?.title || "quiz"}`,
    created_at: now(),
  });

  saveData(data);
  if (canStore()) window.localStorage.removeItem(`${DRAFT_PREFIX}${quizId}:${studentId}`);
  return submission;
}

export function getIntegritySummary(quizId: string, studentId: string) {
  const logs = getData().integrity_logs.filter(
    (log) => log.quiz_id === quizId && log.student_id === studentId,
  );
  const points = logs.reduce((total, log) => total + log.risk_points, 0);

  let risk: RiskLevel = "Low";
  risk = riskLevel(points);

  return {
    logs,
    points,
    risk,
    integrityScore: Math.max(0, 100 - points * 8),
  };
}

export function gradeLabel(score: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((score / total) * 100)}%`;
}

export function systemHealth(data = getData()) {
  return {
    status: "Operational",
    database: "Backend persistence ready",
    ai: "Assessment feedback engine active",
    activityCount: data.activity_logs.length,
  };
}
