# Install: Pro To-Do Agentic SDLC (Claude Code, 8 steps)

This guide installs the 8-step setup into your `ToDo-Application` repo, aligned with the capstone document. The overview for reviewers is in `docs/AGENTIC-SDLC.md`.

## What's in the package

| Path | Purpose |
|---|---|
| `CLAUDE.md` | Project configuration, the 8 steps, global rules |
| `.mcp.json` | `atlassian` MCP server, **Jira only** (EPAM Data Center) |
| `.env.example` | Variable name `JIRA_PERSONAL_TOKEN` only |
| `.claude/agents/` | `sdlc-orchestrator` + 8 step agents: requirement-analyst, architecture, design-review, planning, implementation, code-review, verification, pr |
| `.claude/commands/` | `/sdlc`, `/sdlc-status`, and one command per step (`/sdlc-requirements` … `/sdlc-pr`) |
| `.claude/skills/` | 8 skills: jira-integration, mcp-retry-policy, requirements-analysis, architecture-design, implementation-planning, code-review, verification-suite, pr-description |
| `.claude/hooks/` | PreToolUse, PostToolUse, Stop (Node scripts) |
| `.claude/prompts/story-input.prompt.md` | Template for the Jira Story |
| `.claude/settings.json` | Permissions, hooks, MCP enablement |
| `scripts/check-docs.mjs` | Document quality check (Step 7) |
| `docs/AGENTIC-SDLC.md` | Copilot → Claude mapping and pipeline overview |
| `docs/CLAUDE.md`, `tests/CLAUDE.md` | Scoped instructions |
| `tests/hooks/`, `tests/docs/` | 55 Jest tests for the hooks and the docs checker |
| `gitignore-additions.txt` | Lines to append to `.gitignore` (not a file to copy) |

---

## 1. Remove the previous build (only if you installed it)

From the repo root:

```powershell
Remove-Item .claude\agents\documentation.md, .claude\agents\test-verification.md -ErrorAction SilentlyContinue
Remove-Item .claude\skills\confluence-publisher -Recurse -ErrorAction SilentlyContinue
```

The old CodeMie command `.claude\commands\protodo-sdlc.md` should also go:

```powershell
New-Item -ItemType Directory -Force docs\archive | Out-Null
Move-Item .claude\commands\protodo-sdlc.md docs\archive\ -ErrorAction SilentlyContinue
```

## 2. Copy the files

Unzip into a temporary folder, then run from that folder:

```powershell
$repo = "C:\Users\vishal_bansal\Desktop\ToDo-Application"
Copy-Item CLAUDE.md, .mcp.json, .env.example, INSTALL-CLAUDE-SDLC.md $repo -Force
Copy-Item .claude\agents, .claude\skills, .claude\hooks, .claude\commands, .claude\prompts "$repo\.claude" -Recurse -Force
Copy-Item .claude\settings.json "$repo\.claude\settings.json" -Force
New-Item -ItemType Directory -Force "$repo\scripts", "$repo\docs", "$repo\tests\hooks", "$repo\tests\docs" | Out-Null
Copy-Item scripts\check-docs.mjs "$repo\scripts\" -Force
Copy-Item docs\CLAUDE.md, docs\AGENTIC-SDLC.md "$repo\docs\" -Force
Copy-Item tests\CLAUDE.md "$repo\tests\" -Force
Copy-Item tests\hooks\hooks.test.js "$repo\tests\hooks\" -Force
Copy-Item tests\docs\check-docs.test.js "$repo\tests\docs\" -Force
```

Your `settings.local.json` is not touched.

## 3. Update `.gitignore` and `package.json`

1. Append the lines from `gitignore-additions.txt` to `.gitignore`, skipping any already there.
2. In `package.json` → `scripts`, add these (keep your existing `start`, `build`, `test:api`, `test:e2e`):
   ```json
   "test:unit": "jest tests/unit --passWithNoTests",
   "test:hooks": "jest tests/hooks",
   "test:docs": "jest tests/docs",
   "docs:check": "node scripts/check-docs.mjs"
   ```
3. If `jest` isn't installed: `npm install --save-dev jest@29`.

## 4. Test the setup

```powershell
npm run test:hooks
npm run test:docs
```

Expected: **46 passed** and **9 passed**.

## 5. Commit the pipeline to `main`

This is the one-time setup commit, before any story. The PreToolUse hook only blocks pushes made by Claude; this push is yours.

```powershell
git add CLAUDE.md .mcp.json .env.example INSTALL-CLAUDE-SDLC.md .claude scripts docs tests .gitignore package.json package-lock.json
git status
git commit -m "chore: add Claude Code agentic SDLC pipeline"
git push
```

Check that `git status` doesn't list `.claude/settings.local.json`, `.env` or data files before committing.

## 6. Check inside Claude Code

```powershell
codemie-claude
```

| Command | Expected |
|---|---|
| `/mcp` | `atlassian` connected |
| `/agents` | `sdlc-orchestrator` + 8 step agents |
| `/hooks` | PreToolUse, PostToolUse, Stop |
| Type `/sdlc` | Lists `/sdlc`, `/sdlc-status` and the 8 `/sdlc-…` step commands |

**Live hook check:** ask `create a file named .env with TEST=1`. It must be blocked with a `[pro-todo hook]` message.

## 7. Write the Story and run

1. Create a small **Story** in `EPMCDMETST` using `.claude/prompts/story-input.prompt.md`.
2. Start from a clean `main`: `git checkout main; git pull; git status`.
3. Run `/sdlc EPMCDMETST-<number>`.

| Step | What happens | You reply |
|---|---|---|
| 1 Requirements | Clarifying questions first → you answer (or `use defaults`) → `requirements.md` committed on the new branch | `approve` |
| 2 Architecture | `architecture.md` committed | `approve` |
| 3 Design Review | Findings + proposed decisions → you agree → `architecture.md` updated → confirm | `approve` (twice if the design changes) |
| 4 Planning | `impl-plan.md` (priorities, dependency order, blocked tasks) | `approve` |
| 5 Implementation | Code + unit tests, commits on the branch | `approve` |
| 6 Review | `code-review.md`: 7 areas + `npm audit` | `approve` or `fix` |
| 7 Verify | Unit/API/E2E tests + document quality check, `verification.md` | `approve` |
| 8 PR | README + CHANGELOG, push, PR with 5 sections, Jira comment | `approve`, then **you merge** |

Single steps: `/sdlc-requirements <KEY>`, `/sdlc-review <KEY>` and so on. Progress: `/sdlc-status <KEY>`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Hooks don't run | Start Claude Code from the repo root; check `/hooks` |
| A legitimate command is blocked | Read the `[pro-todo hook]` message. If it's too strict, send me the command and I'll adjust the rule and its test. |
| Turn won't end ("Stage n is awaiting approval…") | The Stop hook wants the artifact or the gate question. Let Claude fix it, or delete `.claude\state\sdlc-state.json` to reset. |
| `docs:check` fails at Step 7 | Read the listed errors (missing section, broken link, TODO). Reply `revise: fix the document issues` at Gate 7. |
| Jira 401 | Check `JIRA_PERSONAL_TOKEN`, then restart VS Code completely |
