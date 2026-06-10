import { NextResponse } from "next/server";
import {
  endMonitorSession,
  getActiveSession,
  readMonitorToken,
  upsertMonitorSession,
} from "@/lib/monitorServer";

export async function GET(request: Request) {
  const user = readMonitorToken(request.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ session: getActiveSession(user.id) });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    quiz_id?: string;
    quiz_title?: string;
    student_id?: string;
    student_name?: string;
    active?: boolean;
  };

  if (!body.quiz_id || !body.student_id || !body.quiz_title || !body.student_name) {
    return NextResponse.json({ error: "Missing session fields." }, { status: 400 });
  }

  const session = upsertMonitorSession({
    quiz_id: body.quiz_id,
    quiz_title: body.quiz_title,
    student_id: body.student_id,
    student_name: body.student_name,
    active: body.active ?? true,
  });

  return NextResponse.json({ session });
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    quiz_id?: string;
    student_id?: string;
  };

  if (!body.quiz_id || !body.student_id) {
    return NextResponse.json({ error: "Missing session fields." }, { status: 400 });
  }

  return NextResponse.json({
    session: endMonitorSession(body.quiz_id, body.student_id),
  });
}
