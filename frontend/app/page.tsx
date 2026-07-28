import { Dashboard } from "@/components/dashboard";
import { fetchDashboardData } from "@/lib/backend";

export const dynamic = "force-dynamic";

export default async function Home() {
  let result;
  try {
    result = { data: await fetchDashboardData(), error: "" };
  } catch (error) {
    result = { data: null, error: error instanceof Error ? error.message : "The KPI service is unavailable." };
  }
  if (result.data) return <Dashboard initialData={result.data} />;
  return <main className="mx-auto flex min-h-screen max-w-2xl items-center px-5 py-16"><section className="panel w-full p-7 sm:p-10"><p className="eyebrow">Live service status</p><h1 className="mt-3 text-3xl font-semibold">Sales intelligence is temporarily unavailable</h1><p className="mt-4 text-sm leading-6 text-slate-600">No fallback or mock data is being shown. The dashboard will return when the Apps Script KPI API is reachable.</p><p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{result.error}</p></section></main>;
}
