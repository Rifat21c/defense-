import { NextResponse } from "next/server";
import { getSystemHealthSummary } from "@/lib/systemStatus";

export async function GET() {
  return NextResponse.json(getSystemHealthSummary());
}
