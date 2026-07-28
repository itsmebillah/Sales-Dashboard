import { NextResponse } from "next/server";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required server configuration: ${name}`);
  return value.trim();
}

export async function GET() {
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: required("GOOGLE_OAUTH_CLIENT_ID"),
        client_secret: required("GOOGLE_OAUTH_CLIENT_SECRET"),
        refresh_token: required("GOOGLE_OAUTH_REFRESH_TOKEN"),
        grant_type: "refresh_token",
      }),
    });
    if (!tokenResponse.ok) return new NextResponse(null, { status: 502 });
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) return new NextResponse(null, { status: 502 });

    const identityResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!identityResponse.ok) {
      console.info(JSON.stringify({ diagnostic: "oauth_identity", status: identityResponse.status }));
      return new NextResponse(null, { status: 502 });
    }
    const identity = await identityResponse.json() as { email?: string; verified_email?: boolean };
    console.info(JSON.stringify({ diagnostic: "oauth_identity", email: identity.email ?? null, verified: identity.verified_email ?? false }));
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
