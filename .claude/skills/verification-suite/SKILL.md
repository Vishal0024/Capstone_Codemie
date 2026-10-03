---
name: verification-suite
description: How to build and report the Step 7 verification suite — Gherkin, unit, integration (API) and E2E tests plus the document quality check — and the verification.md template. Use in SDLC Step 7.
---

# Verification Suite

## Code verification
| Level | Location | Runner | Must cover |
|---|---|---|---|
| Unit (from Step 5, extend if gaps) | `tests/unit/` | `npm run test:unit` | Pure logic, happy path, "Not Found"/missing-field, invalid input |
| Integration (API) | `tests/api/<KEY>.test.js` | `npm run test:api` | Every new/changed endpoint: success, 400 validation, 401 auth, user isolation |
| E2E | `tests/e2e/<KEY>.spec.js` | `npm run test:e2e` | One test per Gherkin scenario (same title), incl. empty/missing data |
| Test cases | `tests/features/<KEY>.feature` | — (traceability) | One scenario per AC + negative/edge |

Always back up and restore `todos.json`, `users.json`, `sessions.json` around API/E2E runs.

## Document verification
`npm run docs:check -- <KEY>` checks every artifact in `docs/sdlc/<KEY>/` (plus `README.md`, `CHANGELOG.md` if present) for: required sections, broken relative links, leftover placeholders (`TODO`, `TBD`, `<…>`), secret-like values, and lists every `Not Found`. Errors fail the step; warnings are reported.

## Template (`verification.md`)
```markdown
# <KEY> – Verification
Branch: … · Commit: <sha> · Date: … · Environment: Windows, Node <v>, Chromium <v>

## 1. Summary
| Suite | Total | Passed | Failed | Skipped | Duration |
## 2. Acceptance Criteria Traceability
| AC | Scenario | Unit | Integration | E2E | Result |
## 3. Document Quality Check
| Document | Errors | Warnings | Not Found items |
## 4. Defects
| ID | Severity | Description | Found by |
## 5. Test Run Output (trimmed)
```
