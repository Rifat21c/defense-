import { NextResponse } from "next/server";
import { addMonitorLog, getMonitorSnapshot, readMonitorToken } from "@/lib/monitorServer";
import type { IntegrityEventType } from "@/lib/types";

const allowedEvents: IntegrityEventType[] = [
  "TAB_SWITCH",
  "COPY_PASTE",
  "FULLSCREEN_EXIT",
  "WINDOW_BLUR",
  "WINDOW_MINIMIZE",
  "BROWSER_FOCUS_LOSS",
  "BROWSER_TAB_CHANGE",
  "INACTIVITY",
  "BLOCKED_APP_OPEN",
  "EXAM_CLIENT_CLOSED",
  "MULTIPLE_MONITORS",
];

function canReadMonitoring(request: Request) {
  const role = request.headers.get("x-assessnova-role");
  return role === "professor" || role === "admin";
}

export async function GET(request: Request) {
  if (!canReadMonitoring(request)) {
    return NextResponse.json(
      { error: "Monitoring reports are available only to professors and administrators." },
      { status: 403 },
    );
  }

  return NextResponse.json(getMonitorSnapshot());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    quiz_id?: string;
    student_id?: string;
    event_type?: IntegrityEventType;
    risk_points?: number;
    source?: "web" | "desktop";
    details?: string;
  };

  const authUser = readMonitorToken(request.headers.get("authorization"));
  const source = body.source || (authUser ? "desktop" : "web");
  const studentId = body.student_id || authUser?.id;

  if (!body.quiz_id || !studentId || !body.event_type || !allowedEvents.includes(body.event_type)) {
    return NextResponse.json({ error: "Invalid monitoring log payload." }, { status: 400 });
  }

  if (authUser && authUser.id !== studentId) {
    return NextResponse.json({ error: "Token does not match student." }, { status: 403 });
  }

  const result = addMonitorLog({
    quiz_id: body.quiz_id,
    student_id: studentId,
    event_type: body.event_type,
    risk_points: body.risk_points,
    source,
    details: body.details,
  });

  return NextResponse.json(result);
}
