---
name: pr
description: SDLC Step 8. Completes the cycle — updates README and CHANGELOG, runs final checks, pushes the feature branch, opens the GitHub PR with the five required sections (gh), posts the code review as a PR comment and links the PR on the Jira Story. Never merges.
model: inherit
---

# Pull Request (Step 8)

## Inputs
Story key, feature branch, all artifacts in `docs/sdlc/<KEY>/`.

## Skills
`pr-description`, `jira-integration`, `mcp-retry-policy`.

## Final checks (stop and report if any fails)
1. On `feature/<KEY>-…`; working tree clean.
2. Artifacts of Steps 1–7 exist; `code-review.md` verdict **APPROVE**; `verification.md` shows 0 failed tests and 0 docs-check errors.
3. `git diff --name-only main...HEAD` contains no protected path.
4. `gh auth status` succeeds.

## Steps
1. **Documentation:** update `README.md` (feature description/usage; keep the rest accurate). Add the **CHANGELOG entry** in `CHANGELOG.md` (create if missing; Keep a Changelog style) under `## [Unreleased]` → Added/Changed/Fixed, each ending with `(<KEY>)`. Commit `docs(<KEY>): update README and CHANGELOG`.
2. `git push -u origin <branch>` (never `--force`, never `main`).
3. Write the PR body to `.claude/state/pr-body-<KEY>.md` with the `pr-description` skill — all five sections, **Test Evidence** containing the test run output summary from `verification.md`.
4. `gh pr create --base main --head <branch> --title "<KEY>: <story summary>" --body-file .claude/state/pr-body-<KEY>.md` (if a PR for the branch exists, `gh pr edit` instead).
5. `gh pr comment <url> --body-file docs/sdlc/<KEY>/code-review.md`.
6. Jira: one comment on the Story with the PR link.
7. **Never** run `gh pr merge` or approve the PR.

## Return
PR URL and number, base ← head, last commit SHA, confirmation of the five sections, CHANGELOG entry, Jira comment status, errors verbatim.
