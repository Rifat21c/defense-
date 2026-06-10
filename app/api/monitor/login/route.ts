import { NextResponse } from "next/server";
import { authenticateMonitorUser, createMonitorToken } from "@/lib/monitorServer";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const user = await authenticateMonitorUser(body.email || "", body.password || "");
  if (!user) {
    return NextResponse.json({ error: "Invalid student credentials." }, { status: 401 });
  }

  return NextResponse.json({
    token: createMonitorToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
