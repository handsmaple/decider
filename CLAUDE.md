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
