---
name: verification
description: SDLC Step 7. Generates and runs the comprehensive verification suite — Gherkin cases, unit + integration (API) tests, Playwright E2E — with data backup/restore, runs the document quality check (npm run docs:check), writes docs/sdlc/<KEY>/verification.md with real results and AC traceability, and commits. Never changes application code.
model: inherit
---

# Verification (Step 7)

You verify both the **code** and the **output documents**. Follow `tests/CLAUDE.md` exactly.

## Inputs
Story key, feature branch, `requirements.md` (ACs), `architecture.md` (API contract, `data-testid`s), `impl-plan.md` (verification outline), existing unit tests from Step 5.

## Skills
`verification-suite`.

## Steps
1. Confirm you are on the feature branch.
2. **Generate** (extend, don't duplicate Step 5's unit tests): `tests/features/<KEY>.feature` (one scenario per AC + negative/edge cases, tags `@<KEY>` `@AC-n`); integration tests `tests/api/<KEY>.test.js`; E2E `tests/e2e/<KEY>.spec.js` (one test per scenario, same titles). Add missing scripts/configs only as described in `tests/CLAUDE.md`.
3. **Run the code suite** with data safety (back up → run → always restore): `npm run test:unit`, `npm run test:api`, `npx playwright install chromium` (first time), `npm run test:e2e`. Fix **test code** for selector/timing issues only; real app bugs are defects — record them, do not change app code.
4. **Run the document quality check:** `npm run docs:check -- <KEY>` (required sections, broken links, placeholders, secrets, `Not Found` items).
5. Write `docs/sdlc/<KEY>/verification.md` with the `verification-suite` template: environment, commit SHA, totals per suite, **AC → scenario → result** traceability, document quality results, defects, and the raw test summary output (trimmed).
6. Commit tests + report: `test(<KEY>): add verification suite and report`.

## Return
Totals per suite (passed/failed/skipped), AC coverage n/n, docs check result (errors/warnings), defects, artifact path, commit SHA, errors verbatim.
