"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import type { KpiContract } from "@/lib/types";
import { compact, number } from "@/components/format";

const tooltip = ({ active, payload, label }: TooltipContentProps) => active && payload?.length ? <div className="chart-tooltip"><strong>{label}</strong>{payload.map((p) => <div key={String(p.name)} style={{ color: p.color }}>{p.name}: {Array.isArray(p.value) ? p.value.join(" – ") : typeof p.value === "number" ? number(p.value) : p.value}</div>)}</div> : null;

export function PerformanceChart({ rows }: { rows: KpiContract[] }) {
  const data = [...rows].sort((a,b) => b.sales - a.sales).slice(0, 8).map((x) => ({ name: x.entityId, Sales: x.sales, Target: x.target, Forecast: x.forecast ?? 0 }));
  return <div className="h-72 w-full sm:h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 28 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9f2"/><XAxis dataKey="name" angle={-24} textAnchor="end" interval={0} height={66}/><YAxis tickFormatter={compact}/><Tooltip content={tooltip}/><Legend/><Bar dataKey="Sales" fill="#176b5b" radius={[5,5,0,0]}/><Bar dataKey="Target" fill="#f0a23b" radius={[5,5,0,0]}/><Bar dataKey="Forecast" fill="#72a7d8" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>;
}

export function FlowChart({ row }: { row: KpiContract }) {
  const data = [{name:"Sales",value:row.sales},{name:"Collection",value:row.collection},{name:"Lifting",value:row.lifting},{name:"Projection",value:row.projection},{name:"Secondary",value:row.secondary},{name:"Stock",value:row.stock}];
  const colors = ["#176b5b", "#4a8fc2", "#7059a6", "#f0a23b", "#60a889", "#c6636b"];
  return <div className="h-72 w-full sm:h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ left: 15, right: 12 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e9f2"/><XAxis type="number" tickFormatter={compact}/><YAxis type="category" dataKey="name" width={76}/><Tooltip content={tooltip}/><Bar dataKey="value" name="Value" radius={[0,6,6,0]}>{data.map((_, i) => <Cell key={colors[i]} fill={colors[i]}/>)}</Bar></BarChart></ResponsiveContainer></div>;
}
