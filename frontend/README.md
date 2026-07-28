# Sales Intelligence Frontend

Standalone mobile-first Next.js consumer for the Sales Intelligence Platform.

## Architecture

- Next.js App Router and TypeScript
- Tailwind CSS
- Recharts using live KPI contracts
- Same-origin public `/api/kpi` projection backed by the private Apps Script Execution API
- No Google Sheets SDK, direct Sheet read, mock data, or hardcoded KPI value

## Commands

```bash
npm install
npm run check
npm run dev
```

## Required Vercel environment variables

- `APPS_SCRIPT_DEPLOYMENT_ID` (the API executable deployment ID, not Script ID)
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REFRESH_TOKEN`
All variables are server-only. The browser communicates exclusively with
same-origin Next.js routes and never receives an Apps Script URL or credential.
