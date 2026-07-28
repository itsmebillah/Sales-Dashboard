import "server-only";
import type { ApiEnvelope, DashboardData } from "@/lib/types";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required server configuration: ${name}`);
  return value;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: required("GOOGLE_OAUTH_CLIENT_ID"), client_secret: required("GOOGLE_OAUTH_CLIENT_SECRET"), refresh_token: required("GOOGLE_OAUTH_REFRESH_TOKEN"), grant_type: "refresh_token" }),
  });
  if (!tokenResponse.ok) throw new Error(`Google authentication failed with HTTP ${tokenResponse.status}`);
  const tokenPayload = await tokenResponse.json() as { access_token?: string };
  if (!tokenPayload.access_token) throw new Error("Google authentication returned no access token");
  const response = await fetch(`https://script.googleapis.com/v1/scripts/${encodeURIComponent(required("APPS_SCRIPT_ID"))}:run`, {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${tokenPayload.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ function: "getDashboardApi", parameters: ["dashboard"], devMode: false }),
  });
  if (!response.ok) throw new Error(`Apps Script API responded with HTTP ${response.status}`);
  const execution = await response.json() as { done?: boolean; error?: { message?: string }; response?: { result?: ApiEnvelope } };
  if (execution.error) throw new Error(execution.error.message ?? "Apps Script execution failed");
  const payload = execution.response?.result;
  if (!payload) throw new Error("Apps Script execution returned no KPI contract");
  if (!payload.ok || !payload.data) throw new Error(payload.error?.message ?? "Backend returned no KPI data");
  return payload.data;
}
