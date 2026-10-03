# Pro To-Do — Agentic SDLC with Claude Code

This repository is the **Pro To-Do** web app. Feature work follows an 8-step agentic SDLC (requirements → PR) driven entirely by Claude Code agents, commands (prompts), instructions (`CLAUDE.md`), skills and hooks, with a human approval gate after every step. Run the full pipeline with `/sdlc <STORY-KEY>`, or one step with its command (see table). Overview for reviewers: `docs/AGENTIC-SDLC.md`.

## Project Configuration (single source of truth)

All agents, skills, hooks and commands read these values from here. Change them only in this section.

| Key | Value |
|---|---|
| GitHub repository | `Vishal0024/Capstone_Codemie` (https://github.com/Vishal0024/Capstone_Codemie) |
| Default branch | `main` |
| Feature branch | `feature/<STORY-KEY>-<short-kebab-name>` (created in Step 1) |
| Jira instance | `https://jiraeu.epam.com` (Jira **Data Center**) |
| Jira project key | `EPMCDMETST` |
| Jira issue links | `https://jiraeu.epam.com/browse/<ISSUE-KEY>` |
| Jira Epic Link field | `customfield_14500` (never `customfield_10014`, that is Jira Cloud) |
| SDLC artifact folder | `docs/sdlc/<STORY-KEY>/` |
| SDLC state file | `.claude/state/sdlc-state.json` (local only, gitignored) |
| Integrations | MCP server `atlassian` (Jira, see `.mcp.json`); GitHub via `git` and `gh` CLI |

Credentials are never stored in this repository: `JIRA_PERSONAL_TOKEN` is a user environment variable (see `.env.example`).

## Application

- **Backend:** Node.js + Express 4 — `todoServer.js` (port 3000).
- **Frontend:** vanilla HTML/CSS/JS — `index.html`, `public/script.js`, `public/styles.css`. No frameworks.
- **Storage:** JSON files `todos.json`, `users.json`, `sessions.json` — user data: never commit them; back up and restore them around test runs.
- **Auth:** session token in the `Authorization` header.
- **Build:** `npm run build` → `scripts/build.ps1` → `dist/pro-todo-<version>.zip`.
- **Tests:** Jest + supertest (unit/API), Playwright/Chromium (E2E), Gherkin `.feature` files. See `tests/CLAUDE.md`.
- **Docs quality check:** `npm run docs:check -- <STORY-KEY>` (`scripts/check-docs.mjs`).

## Environment

- Windows + PowerShell, VS Code (integrated terminal or Claude Code extension), Node.js + npm. Give PowerShell-compatible commands.
- Claude Code is launched with `codemie-claude` (model access via EPAM CodeMie); all project configuration is plain Claude Code.
- Local only, via npm on localhost. **No Docker.**
- Network: if `npm`, `npx` or `uvx` fail with `ETIMEDOUT` on an IPv6 address, set `$env:NODE_OPTIONS = "--dns-result-order=ipv4first"` or ask the user to apply the Windows IPv4 preference.

## The 8 SDLC Steps & Human Gates

Input: a **human-written Jira Story** in `EPMCDMETST` (user story + numbered acceptance criteria). The orchestrator (`.claude/agents/sdlc-orchestrator.md`) runs in the main conversation, delegates each step to its subagent, and never starts the next step without explicit approval. Each step **commits** its artifact on the feature branch.

| # | Step | Command | Subagent | Artifact in `docs/sdlc/<STORY-KEY>/` |
|---|---|---|---|---|
| 1 | Requirements (with clarifying Q&A) | `/sdlc-requirements` | `requirement-analyst` | `requirements.md` |
| 2 | Architecture | `/sdlc-architecture` | `architecture` | `architecture.md` |
| 3 | Design Review (+ architecture update) | `/sdlc-design-review` | `design-review` → `architecture` | `design-review.md` (+ updated `architecture.md`) |
| 4 | Implementation Planning | `/sdlc-plan` | `planning` | `impl-plan.md` |
| 5 | Implementation (code + unit tests) | `/sdlc-implement` | `implementation` | `implementation-notes.md` |
| 6 | Review (7-area code review) | `/sdlc-review` | `code-review` | `code-review.md` |
| 7 | Verify (tests + document quality) | `/sdlc-verify` | `verification` | `verification.md` |
| 8 | PR (description, CHANGELOG, checklist) | `/sdlc-pr` | `pr` | GitHub PR, `CHANGELOG.md` |

Gate replies: `approve` (continue), `revise: <feedback>` (redo the step), `fix` (Gate 6 only: blockers back to Step 5), `stop` (pause; `/sdlc <KEY>` resumes from existing artifacts).

## Global Rules (all agents)

1. **No simulation.** Never invent Jira keys, URLs, PR numbers, commit SHAs or test results. If a tool fails, apply the `mcp-retry-policy` skill, then show the exact error and stop for the human.
2. **Human in the loop.** Only changes approved at a gate are applied. Any change outside the Story and the approved plan needs separate, explicit approval, recorded in the step's artifact.
3. **Protected paths.** Never create, modify or commit `.env*` (except `.env.example`), secrets or tokens, anything under `.github/`, or `todos.json` / `users.json` / `sessions.json`. The PreToolUse hook enforces this.
4. **Git safety.** Work only on the feature branch. Never push to `main`, force-push, rewrite history or merge a PR — the human merges.
5. **Commits.** `<type>(<STORY-KEY>): <summary>`, e.g. `docs(EPMCDMETST-123): add requirements`, `feat(EPMCDMETST-123): show due date on task cards`.
6. **Pull request body.** Exactly five sections: **Summary**, **Changes Made**, **Test Evidence**, **Known Limitations**, **Reviewer Checklist** (unchecked).
7. **Traceability.** Branch, commits, PR title, `CHANGELOG.md` and every artifact carry the story key; requirements (FR/AC) are traced through design, plan, tests and review.
8. **"Not Found".** When information is missing (e.g. a Jira field, a value the Story does not state), write `Not Found` instead of guessing, and list it under open questions / Known Limitations.

Scoped rules: `docs/CLAUDE.md` (artifacts) and `tests/CLAUDE.md` (testing) apply automatically in those folders.
