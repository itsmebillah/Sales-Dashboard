import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, data: await fetchDashboardData() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: "KPI_API_UNAVAILABLE", message: error instanceof Error ? error.message : "Unknown backend error" } }, { status: 502 });
  }
}
