import { NextResponse } from "next/server";
import { readMonitorToken } from "@/lib/monitorServer";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenUser = readMonitorToken(request.headers.get("authorization"));
  const studentId = tokenUser?.id || url.searchParams.get("student_id");

  if (!studentId) {
    return NextResponse.json({ error: "Missing student." }, { status: 400 });
  }

  return NextResponse.json({ commands: [] });
}
