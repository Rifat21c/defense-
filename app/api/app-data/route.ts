import { NextResponse } from "next/server";
import { backendMode, readAppData, resetAppData, writeAppData } from "@/lib/backendDataStore";
import type { AppData } from "@/lib/types";

export async function GET() {
  const data = await readAppData();
  return NextResponse.json({ data, mode: backendMode() });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { data?: AppData };
  if (!body.data) {
    return NextResponse.json({ error: "Missing application data." }, { status: 400 });
  }

  const data = await writeAppData(body.data);
  return NextResponse.json({ data, mode: backendMode() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "reset") {
    return NextResponse.json({ error: "Unsupported app-data action." }, { status: 400 });
  }

  const data = await resetAppData();
  return NextResponse.json({ data, mode: backendMode() });
}
