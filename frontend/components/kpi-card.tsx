import { compact } from "@/components/format";

export function KpiCard({ label, value, note, tone = "default" }: { label: string; value: number | null; note: string; tone?: "default" | "good" | "warn" }) {
  const colors = tone === "good" ? "bg-emerald-50 text-emerald-800" : tone === "warn" ? "bg-amber-50 text-amber-900" : "bg-white text-slate-900";
  return <article className={`rounded-2xl border border-slate-200 p-4 sm:p-5 ${colors}`}><p className="text-xs font-semibold uppercase tracking-[.1em] opacity-70">{label}</p><p className="metric mt-3 text-2xl font-bold sm:text-3xl">{compact(value)}</p><p className="mt-2 text-xs leading-5 opacity-70">{note}</p></article>;
}
