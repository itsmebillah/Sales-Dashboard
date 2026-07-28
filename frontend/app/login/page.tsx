import { redirect } from "next/navigation";
import { hasSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  if (await hasSession()) redirect("/");
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12"><section className="panel w-full p-6 sm:p-8"><p className="eyebrow">Private workspace</p><h1 className="mt-2 text-3xl font-semibold">Sales Intelligence</h1><p className="mt-3 text-sm leading-6 text-slate-600">Sign in to access certified company performance, forecasts, risks, and management insights.</p><LoginForm/><p className="mt-6 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">Protected by an encrypted server session. Business data and Google credentials are never stored in the browser.</p></section></main>;
}
