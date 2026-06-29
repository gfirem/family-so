---
description: Convene a Scalater board review on a proposal or decision and produce a synthesized recommendation
argument-hint: <proposal, decision, or knowledge/|proposals/ path to review>
---

Run a structured Scalater **board review** on: $ARGUMENTS

Protocol:
1. **Frame** the proposal in 3-4 lines (problem, proposed move, what's being decided). If `$ARGUMENTS` points to a file in `knowledge/` or `proposals/`, read it first.
2. **Select** the 4-7 board members whose lens matters most for THIS decision — do not convene all 15 unless the decision truly warrants it. Available subagents: `.claude/agents/board-*` (and `compliance-*` if PHI/regulatory is involved).
3. **Fan out**: spawn the selected board subagents in parallel — one Task call each, all in a single message — so each analyzes independently in its own isolated context. Pass each the framed proposal.
4. **Synthesize**: collect their verdicts into a decision matrix (member → position → key reason). Surface agreements, conflicts, and the dominant risks.
5. **Recommend**: give the CEO a clear recommendation — Approve / Approve-with-conditions / Reject — with the 3 conditions or blockers that matter most.
6. **Record**: append a distilled outcome to `knowledge/memoria/board-sessions/` as `YYYY-MM-DD-<slug>.md` (use today's date) — decision, rationale, conditions, owners. Keep it short; this is the memory future sessions read instead of re-deriving the debate.

The COO (`agents/board/coo.md`) facilitates; the CEO holds the final decision. Respond in Spanish.
