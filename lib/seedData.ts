import type {
  AppData,
  Course,
  Difficulty,
  Question,
} from "@/lib/types";

export const demoAccounts = [
  { role: "Professor", email: "professor@assessnova.edu", password: "password123" },
  { role: "Student", email: "student@assessnova.edu", password: "password123" },
  { role: "Admin", email: "admin@assessnova.edu", password: "password123" },
];

export function now() {
  return new Date().toISOString();
}

export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function buildGeneratedQuestions(
  quizId: string,
  topic: string,
  difficulty: Difficulty,
): Question[] {
  const templates: Array<Omit<Question, "id" | "quiz_id">> = [
    {
      question_text: `Which action best improves learning in ${topic}?`,
      option_a: "Ignoring feedback",
      option_b: "Reviewing weak concepts with practice",
      option_c: "Skipping revision",
      option_d: "Submitting blank answers",
      correct_answer: "B",
      marks: 5,
      topic,
      difficulty,
    },
    {
      question_text: `Why is ${topic} important in assessment design?`,
      option_a: "It supports fair measurement",
      option_b: "It removes all questions",
      option_c: "It hides course outcomes",
      option_d: "It prevents analytics",
      correct_answer: "A",
      marks: 5,
      topic,
      difficulty,
    },
  ];

  return templates.map((question) => ({ id: createId("q"), quiz_id: quizId, ...question }));
}

export function buildSeedData(): AppData {
  const created_at = now();
  const adminId = "usr_admin";
  const professorId = "usr_professor";
  const professorTwoId = "usr_professor_math";
  const studentId = "usr_student";
  const studentTwoId = "usr_student_two";
  const courseId = "course_ai101";
  const courseTwoId = "course_math201";
  const quizId = "quiz_ai_basics";
  const quizTwoId = "quiz_stats";

  return {
    users: [
      {
        id: adminId,
        name: "ADMIN",
        email: "admin@assessnova.edu",
        password: "password123",
        role: "admin",
        department: "Academic Technology",
        created_at,
      },
      {
        id: professorId,
        name: "Dr. Farhan Ahmed",
        email: "professor@assessnova.edu",
        password: "password123",
        role: "professor",
        department: "Computer Science",
        created_at,
      },
      {
        id: professorTwoId,
        name: "Dr. Nadia Islam",
        email: "nadia@assessnova.edu",
        password: "password123",
        role: "professor",
        department: "Mathematics",
        created_at,
      },
      {
        id: studentId,
        name: "Rafi Khan",
        email: "student@assessnova.edu",
        password: "password123",
        role: "student",
        department: "Computer Science",
        created_at,
      },
      {
        id: studentTwoId,
        name: "Mira Das",
        email: "mira@assessnova.edu",
        password: "password123",
        role: "student",
        department: "Computer Science",
        created_at,
      },
    ],
    courses: [
      {
        id: courseId,
        title: "AI Foundations",
        description: "Core ideas behind machine learning, responsible AI, and applied assessment.",
        professor_id: professorId,
        join_code: "AI2026",
        department: "Computer Science",
        created_at,
      },
      {
        id: courseTwoId,
        title: "Applied Statistics",
        description: "Probability, distributions, hypothesis testing, and data interpretation.",
        professor_id: professorTwoId,
        join_code: "STAT21",
        department: "Mathematics",
        created_at,
      },
    ],
    enrollments: [
      { id: "enroll_1", course_id: courseId, student_id: studentId, created_at },
      { id: "enroll_2", course_id: courseId, student_id: studentTwoId, created_at },
    ],
    quizzes: [
      {
        id: quizId,
        course_id: courseId,
        title: "Responsible AI Quiz",
        description: "Short MCQ assessment on model evaluation and AI ethics.",
        duration: 20,
        total_marks: 20,
        difficulty: "Medium",
        integrity_enabled: true,
        created_at,
      },
      {
        id: quizTwoId,
        course_id: courseTwoId,
        title: "Statistics Warmup",
        description: "Basic concepts in probability and descriptive statistics.",
        duration: 15,
        total_marks: 10,
        difficulty: "Easy",
        integrity_enabled: true,
        created_at,
      },
    ],
    questions: [
      {
        id: "q_ai_1",
        quiz_id: quizId,
        question_text: "Which metric is most useful when classes are imbalanced?",
        option_a: "Accuracy only",
        option_b: "F1 score",
        option_c: "File size",
        option_d: "Screen resolution",
        correct_answer: "B",
        marks: 5,
        topic: "Model Evaluation",
        difficulty: "Medium",
      },
      {
        id: "q_ai_2",
        quiz_id: quizId,
        question_text: "What is a privacy-friendly integrity signal?",
        option_a: "Webcam recording",
        option_b: "Fingerprint scan",
        option_c: "Tab switch count",
        option_d: "Face recognition",
        correct_answer: "C",
        marks: 5,
        topic: "Assessment Integrity",
        difficulty: "Easy",
      },
      {
        id: "q_ai_3",
        quiz_id: quizId,
        question_text: "Why should AI feedback explain weak topics?",
        option_a: "It supports targeted revision",
        option_b: "It hides assessment results",
        option_c: "It disables grading",
        option_d: "It removes professor control",
        correct_answer: "A",
        marks: 5,
        topic: "Learning Analytics",
        difficulty: "Medium",
      },
      {
        id: "q_ai_4",
        quiz_id: quizId,
        question_text: "Which practice improves AI system trust?",
        option_a: "No audit logs",
        option_b: "Transparent feedback",
        option_c: "Hidden scoring rules",
        option_d: "Unreviewed grades",
        correct_answer: "B",
        marks: 5,
        topic: "Responsible AI",
        difficulty: "Medium",
      },
      {
        id: "q_stats_1",
        quiz_id: quizTwoId,
        question_text: "The mean is best described as:",
        option_a: "The largest value",
        option_b: "The arithmetic average",
        option_c: "The smallest value",
        option_d: "The number of rows",
        correct_answer: "B",
        marks: 5,
        topic: "Descriptive Statistics",
        difficulty: "Easy",
      },
      {
        id: "q_stats_2",
        quiz_id: quizTwoId,
        question_text: "A probability must be between:",
        option_a: "0 and 1",
        option_b: "1 and 10",
        option_c: "-10 and 10",
        option_d: "100 and 200",
        correct_answer: "A",
        marks: 5,
        topic: "Probability",
        difficulty: "Easy",
      },
    ],
    submissions: [
      {
        id: "sub_demo",
        quiz_id: quizId,
        student_id: studentTwoId,
        answers: { q_ai_1: "B", q_ai_2: "A", q_ai_3: "A", q_ai_4: "B" },
        score: 15,
        ai_feedback:
          "Strong performance in model evaluation and responsible AI. Review privacy-friendly integrity monitoring.",
        submitted_at: created_at,
      },
    ],
    integrity_logs: [
      {
        id: "log_1",
        quiz_id: quizId,
        student_id: studentTwoId,
        event_type: "TAB_SWITCH",
        event_time: created_at,
        risk_points: 2,
        source: "web",
      },
      {
        id: "log_2",
        quiz_id: quizId,
        student_id: studentTwoId,
        event_type: "COPY_PASTE",
        event_time: created_at,
        risk_points: 3,
        source: "web",
      },
    ],
    analytics: [
      {
        id: "analytics_1",
        student_id: studentId,
        course_id: courseId,
        weak_topics: ["Model Evaluation", "Learning Analytics"],
        average_score: 72,
        recommendation:
          "Revise confusion matrix, precision/recall, and review feedback explanations before the next quiz.",
      },
      {
        id: "analytics_2",
        student_id: studentTwoId,
        course_id: courseId,
        weak_topics: ["Assessment Integrity"],
        average_score: 75,
        recommendation: "Review privacy-friendly monitoring signals and academic honesty policies.",
      },
    ],
    activity_logs: [
      {
        id: "act_1",
        user_id: professorId,
        action: "Created Responsible AI Quiz",
        created_at,
      },
      {
        id: "act_2",
        user_id: studentTwoId,
        action: "Submitted Responsible AI Quiz",
        created_at,
      },
    ],
  };
}

