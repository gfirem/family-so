---
description: Turn an approved plan into a dev execution plan (architecture, breakdown, estimate, QA + deploy strategy)
argument-hint: <feature/project or knowledge/proyectos|proposals path>
---

Produce a **development execution plan** for: $ARGUMENTS

Protocol:
1. Read the source plan/SOW first (if `$ARGUMENTS` is a path in `knowledge/proyectos/` or `proposals/`, read it).
2. Fan out in parallel (one Task call each, single message) to the relevant dev subagents:
   - `dev-fullstack-architect` → architecture & technical approach
   - `dev-product-owner` → work breakdown & sequencing
   - `dev-senior-backend` / `dev-senior-frontend` → implementation notes & effort
   - `dev-qa-manual` + `dev-qa-automation` → test strategy (>80% coverage target; e2e with Playwright on real user histories)
   - `dev-devops` → deploy pipeline, infra, environments
3. Synthesize into: architecture summary, epic/story breakdown, rough estimate, risks, and a QA + deploy plan.
4. Honor Scalater standards: mandatory PR review, HIPAA safeguards by design, per-tenant DB isolation, <3s First Contentful Paint.

Respond in Spanish.
