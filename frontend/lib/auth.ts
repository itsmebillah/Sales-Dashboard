import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "sip_session";
const MAX_AGE = 60 * 60 * 8;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return value;
}

function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
function equal(a: string, b: string) { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }

export function createSession() {
  const payload = Buffer.from(JSON.stringify({ sub: "dashboard-user", role: "executive", exp: Math.floor(Date.now() / 1000) + MAX_AGE })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySession(value?: string) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !equal(sign(payload), signature)) return false;
  try { const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp?: number }; return Boolean(claims.exp && claims.exp > Date.now() / 1000); } catch { return false; }
}

export async function hasSession() { return verifySession((await cookies()).get(SESSION_COOKIE)?.value); }
export function validPassword(value: string) { const expected = process.env.DASHBOARD_PASSWORD ?? ""; return expected.length >= 12 && equal(createHmac("sha256", secret()).update(value).digest("hex"), createHmac("sha256", secret()).update(expected).digest("hex")); }
export const sessionMaxAge = MAX_AGE;
