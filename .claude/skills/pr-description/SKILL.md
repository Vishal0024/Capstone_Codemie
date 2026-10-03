---
name: pr-description
description: The five required PR description sections (Summary, Changes Made, Test Evidence, Known Limitations, Reviewer Checklist) and the CHANGELOG entry format for Pro To-Do stories. Use in SDLC Step 8.
---

# PR Description & CHANGELOG

## PR body — exactly these five sections, real data only
```markdown
## Summary
<2–3 sentences: what was built and why> · Jira: [<KEY>](https://jiraeu.epam.com/browse/<KEY>)

## Changes Made
- `<file>` — <what changed and why> (every added/modified file; from `git diff --name-status main...HEAD`)

## Test Evidence
| Suite | Total | Passed | Failed |
AC coverage <n>/<n> · Docs check: <errors>/<warnings> · Full report: docs/sdlc/<KEY>/verification.md
<details><summary>Test run output</summary>

<paste the trimmed test run output from verification.md>
</details>

## Known Limitations
- <every "Not Found" item, out-of-scope point, open MAJOR/MINOR review finding — or "None">

## Reviewer Checklist
- [ ] Acceptance criteria verified against requirements.md
- [ ] Code review findings resolved (docs/sdlc/<KEY>/code-review.md)
- [ ] Tests and docs check passing (docs/sdlc/<KEY>/verification.md)
- [ ] No secrets, `.env`, `.github/` or data files changed
- [ ] README and CHANGELOG updated
```
Leave every checkbox unchecked.

## CHANGELOG entry
Keep a Changelog style in `CHANGELOG.md`, under `## [Unreleased]`:
```markdown
### Added
- <user-facing change> (<KEY>)
```
Use Added / Changed / Fixed as appropriate; one line per user-visible change.
