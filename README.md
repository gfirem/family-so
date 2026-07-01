# family-so — Family Operating System

A single place for Guille and his wife to **plan, decide, execute and measure** family life: meals, habits, training, goals and outings, built on three key pillars (sleep, train, eat) and the Atomic Habits methodology.

## Why it exists
They both work remotely from home. Without a plan of their own, the week goes by shut indoors and the weekend gets pulled into whatever plan shows up (beer, tobacco, sweets). This system fills that gap: if we have our own plan, there's nothing to resist.

## North star (3 months)
- G: 87 → 83 kg · Wife: 75 → 70 kg
- Arrive physically and mentally ready for the fertility process (IVF)
- Rebuild the good habits and, from there, expand to the 12 pillars of life

## Documentation
- [`docs/CONTEXT.md`](docs/CONTEXT.md) — **start here.** Full context to pick the project back up (human or coding agent).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — modules, habits layer and data model.
- [`docs/BACKLOG.md`](docs/BACKLOG.md) — features by module (v1/v2/v3).
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — build phases.
- [`docs/HEALTH-AND-CONSTRAINTS.md`](docs/HEALTH-AND-CONSTRAINTS.md) — health notes and product limits.
- [`reference/`](reference/) — the current plans (day, week, habits, meals) already improved, as seed content.

## Stack (v1)
- **Next.js (App Router) + TypeScript**, **Tailwind CSS v4** — Spanish UI, mobile-first.
- **Prisma 7** (Rust-free) + **PostgreSQL** via driver adapter — built for **Neon** in production.
- **Auth.js v5** — sign-in with **Google Workspace** (Google-only), with **Google Calendar** scopes.
- **Anthropic SDK** (`claude-opus-4-8`) — assistant chat that reads your real data.
- **MCP server** (`/api/mcp`) — exposes family-so data as tools for Claude.

## How to run locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill it in (see `.env.example` for the details):
   - `DATABASE_URL` (local Postgres or Neon)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (Google OAuth, with the Calendar API enabled)
   - `ALLOWED_EMAILS` / `GUILLE_EMAIL` / `CHINA_EMAIL` (the authorized Workspace accounts)
   - `APP_TIMEZONE` (time zone for Calendar events)
   - `ANTHROPIC_API_KEY` (optional; without it the chat is disabled)
   - `MCP_TOKEN` (optional; protects the MCP endpoint)
3. `npm run db:push` — creates the schema tables.
4. `npm run db:seed` — seeds the two people (by Workspace email), pillars, habits, recipes and plans from `reference/`.
5. `npm run dev` — the app runs at http://localhost:3000

> Sign-in is **Google Workspace only**: you log in with your authorized account (`ALLOWED_EMAILS`). The seed links each person to their email so habits and weight are individual.

### Set up Google OAuth (one time)
1. In Google Cloud → APIs & Services: create an **OAuth 2.0 Client ID** (type *Web application*) and enable the **Google Calendar API**.
2. Redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://<vercel-domain>/api/auth/callback/google`.
3. Paste `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` into `.env` (local) and into Vercel.

## Deployment (Vercel + Neon)
- Connect the repo to Vercel and create a database in Neon.
- Load the variables (`DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAILS`, `GUILLE_EMAIL`, `CHINA_EMAIL`, `APP_TIMEZONE`, `ANTHROPIC_API_KEY`, `MCP_TOKEN`) into Vercel.
- On the first deploy run `npm run db:push && npm run db:seed` against Neon.

## Module map
- **Dashboard** (`/`) — weight, habit %, "what derailed us".
- **Sunday planning** (`/planning`) — 7-block flow (the backbone).
- **Nutrition 1-2-12** (`/nutrition`) — recipes + weekly plan + shopping list.
- **Habits** (`/habits`) — per-person tracker, streak, "never miss twice", weight.
- **Goals** (`/goals`) — quarterly by pillar.
- **The day** (`/day`) — structure + 10-3-2-1-0 sleep.
- **Plans** (`/plans`) — plan bank + the "no" script.
- **Assistant** (`/chat`) — chat with Claude about your data.

> Known pending items (v1+): load the full 1-2-12 recipe book (PDF). Training is external (Freeletics), tracked with the "Did you train" habit. Real reminders via Google Calendar are deferred to v2.
