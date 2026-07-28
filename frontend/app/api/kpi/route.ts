import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/backend";
import { hasSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasSession())) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in is required" } }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, data: await fetchDashboardData() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: "KPI_API_UNAVAILABLE", message: error instanceof Error ? error.message : "Unknown backend error" } }, { status: 502 });
  }
}
