"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }); if (!response.ok) throw new Error("The password is incorrect."); router.replace("/"); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Sign in failed."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mt-6"><label htmlFor="password" className="text-sm font-semibold">Dashboard password</label><input id="password" type="password" autoComplete="current-password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"/><button disabled={busy} className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Signing in…" : "Open dashboard"}</button>{error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}</form>;
}
