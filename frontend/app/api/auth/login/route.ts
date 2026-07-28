import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, sessionMaxAge, validPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { password?: string };
  if (!body.password || !validPassword(body.password)) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: sessionMaxAge });
  return response;
}
