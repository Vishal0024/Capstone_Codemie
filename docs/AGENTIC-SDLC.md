# Agentic SDLC with Claude Code — Pro To-Do

This repository implements the capstone **"Agentic SDLC Use Case: Automated Documentation Sync"** with **Claude Code** in place of GitHub Copilot. The whole lifecycle, from a Jira User Story to a pull request ready for review, is driven by Claude Code **agents, prompts (slash commands), instructions (CLAUDE.md), skills and hooks**, with a human approval gate after every step. Every step produces a committed document, so the documentation stays in sync with the code at every step.

## Copilot → Claude Code mapping

| Capstone asks for (GitHub Copilot) | Implemented with (Claude Code) | Where |
|---|---|---|
| Copilot Chat / CLI / Agent Mode | Claude Code CLI (`codemie-claude`) or the VS Code extension | — |
| Agents (`.github/agents/*.agent.md`) | Subagents: 1 orchestrator + 8 step agents | `.claude/agents/` |
| Prompts (`.github/prompts/*.prompt.md`) | Slash commands: `/sdlc`, one per step, `/sdlc-status` | `.claude/commands/` |
| Instructions (`copilot-instructions.md`, `*.instructions.md`) | `CLAUDE.md` (project-wide) + scoped `docs/CLAUDE.md`, `tests/CLAUDE.md` | repo root, `docs/`, `tests/` |
| Skills | 8 skills (templates, checklists, integration rules) | `.claude/skills/` |
| Hooks | PreToolUse (guardrails), PostToolUse (audit/redaction), Stop (gate enforcement) | `.claude/hooks/`, `.claude/settings.json` |
| Read story from Jira | MCP server `atlassian` (EPAM Jira Data Center) | `.mcp.json` |
| Human in the loop | Approval gate after every step (`approve` / `revise:` / `fix` / `stop`) | orchestrator |

## The 8 steps

| # | Capstone step | Command | Agent | Skills | Output (committed) |
|---|---|---|---|---|---|
| 1 | Requirements — read the Jira story, **clarifying Q&A with the user** | `/sdlc-requirements` | `requirement-analyst` | jira-integration, requirements-analysis | `requirements.md` |
| 2 | Architecture — components, technology choices, data flow | `/sdlc-architecture` | `architecture` | architecture-design | `architecture.md` |
| 3 | Design Review — risks, gaps, agreed decisions; architecture updated | `/sdlc-design-review` | `design-review` → `architecture` | — | `design-review.md`, updated `architecture.md` |
| 4 | Implementation Planning — prioritised, dependency-ordered, blocked tasks | `/sdlc-plan` | `planning` | implementation-planning | `impl-plan.md` |
| 5 | Implementation — approved changes + unit tests | `/sdlc-implement` | `implementation` | — | code, unit tests, `implementation-notes.md` |
| 6 | Review — 7 review areas incl. dependency safety (`npm audit`) | `/sdlc-review` | `code-review` | code-review | `code-review.md` |
| 7 | Verify — unit + integration + E2E tests **and document quality check** | `/sdlc-verify` | `verification` | verification-suite | tests, `verification.md` |
| 8 | PR — 5-section description, CHANGELOG entry, reviewer checklist | `/sdlc-pr` | `pr` | pr-description, jira-integration | GitHub PR, `CHANGELOG.md`, README |

Run everything with `/sdlc <STORY-KEY>`. The orchestrator resumes from the committed artifacts.

## Guardrails (hooks)

| Hook | Enforces |
|---|---|
| **PreToolUse** | Blocks writes to `.env*`, `.github/` and user data files; literal secrets in files, commands or Jira requests; force-push, push to `main`, `gh pr merge`, `git reset --hard`; reading `.env`; commits whose staged changes contain protected files or secrets |
| **PostToolUse** | Redacted audit log (`.claude/logs/`); warns Claude when tool output contains a secret |
| **Stop** | A step cannot end at its gate unless its artifact exists and the gate question was asked |

Hook behaviour is covered by `npm run test:hooks` (46 tests). The document quality check is covered by `npm run test:docs` (9 tests).

## Evidence for reviewers
- `docs/sdlc/<STORY-KEY>/`: one committed artifact per step (see `git log -- docs/sdlc/<KEY>`).
- Feature branch commits `<type>(<KEY>): …`, the PR with its five sections, and the code-review comment on it.
- `CHANGELOG.md` entry and the Jira Story comment with the PR link.
- `.claude/logs/audit-*.jsonl` (local, gitignored): redacted log of every tool call.
