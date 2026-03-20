# Global Development Preferences
## Workflow
- Think step-by-step before writing code. When a task touches more than two files, outline the plan first and confirm before implementing.
- Prefer reading the relevant code and tests before making changes. Don't guess at interfaces — verify them.
- After a series of edits, run the project's type checker and/or linter before reporting the task as done.
- Run the single most relevant test after a change, not the entire test suite, unless I ask for full coverage.
- Commit work in small, logical units. Write commit messages in imperative mood describing *what* the change does and *why*.

## Code Quality
- Write the simplest code that solves the problem. Avoid premature abstraction — duplicate a little rather than introduce the wrong abstraction.
- Functions should do one thing. If a function needs a comment explaining a section, that section should probably be its own function.
- Naming matters more than comments. Choose names that make the code self-documenting.
- Handle errors explicitly. Don't swallow errors silently or throw generic messages. Surface the context needed to debug.
- Respect existing patterns in the codebase. Match the style, conventions, and architecture that's already there rather than introducing new paradigms.

## Communication
- Be direct and concise. Skip preamble like "Great question!" and filler recaps of what I just said.
- When something is ambiguous, ask a short clarifying question rather than guessing wrong.
- If you hit a dead end or realize an approach won't work, say so immediately instead of continuing down a failing path.
- When suggesting tradeoffs, state them plainly: what I gain, what I give up.

## Things to Avoid
- Don't add dependencies for things achievable in a few lines of code.
- Don't refactor surrounding code unless it's required by the task or I explicitly ask for it.
- Don't generate placeholder or dummy implementations and call the task done. If something can't be fully implemented, flag what's missing.
- Don't overwrite or reformat files beyond the scope of the change. Minimize diff noise.
- Never commit secrets, credentials, or .env files.

---

# Project: Decider

## What It Is
A TypeScript library that runs questions through a diverse panel of AI personas and synthesizes their responses. Each persona encodes age, geography, worldview, job, education, and interests — the goal is authentic perspective diversity on contested questions.

## Tech Stack
- **Language:** TypeScript (strict, ESM)
- **Runtime:** Node.js
- **AI:** `@anthropic-ai/sdk` — default model `claude-opus-4-6`
- **Build:** `tsc` / `tsx` for CLI entry
- **No UI framework** — pure library + lightweight HTTP server (`src/server/`)

## Architecture
- `src/personas/` — 50 persona definitions + dimension types + distribution tooling
- `src/deliberation/` — core engine: panel selection, prompt building, API orchestration, synthesis
- `src/index.ts` — public API surface (clean re-exports only)
- Parallel persona calls via `Promise.allSettled()` — partial failures are tolerated, not fatal
- Deterministic panel selection: FNV-1a hash of question → Mulberry32 PRNG → Fisher-Yates shuffle → diversity guarantee

## Key Design Decisions (Decision Log)
- Gender dimension removed — too sensitive, added little signal
- `FailedPersona` named type added for consumers
- Synthesis capped at 300 max_tokens (V1.5: expose as `DeliberationOptions` field)
- Concise persona responses: 256 tokens default — verbose answers hurt synthesis quality
- No external deps beyond SDK — PRNG, hash, shuffle all hand-rolled

## Progress Tracker

### Phase 1 — Core Library ✅
Persona types, 50 personas, deliberation engine, synthesis, diversity guarantee, graceful failures, re-roll support

### Phase 2 — API Route + SSE ✅
Expose deliberation over HTTP with streaming (SSE) so a UI can consume it

### Phase 3 — Parliament Bar ✅
Visual component showing persona panel composition by dimension (mobile: ParliamentBar + DimensionBreakdown)

### Phase 4 — Reveal + Pie Chart ⬜
Animated reveal of persona responses + chart breakdown

### Phase 5 — Stats + Drawer ✅
Summary stats panel and expandable persona detail drawer (mobile: PersonaCard expand/collapse + stats footer)

### Phase 6 — Home Page + Tier Gating ⬜
Landing page, question input, subscription tier enforcement

### Phase 7 — Polish + Mobile ⬜
Responsive layout, transitions, tier upgrade modal

## V1.5 Backlog (post-MVP)
- Expose `maxTokensSynthesis` as a `DeliberationOptions` field
- Remove `buildPersonaPrompt` from public API surface
- Persona customization for high-tier subscribers
- Theme clustering on the results page
- Caching / persistence layer for repeated questions
- Test suite (unit tests for panel selection, hash, shuffle)
