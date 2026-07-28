# Sales Intelligence Frontend

Standalone mobile-first Next.js consumer for the Sales Intelligence Platform.

## Architecture

- Next.js App Router and TypeScript
- Tailwind CSS
- Recharts using live KPI contracts
- Same-origin authenticated `/api/kpi` proxy to the owner-only Apps Script Execution API
- No Google Sheets SDK, direct Sheet read, mock data, or hardcoded KPI value

## Commands

```bash
npm install
npm run check
npm run dev
```

## Required Vercel environment variables

- `APPS_SCRIPT_ID`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REFRESH_TOKEN`
- `DASHBOARD_PASSWORD` (minimum 12 characters)
- `SESSION_SECRET` (minimum 32 characters)

All variables are server-only. The browser communicates exclusively with
same-origin Next.js routes and receives an HTTP-only signed session cookie.