export function normalizeData(data: AppData): AppData {
  const courseByKey = new Map<string, Course>();
  const courseIdMap = new Map<string, string>();
  const canonicalCourses: Course[] = [];

  data.courses.forEach((course) => {
    const key = `${course.join_code || course.title}-${course.professor_id}-${course.department}`.toLowerCase();
    const existing = courseByKey.get(key);

    if (!existing) {
      courseByKey.set(key, course);
      courseIdMap.set(course.id, course.id);
      canonicalCourses.push(course);
      return;
    }

    courseIdMap.set(course.id, existing.id);
  });

  const enrollments = data.enrollments.map((enrollment) => ({
    ...enrollment,
    course_id: courseIdMap.get(enrollment.course_id) || enrollment.course_id,
  }));

  const uniqueEnrollments = enrollments.filter(
    (enrollment, index, list) =>
      index ===
      list.findIndex(
        (item) => item.course_id === enrollment.course_id && item.student_id === enrollment.student_id,
      ),
  );

  return {
    ...data,
    courses: canonicalCourses,
    enrollments: uniqueEnrollments,
    quizzes: data.quizzes.map((quiz) => ({
      ...quiz,
      course_id: courseIdMap.get(quiz.course_id) || quiz.course_id,
    })),
    analytics: data.analytics.map((item) => ({
      ...item,
      course_id: courseIdMap.get(item.course_id) || item.course_id,
    })),
  };
}
