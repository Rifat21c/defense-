import { NextResponse } from "next/server";

const monitorInstallerPath = "/downloads/assessnova-monitor-setup.exe";

export function GET(request: Request) {
  return NextResponse.redirect(new URL(monitorInstallerPath, request.url), 307);
}
