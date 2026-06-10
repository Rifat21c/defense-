export type Role = "student" | "professor" | "admin";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type RiskLevel = "Low" | "Medium" | "High";
export type IntegrityEventType =
  | "TAB_SWITCH"
  | "COPY_PASTE"
  | "FULLSCREEN_EXIT"
  | "WINDOW_BLUR"
  | "WINDOW_MINIMIZE"
  | "BROWSER_FOCUS_LOSS"
  | "BROWSER_TAB_CHANGE"
  | "INACTIVITY"
  | "BLOCKED_APP_OPEN"
  | "EXAM_CLIENT_CLOSED"
  | "MULTIPLE_MONITORS";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  professor_id: string;
  join_code: string;
  department: string;
  created_at: string;
};

export type Enrollment = {
  id: string;
  course_id: string;
  student_id: string;
  created_at: string;
};

export type Quiz = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  duration: number;
  total_marks: number;
  difficulty: Difficulty;
  integrity_enabled: boolean;
  created_at: string;
};

export type Question = {
  id: string;
  quiz_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
  marks: number;
  topic: string;
  difficulty: Difficulty;
};

export type Submission = {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: Record<string, string>;
  score: number;
  ai_feedback: string;
  submitted_at: string;
};

export type IntegrityLog = {
  id: string;
  quiz_id: string;
  student_id: string;
  event_type: IntegrityEventType;
  event_time: string;
  risk_points: number;
  source?: "web" | "desktop";
  details?: string;
};

export type Analytics = {
  id: string;
  student_id: string;
  course_id: string;
  weak_topics: string[];
  average_score: number;
  recommendation: string;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  created_at: string;
};

export type AppData = {
  users: User[];
  courses: Course[];
  enrollments: Enrollment[];
  quizzes: Quiz[];
  questions: Question[];
  submissions: Submission[];
  integrity_logs: IntegrityLog[];
  analytics: Analytics[];
  activity_logs: ActivityLog[];
};
