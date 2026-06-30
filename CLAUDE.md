# family-so — Agent & Developer Guide

Read this before working in this repo.

## Language conventions (non-negotiable)
- **All code is in English**: comments, identifiers (variables, functions, types), object keys, commit messages, PR descriptions, docs, and **route paths/URLs** (e.g. `/nutrition`, `/habits`, `/goals`, `/day`, `/plans`).
- **The product UI is in Spanish**: every user-facing string literal stays in Spanish — JSX text, button labels, placeholders, `aria-*`, error messages rendered to users.
- **Seed/data content stays in Spanish**: habit names, recipe names, plan ideas, the "no" script, day-structure text, sleep rules.
- **The chat system prompt stays in Spanish** on purpose: the assistant must reply to the family in Spanish.

## Local environment ⚠️
- The local `.env` `DATABASE_URL` **points to the Neon PRODUCTION database**. Treat local as production for data.
- **Do NOT run destructive DB commands locally** (`db:push`, `db:seed`, `migrate:dev`, `migrate:deploy`) unless explicitly asked — they hit production. In particular **never run `migrate:dev` against the prod connection** (it resets/uses a shadow DB) — author migrations on a Neon dev branch (see Database migrations).
- To verify code changes safely, run `npm run build`. It runs `prisma generate` + type-check + compile and **does not touch the database**.
- All required env vars are already set in **local** and in **Vercel**: `DATABASE_URL`, `AUTH_SECRET`, `ANTHROPIC_API_KEY`, `MCP_TOKEN`. Schema migrations also need `DIRECT_DATABASE_URL` (Neon non-pooler endpoint) — set in local `.env` and as a GitHub Actions secret.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS v4.
- Prisma 7 (Rust-free) + PostgreSQL via the `pg` driver adapter. Connection comes only from `DATABASE_URL`.
- Auth.js v5 — Google Workspace sign-in (Google-only), with Google Calendar scopes. JWT session strategy; Google tokens kept in the JWT and refreshed in the jwt callback. Access is gated by `ALLOWED_EMAILS` / `ALLOWED_GOOGLE_DOMAIN`.
- Anthropic SDK (`claude-opus-4-8`) for the in-app assistant; MCP server at `/api/mcp`.

## Deploy
- Hosted on Vercel with the Neon database. The Vercel build (`vercel-build` = `build`) is **DB-free** (`prisma generate && next build`) — Vercel never mutates the schema.
- Schema changes are applied by the **`DB Migrate (prod)`** GitHub Actions workflow (`.github/workflows/migrate.yml`): on push to `main` that touches `prisma/migrations/**`, it runs `prisma migrate deploy` against Neon using the `DIRECT_DATABASE_URL` secret. It is serialized (`concurrency`) so migrations never race the Prisma advisory lock.

## Database migrations (Prisma Migrate)
- Migrations live in `prisma/migrations/` (committed, including `migration_lock.toml`). `0_init` is the baseline of the pre-migrations schema; production was marked applied with `prisma migrate resolve --applied 0_init`, so it is never re-run.
- **Authoring a change:** point the CLI at a **Neon dev branch** (`DIRECT_DATABASE_URL` = the branch's non-pooler URL), edit `schema.prisma`, then `npm run migrate:dev -- --name <change>` (v7 doesn't auto-generate; the script appends `prisma generate`). Review the generated SQL, commit `prisma/migrations/**` + `schema.prisma`. On merge to `main`, CI applies it to prod.
- The app runtime keeps using the pooled `DATABASE_URL` via the pg adapter in `lib/db.ts`; only the Prisma CLI uses the direct `DIRECT_DATABASE_URL`.

## Verify before pushing
- `npm run build` must pass (type-check + compile).
