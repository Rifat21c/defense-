import type { IntegrityEventType, IntegrityLog, RiskLevel, Role } from "@/lib/types";
import { riskLevel, riskPoints } from "@/lib/risk";
import { readAppData } from "@/lib/backendDataStore";
import { isRealSupabaseConfig } from "@/lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type MonitorUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type MonitorSession = {
  id: string;
  quiz_id: string;
  quiz_title: string;
  student_id: string;
  student_name: string;
  started_at: string;
  last_seen_at: string;
  active: boolean;
};

const monitorUsers: MonitorUser[] = [
  {
    id: "usr_student",
    name: "Rafi Khan",
    email: "student@assessnova.edu",
    password: "password123",
    role: "student",
  },
  {
    id: "usr_student_two",
    name: "Mira Das",
    email: "mira@assessnova.edu",
    password: "password123",
    role: "student",
  },
  {
    id: "usr_professor",
    name: "Dr. Farhan Ahmed",
    email: "professor@assessnova.edu",
    password: "password123",
    role: "professor",
  },
  {
    id: "usr_admin",
    name: "Amina Rahman",
    email: "admin@assessnova.edu",
    password: "password123",
    role: "admin",
  },
];

type Store = {
  sessions: MonitorSession[];
  logs: IntegrityLog[];
};

const globalStore = globalThis as typeof globalThis & {
  assessNovaMonitorStore?: Store;
};

const STORE_ID = "default";
const STORE_PATH = join(process.cwd(), ".data", "monitor-store.json");

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isRealSupabaseConfig(url, key)) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function writeSupabaseStore(data: Store) {
  const client = supabaseAdmin();
  if (!client) return false;

  const { error } = await client.from("monitor_state").upsert({
    id: STORE_ID,
    data,
    updated_at: now(),
  });

  return !error;
}

function readStoreFromDisk(): Store | null {
  try {
    if (!existsSync(STORE_PATH)) return null;
    return JSON.parse(readFileSync(STORE_PATH, "utf8")) as Store;
  } catch {
    return null;
  }
}

function persistStore(data: Store) {
  try {
    mkdirSync(join(process.cwd(), ".data"), { recursive: true });
    writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
  } catch {
    // Monitoring continues in memory when the local filesystem is read-only.
  }
  void writeSupabaseStore(data);
}

function store(): Store {
  if (!globalStore.assessNovaMonitorStore) {
    globalStore.assessNovaMonitorStore = readStoreFromDisk() || {
      sessions: [],
      logs: [],
    };
  }

  return globalStore.assessNovaMonitorStore;
}

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function createMonitorToken(user: MonitorUser) {
  return Buffer.from(JSON.stringify({ user, userId: user.id, issuedAt: Date.now() })).toString("base64url");
}

export function readMonitorToken(authHeader: string | null) {
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  try {
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as {
      userId: string;
      user?: MonitorUser;
    };
    if (payload.user?.id) return payload.user;
    return monitorUsers.find((user) => user.id === payload.userId) || null;
  } catch {
    return null;
  }
}

export async function authenticateMonitorUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const data = await readAppData();
  const appUser = data.users.find(
    (user) =>
      user.email.toLowerCase() === normalized &&
      user.password === password &&
      user.role === "student",
  );

  if (appUser) {
    return {
      id: appUser.id,
      name: appUser.name,
      email: appUser.email,
      password: appUser.password,
      role: appUser.role,
    };
  }

  return monitorUsers.find(
    (user) =>
      user.email.toLowerCase() === normalized &&
      user.password === password &&
      user.role === "student",
  ) || null;
}

export function upsertMonitorSession(input: {
  quiz_id: string;
  quiz_title: string;
  student_id: string;
  student_name: string;
  active: boolean;
}) {
  const data = store();
  const existing = data.sessions.find(
    (session) => session.quiz_id === input.quiz_id && session.student_id === input.student_id,
  );

  if (existing) {
    existing.quiz_title = input.quiz_title;
    existing.student_name = input.student_name;
    existing.active = input.active;
    existing.last_seen_at = now();
    persistStore(data);
    return existing;
  }

  const session: MonitorSession = {
    id: id("session"),
    quiz_id: input.quiz_id,
    quiz_title: input.quiz_title,
    student_id: input.student_id,
    student_name: input.student_name,
    started_at: now(),
    last_seen_at: now(),
    active: input.active,
  };

  data.sessions.unshift(session);
  persistStore(data);
  return session;
}

export function getActiveSession(studentId: string) {
  return (
    store().sessions.find((session) => session.student_id === studentId && session.active) ||
    null
  );
}

export function endMonitorSession(quizId: string, studentId: string) {
  const session = store().sessions.find(
    (item) => item.quiz_id === quizId && item.student_id === studentId,
  );
  if (session) {
    session.active = false;
    session.last_seen_at = now();
    persistStore(store());
  }
  return session || null;
}

export function addMonitorLog(input: {
  quiz_id: string;
  student_id: string;
  event_type: IntegrityEventType;
  risk_points?: number;
  source: "web" | "desktop";
  details?: string;
}) {
  const data = store();
  const log: IntegrityLog = {
    id: id("log"),
    quiz_id: input.quiz_id,
    student_id: input.student_id,
    event_type: input.event_type,
    event_time: now(),
    risk_points: input.risk_points ?? riskPoints[input.event_type],
    source: input.source,
    details: input.details,
  };

  data.logs.unshift(log);

  const totalRisk = data.logs
    .filter((item) => item.quiz_id === input.quiz_id && item.student_id === input.student_id)
    .reduce((total, item) => total + item.risk_points, 0);

  persistStore(data);
  return { log, totalRisk, risk: riskLevel(totalRisk) };
}

export function getMonitorSnapshot() {
  const data = store();
  const summaries = data.sessions.map((session) => {
    const logs = data.logs.filter(
      (log) => log.quiz_id === session.quiz_id && log.student_id === session.student_id,
    );
    const risk_points_total = logs.reduce((total, log) => total + log.risk_points, 0);
    const risk: RiskLevel = riskLevel(risk_points_total);

    return {
      ...session,
      events: logs.length,
      risk_points_total,
      risk,
    };
  });

  return {
    sessions: summaries,
    logs: data.logs,
  };
}
