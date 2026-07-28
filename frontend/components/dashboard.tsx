"use client";

import { useMemo, useState } from "react";
import { FlowChart, PerformanceChart } from "@/components/charts";
import { compact, number, percent } from "@/components/format";
import { KpiCard } from "@/components/kpi-card";
import type { ApiEnvelope, DashboardData, EntityType, KpiContract } from "@/lib/types";

const LEVELS: EntityType[] = ["RSM", "TSO", "SR", "DEALER", "PRODUCT"];

function Section({ eyebrow, title, detail, children }: { eyebrow: string; title: string; detail?: string; children: React.ReactNode }) {
  return <section className="panel p-4 sm:p-6"><div className="mb-5"><p className="eyebrow">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl">{title}</h2>{detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}</div>{children}</section>;
}

function EntityCards({ rows }: { rows: KpiContract[] }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{rows.slice(0, 9).map((row) => <article className="rounded-xl border border-slate-200 p-4" key={`${row.entityType}-${row.entityId}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{row.entityType}</p><h3 className="mt-1 break-words font-semibold">{row.entityId}</h3></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">#{row.rank ?? "—"}</span></div><div className="mt-4 grid grid-cols-3 gap-2 text-sm"><div><span className="block text-xs text-slate-500">Sales</span>{compact(row.sales)}</div><div><span className="block text-xs text-slate-500">Ach.</span>{percent(row.achievementPct)}</div><div><span className="block text-xs text-slate-500">Forecast</span>{compact(row.forecast)}</div></div></article>)}</div>;
}

function PerformanceTable({ rows }: { rows: KpiContract[] }) {
  const visible = [...rows].sort((a, b) => b.sales - a.sales).slice(0, 20);
  return <><div className="space-y-3 md:hidden">{visible.map((row) => <article key={`mobile-${row.entityType}-${row.entityId}`} className="rounded-xl border border-slate-200 p-4"><strong className="break-words">{row.entityId}</strong><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-500">Sales</dt><dd>{number(row.sales)}</dd></div><div><dt className="text-xs text-slate-500">Achievement</dt><dd>{percent(row.achievementPct)}</dd></div><div><dt className="text-xs text-slate-500">Forecast</dt><dd>{number(row.forecast)}</dd></div><div><dt className="text-xs text-slate-500">Trend</dt><dd>{row.trend}</dd></div></dl></article>)}</div><div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block"><table className="w-full table-fixed text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="w-[30%] px-4 py-3">Entity</th><th className="px-4 py-3">Sales</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Ach.</th><th className="px-4 py-3">Forecast</th><th className="px-4 py-3">Trend</th></tr></thead><tbody>{visible.map((row) => <tr key={`desktop-${row.entityType}-${row.entityId}`} className="border-t border-slate-200"><td className="break-words px-4 py-3 font-semibold">{row.entityId}</td><td className="px-4 py-3">{number(row.sales)}</td><td className="px-4 py-3">{number(row.target)}</td><td className="px-4 py-3">{percent(row.achievementPct)}</td><td className="px-4 py-3">{number(row.forecast)}</td><td className="px-4 py-3">{row.trend}</td></tr>)}</tbody></table></div></>;
}

export function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [level, setLevel] = useState<EntityType>("RSM");
  const [entityId, setEntityId] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const selected = useMemo(() => data.hierarchy[level] ?? [], [data, level]);
  const executive = entityId === "ALL" ? data.executive : selected.find((row) => row.entityId === entityId) ?? data.executive;
  const chartRows = entityId === "ALL" ? selected : selected.filter((row) => row.entityId === entityId);
  async function refresh() {
    setLoading(true); setRefreshError("");
    try { const response = await fetch("/api/kpi", { cache: "no-store" }); const payload = await response.json() as ApiEnvelope; if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error?.message ?? "Refresh failed"); setData(payload.data); }
    catch (error) { setRefreshError(error instanceof Error ? error.message : "Refresh failed"); }
    finally { setLoading(false); }
  }
  const generated = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt));
  return <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-6 sm:py-7 lg:px-8">
    <header className="panel overflow-hidden bg-[#17233c] p-5 text-white sm:p-8"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">Sales Intelligence Platform</p><h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Executive command center</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Live, certified business metrics from the Apps Script KPI engine. No spreadsheet access, cached figures, or sample data.</p></div><div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center"><div className="text-xs text-slate-300"><span className="block">Generated {generated}</span><span>Batch {data.batchId}</span></div><button onClick={refresh} disabled={loading} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh live data"}</button><form action="/api/auth/logout" method="post"><button className="w-full rounded-xl border border-slate-500 px-4 py-2.5 text-sm font-bold text-white">Sign out</button></form></div></div>{refreshError && <p className="mt-4 rounded-lg bg-red-950/60 p-3 text-sm text-red-100">{refreshError}</p>}</header>

    <section className="panel mt-4 p-4 sm:p-5"><div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"><div><label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="level">Management level</label><select id="level" value={level} onChange={(event) => { setLevel(event.target.value as EntityType); setEntityId("ALL"); }} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3"><option value="RSM">RSM</option><option value="TSO">TSO</option><option value="SR">SR</option><option value="DEALER">Dealer</option><option value="PRODUCT">Product</option></select></div><div><label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="entity">Reporting scope</label><select id="entity" value={entityId} onChange={(event) => setEntityId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3"><option value="ALL">Company total</option>{selected.map((row) => <option key={row.entityId} value={row.entityId}>{row.entityId}</option>)}</select></div><p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-900">Scope: <strong>{entityId === "ALL" ? "Company" : entityId}</strong></p></div></section>

    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
      <KpiCard label="Net Sales" value={executive.sales} note={`${percent(executive.achievementPct)} of target`} tone="good"/>
      <KpiCard label="Target" value={executive.target} note={`Gap ${compact(executive.gap)}`}/>
      <KpiCard label="Forecast" value={executive.forecast} note={`${percent(executive.forecastAchievementPct)} forecast achievement`}/>
      <KpiCard label="Daily Average" value={executive.averageDailySales} note={`Working day ${number(executive.currentWorkingDay)} of ${number(executive.totalWorkingDay)}`}/>
      <KpiCard label="Required Daily" value={executive.requiredDailySales} note={`${number(executive.dueWorkingDay)} working days remain`} tone="warn"/>
      <KpiCard label="Collection" value={executive.collection} note={`${percent(executive.collectionFlowRatioPct)} of sales`}/>
      <KpiCard label="Projection" value={executive.projection} note={`${number(executive.dealerCount)} dealers in scope`}/>
      <KpiCard label="Lifting" value={executive.lifting} note={`${percent(data.lifting.salesFlowRatioPct)} sales flow ratio`}/>
      <KpiCard label="Stock" value={executive.stock} note={`Secondary ${compact(executive.secondary)}`}/>
      <KpiCard label="Growth" value={executive.growthPct} note={executive.growthComparable ? "Comparable period growth %" : "No comparable period"}/>
      <KpiCard label="Momentum" value={executive.momentumPct} note={executive.trend}/>
      <KpiCard label="Active Dealers" value={executive.dealerCount} note={`${number(executive.productCount)} products`}/>
    </div>

    <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
      <Section eyebrow="Forecast & hierarchy" title="Performance by management level" detail="Ranked live sales, target, and working-day forecast."><div className="mb-4 flex gap-2 overflow-x-auto pb-1">{LEVELS.map((x) => <button key={x} onClick={() => { setLevel(x); setEntityId("ALL"); }} className={`shrink-0 rounded-full px-4 text-xs font-bold ${level === x ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>{x}</button>)}</div>{chartRows.length ? <PerformanceChart rows={chartRows}/> : <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">No certified {level} contracts are available for this batch.</p>}</Section>
      <Section eyebrow="Commercial flow" title="Sales, cash and inventory" detail="Comparable period totals from the master dataset."><FlowChart row={executive}/></Section>
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Section eyebrow="Risk control" title={`${data.risks.length} active management risks`} detail="Rules produced by the KPI engine, ordered as returned by the backend."><div className="space-y-3">{data.risks.length ? data.risks.slice(0, 8).map((risk) => <article key={risk.riskId} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${risk.severity === "HIGH" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{risk.severity}</span><strong className="text-sm">{risk.entityType}: {risk.entityId}</strong></div><p className="mt-2 text-sm text-slate-600">{risk.reason}</p><p className="mt-2 text-xs text-slate-500">{risk.metric}: {number(risk.value)} · threshold {number(risk.threshold)}</p></article>) : <p className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-800">The KPI engine returned no active risks.</p>}</div></Section>
      <Section eyebrow="Data trust" title="Certification and pipeline health" detail="Operational metadata is live from the same calculation batch."><dl className="grid grid-cols-2 gap-3"><KpiCard label="Accepted Records" value={data.quality.acceptedRecords} note={data.quality.certification}/><KpiCard label="Excluded Records" value={data.quality.excludedRecords} note={`${number(data.quality.masterQualityFlags)} quality flags`}/><KpiCard label="Entity Contracts" value={data.performance.entityContracts} note={`${number(data.performance.recordsVisited)} records visited`}/><KpiCard label="Calculation Time" value={data.performance.calculationMs} note="milliseconds"/></dl><div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600"><strong>Versions:</strong> KPI {data.kpiVersion} · Master schema {data.masterSchemaVersion} · Release {data.release}</div></Section>
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-2"><Section eyebrow="AI-ready insights" title={`${data.insights.length} deterministic insights`} detail="Machine-readable observations generated by certified backend rules."><div className="space-y-3">{data.insights.slice(0, 8).map((insight) => <article key={insight.riskId} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{insight.type.replaceAll("_", " ")}</strong><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{insight.severity}</span></div><p className="mt-2 text-sm text-slate-600">{insight.entity}: {insight.entityId}</p><p className="mt-1 text-xs text-slate-500">{insight.metric}: {number(insight.value)} · threshold {number(insight.threshold)}</p></article>)}{!data.insights.length && <p className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-800">No rule-based insights were generated for this batch.</p>}</div></Section><Section eyebrow="Forecast model" title="Working-day run-rate outlook" detail={`Method: ${executive.forecastBase.method}`}><dl className="grid grid-cols-2 gap-3"><KpiCard label="Run Rate" value={executive.forecastBase.runRate} note="Current velocity"/><KpiCard label="Working-day Forecast" value={executive.forecastBase.workingDayForecast} note={executive.forecastBase.certification}/><KpiCard label="Confidence" value={executive.forecastBase.confidenceInputs.confidenceScore} note={`${number(executive.forecastBase.confidenceInputs.activeSellingDays)} active selling days`}/><KpiCard label="Historical Periods" value={executive.forecastBase.confidenceInputs.historicalPeriodCount} note={executive.forecastBase.historicalTrend.direction}/></dl></Section></div>

    <div className="mt-4 grid gap-4 xl:grid-cols-2"><Section eyebrow="Dealer intelligence" title="Top dealer performance" detail="Highest live dealer contracts by sales."><EntityCards rows={data.dealers.top}/></Section><Section eyebrow="Dealer intervention" title="Bottom dealer performance" detail="Lowest live dealer contracts requiring review."><EntityCards rows={data.dealers.bottom}/></Section><Section eyebrow="Product intelligence" title="Top product mix" detail={`Unit policy: ${data.products.unitPolicy}`}><EntityCards rows={data.products.topProducts}/></Section><Section eyebrow="Product intervention" title="Bottom product mix" detail="Lowest live product volume contracts."><EntityCards rows={data.products.bottomProducts}/></Section></div>
    <div className="mt-4"><Section eyebrow="Operational report" title={`${level} performance register`} detail="Mobile cards transform into a compact management table on tablet and desktop."><PerformanceTable rows={chartRows}/></Section></div>
    <footer className="px-2 py-7 text-center text-xs text-slate-500">Apps Script is the sole business-data source · KPI certification: {executive.certification}</footer>
  </main>;
}
