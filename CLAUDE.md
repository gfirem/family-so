# family-so — Agent & Developer Guide

Read this before working in this repo.

## Language conventions (non-negotiable)
- **All code is in English**: comments, identifiers (variables, functions, types), object keys, commit messages, PR descriptions, docs, and **route paths/URLs** (e.g. `/nutrition`, `/habits`, `/goals`, `/day`, `/plans`).
- **The product UI is in Spanish**: every user-facing string literal stays in Spanish — JSX text, button labels, placeholders, `aria-*`, error messages rendered to users.
- **Seed/data content stays in Spanish**: habit names, recipe names, plan ideas, the "no" script, day-structure text, sleep rules.
- **The chat system prompt stays in Spanish** on purpose: the assistant must reply to the family in Spanish.

## Local environment ⚠️
- The local `.env` `DATABASE_URL` **points to the Neon PRODUCTION database**. Treat local as production for data.
- **Do NOT run destructive DB commands locally** (`db:push`, `db:seed`, `db:migrate`) unless explicitly asked — they hit production.
- To verify code changes safely, run `npm run build`. It runs `prisma generate` + type-check + compile and **does not touch the database**. (The DB-touching `db push` lives in `vercel-build`, which only Vercel runs — see Deploy.)
- All required env vars are already set in **local** and in **Vercel**: `DATABASE_URL`, `AUTH_SECRET`, `ANTHROPIC_API_KEY`, `MCP_TOKEN`. No need to ask for them again.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS v4.
- Prisma 7 (Rust-free) + PostgreSQL via the `pg` driver adapter. Connection comes only from `DATABASE_URL`.
- Auth.js v5 — Google Workspace sign-in (Google-only), with Google Calendar scopes. JWT session strategy; Google tokens kept in the JWT and refreshed in the jwt callback. Access is gated by `ALLOWED_EMAILS` / `ALLOWED_GOOGLE_DOMAIN`.
- Anthropic SDK (`claude-opus-4-8`) for the in-app assistant; MCP server at `/api/mcp`.

## Deploy
- Hosted on Vercel with the Neon database. Vercel runs the **`vercel-build`** script, which runs `prisma db push --skip-generate` **only when `VERCEL_ENV=production`** — so the schema is applied to Neon on production deploys, while preview deploys just `prisma generate && next build` and never mutate the production schema. `db push` (without `--accept-data-loss`) refuses destructive changes and fails the deploy, so only additive/safe schema changes apply automatically — destructive ones must be handled deliberately.
- The plain `build` script (no `db push`) is what GitHub Actions CI and local verification use, so they never touch the database.

## Verify before pushing
- `npm run build` must pass (type-check + compile).
