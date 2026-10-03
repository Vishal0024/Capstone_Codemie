# EPMCDMETST-67543 – Code Review
Story: [EPMCDMETST-67543](https://jiraeu.epam.com/browse/EPMCDMETST-67543) · Branch: `feature/EPMCDMETST-67543-card-created-edited-dates` · Base: `main` · Artifacts: [requirements.md](requirements.md) (`58dfc33`), [architecture.md](architecture.md) (`098a1af`), [design-review.md](design-review.md) (`5d70e26`), [impl-plan.md](impl-plan.md) (`e0ca5b7`), [implementation-notes.md](implementation-notes.md) (`9113d61`) · Date: 2026-10-04

## 1. Scope

`git diff main...HEAD` (10 commits, 8 files). Code reviewed in full:

| File | Change | Commit |
|---|---|---|
| `public/script.js` | +59 / −3: constants `EDITED_THRESHOLD_MS`, `CARD_MONTHS`; pure helpers `parseCardDate`, `formatCardDate`, `getCardDates` (lines 46–74); DOM builder `buildTodoDates` (lines 76–98); `renderTodos` timestamp block replaced by one call (line 125); guarded Node export (lines 556–559) | `7eef3cb` |
| `public/styles.css` | +8 / −1: `.todo-timestamp` colour `#bbb` → `#6b7280` (line 160, OOS-1); `.todo-date { white-space: nowrap }` (lines 163–165); new `@media (max-width: 480px)` (lines 434–437) | `b03a48d` |
| `tests/unit/EPMCDMETST-67543.test.js` | new, 196 lines, 51 Jest cases | `c05a389` |
| `docs/sdlc/EPMCDMETST-67543/*.md` | SDLC artifacts Steps 1–5 | `58dfc33` … `9113d61` |

Context read: `renderTodos` and its callers, both `fetchAndRenderTodos` declarations (lines 31 and 275), `index.html` script tag, `todoServer.js` imports, `package.json`, `scripts/check-docs.mjs`.

Not changed (verified with `git diff --name-only main...HEAD`): `todoServer.js`, `index.html`, `package.json`, `package-lock.json`, `.github/`, `.env*`, `todos.json`, `users.json`, `sessions.json`.

## 2. Review Areas

| Area | Review question | Result | Notes |
|---|---|---|---|
| Correctness | Does each component behave as specified in `requirements.md`? | ✅ | Every FR traced to code (Section 5). Label texts exactly "Created DD Mon YYYY", "Edited DD Mon YYYY", "Created: Not available" (FR-001, FR-003, FR-006). Fixed English month array and local-time getters, no locale API (FR-002). Edited only when both dates valid and `updated − created > 1000` ms (FR-004/FR-005); ternary precedence checked: `(created && updated && diff > 1000) ? … : null`. Old `Created: … \| Updated: …` `toLocaleString()` line removed (FR-010). Existing todos without the fields fall back without throwing. Known edge cases (years outside 1000–9999, date-only strings, numeric timestamps) are the accepted D-10 limitations (CR-04). |
| Security | Are secrets excluded from output? Is user input validated? | ✅ | All new text is set with `textContent` (`script.js` lines 85, 90, 95); no `innerHTML`, `insertAdjacentHTML` or template HTML built from todo data; `data-testid` and class values are constants. Separator not `aria-hidden` (D-6). No new user input, endpoint, storage or credential handling; no secrets in the diff. |
| Error Handling | Are all API failures, missing files, and empty data handled gracefully? | ✅ | `parseCardDate` rejects absent / `null` / empty / whitespace / non-string-or-number / NaN values and never throws; `getCardDates` tolerates `null`, `undefined` and non-object todos. No new API call, file access or fetch path; empty list and fetch failures keep their pre-existing handling in `renderTodos` / `fetchAndRenderTodos`. |
| Test Coverage | Do tests cover the happy path AND the "Not Found" / missing-field edge cases? | ⚠️ | `npm run test:unit`: 51/51 passed. Happy path, zero padding, all 12 months, local-midnight 00:30 / 23:30, 1 / 500 / 1000 / 1001 ms threshold, ±1 day, invalid/missing `createdAt` and `updatedAt`, null todo and "no Invalid Date/NaN/undefined" are covered; no `.only`/`.skip`. Gap: the DOM builder `buildTodoDates` (FR-008, FR-009, FR-011, D-6, D-8) and AC-005 have no automated test yet; by design these are Step 7 E2E (T-11, D-12) — CR-01. Coverage of `script.js` cannot be measured with the vm loader — CR-03. |
| Code Clarity | Are function names self-explanatory? Is logic easy to follow without comments? | ✅ | Small single-purpose functions with clear names and one-line contract comments; named threshold constant; no nesting beyond one `if`; no dead code or debug logs added. Minor test-setup redundancy (CR-02). Pre-existing `console.log` calls and the literal `×` (line 382) are untouched (CR-06, known limitation). |
| DRY | Is there duplicated logic that can be refactored into a shared function? | ✅ | Formatting and validity logic exists once and is reused for both dates; the two date `span`s differ only in test id and text. No existing date helper in the codebase was duplicated. Pre-existing duplicate `fetchAndRenderTodos` (lines 31 and 275) not refactored per D-11 (CR-05, INFO). |
| Dependency Safety | Are any known-vulnerable package versions present? | ⚠️ | No dependency added or changed by this branch (`package.json` / `package-lock.json` unchanged; Playwright is OOS-2, Step 7, not yet installed as expected). `npm audit` reports pre-existing issues only: 1 moderate production (`uuid` < 11.1.1) and 30 high in dev tooling (`braces`) — CR-07. Not introduced by this story. |

## 3. Findings

| ID | Area | Severity | File:line | Issue | Recommendation |
|---|---|---|---|---|---|
| CR-01 | Test Coverage | MINOR | `public/script.js:77-98`, `public/styles.css:434-437` | `buildTodoDates` (DOM structure, `data-testid` hooks, separator text, absence of `todo-edited`), the 480px layout (FR-009) and the no-reload refresh (AC-005) have no automated test on this branch. Planned for Step 7 E2E (T-11, D-3, D-12); not a gap in Step 5 scope. | In Step 7 assert `todo-dates` / `todo-created` / `todo-edited` (absent when not edited), separator text `" · "`, no "Updated:" text, and stacked dates at ≤ 480px, as listed in D-12. |
| CR-02 | Code Clarity | MINOR | `tests/unit/EPMCDMETST-67543.test.js:13-15` | The three stubs are assigned to `global.*` although the vm wrapper receives them as parameters (line 23); the global assignment is redundant and leaks the stubs into the test file's global scope. | Use local `const` stubs and pass them to `fn(...)`; or leave as is (harmless, isolated per Jest worker). |
| CR-03 | Test Coverage | MINOR | `tests/unit/EPMCDMETST-67543.test.js:17-25` | Loading via `vm.runInThisContext` (approved OOS-3) bypasses Jest's transform, so `jest --coverage` cannot report line coverage for `public/script.js`. | Accept per OOS-3; state in `verification.md` that coverage percentages for `script.js` are Not Found and rely on the case list instead. |
| CR-04 | Correctness | MINOR | `public/script.js:59-62` | `formatCardDate` does not pad years < 1000 and a date-only ISO string is parsed as UTC midnight (may show the previous day west of UTC); numeric timestamps are accepted. All are recorded known limitations (D-10). | No code change; keep D-10 in the PR Known Limitations. |
| CR-05 | DRY | INFO | `public/script.js:31`, `public/script.js:275` | Pre-existing duplicate `fetchAndRenderTodos` declaration (the later one wins). Not introduced here; refactor forbidden in this story (D-11). Also the reason for OOS-3. | Raise a separate follow-up story to remove the duplicate; then the unit test can switch back to `require` (D-9). |
| CR-06 | Code Clarity | INFO | `public/script.js:39`, `public/script.js:283`, `public/script.js:382` | Pre-existing `console.log(resp)` debug logs and the literal `×` character (only non-ASCII bytes in the file). Untouched by this branch; the diff itself is ASCII-only. | Follow-up clean-up outside this story. |
| CR-07 | Dependency Safety | MINOR | `package.json` (`dependencies.uuid ^9.0.0`; `devDependencies.nodemon`, `jest`) | Pre-existing: `uuid` < 11.1.1 moderate (GHSA-w5hq-g745-h8pq, v3/v5/v6 with `buf`); fix only via semver-major 14.0.2. `uuid` is not required anywhere in `todoServer.js` (ids use `crypto`), so it is not reachable. 30 high in dev tooling from `braces` (GHSA-vfj7-8cjw-p6xm) via the `jest` / `nodemon` chains. None added by this branch. | Follow-up story: remove the unused `uuid` dependency and upgrade dev tooling. No change in this story. |

Counts: BLOCKER 0 · MAJOR 0 · MINOR 5 (CR-01, CR-02, CR-03, CR-04, CR-07) · INFO 2 (CR-05, CR-06).

## 4. Design Decision Checks

| Decision | Check | Result |
|---|---|---|
| D-8 separator | Bytes of the separator literal in `script.js` line 90: `27 20 5c 75 30 30 42 37 20 27` = `' · '` (escape, not the literal U+00B7). Added diff lines contain no non-ASCII bytes. | ✅ |
| D-6 | Separator `span` has no `aria-hidden`. | ✅ |
| D-5 | `.todo-date { white-space: nowrap }` above 480px; `white-space: normal; overflow-wrap: anywhere` at ≤ 480px; font size inherits 0.85em (≥ 0.8em, NFR-004). | ✅ |
| D-7 / OOS-1 | Colour `#6b7280` (≈ 4.7:1 recorded); visual check is Step 7 (T-14). | ✅ |
| D-4 | Local-time constructors, 00:30 / 23:30 cases, no `process.env.TZ`. | ✅ |
| D-9 / OOS-3 | fs + vm loader with realm-independent `[object Date]` check instead of `require` + `toBeInstanceOf`; approved deviation. | ✅ (approved) |
| D-11 | Helpers above `renderTodos`, export last statement, `renderTodos` change limited to the timestamp block; pre-existing duplicates untouched. | ✅ |
| NFR-002 | No new runtime dependency; built-in `Date` only. | ✅ |
| NFR-006 | No backend/API/data-file change. | ✅ |

## 5. Traceability (FR/AC → code → tests)

| FR | AC | Code | Tests (this branch) |
|---|---|---|---|
| FR-001 | AC-001 | `getCardDates` line 70; `buildTodoDates` line 85; `renderTodos` line 125 | unit: "builds the Created label without a colon" |
| FR-002 | AC-002 | `CARD_MONTHS` line 48; `formatCardDate` lines 59–62 | unit: `formatCardDate` block (padding, 12 months, year, 00:30 / 23:30) |
| FR-003 | AC-003 | `getCardDates` lines 71–72 | unit: +1001 ms, +1 day, same-day edit |
| FR-004 | AC-003 | `EDITED_THRESHOLD_MS` line 47; line 71 | unit: 1 / 500 / 1000 / 1001 ms |
| FR-005 | AC-003, AC-004 | line 71; `buildTodoDates` line 87 | unit: invalid `updatedAt`, invalid `createdAt`, `updatedAt` before `createdAt` |
| FR-006 | AC-004 | line 70 | unit: `createdAt` missing / null / empty / unparsable / boolean |
| FR-007 | AC-004 | `parseCardDate` lines 51–56; `getCardDates` line 66 | unit: `parseCardDate` invalid table; null todo; "never contains Invalid Date, NaN or undefined" |
| FR-008 | AC-006 | `buildTodoDates` lines 79–96; `styles.css` 158–165 | Step 7 E2E (CR-01) |
| FR-009 | AC-006 | `styles.css` 434–437 | Step 7 E2E (CR-01) |
| FR-010 | — | `renderTodos` line 125 (old line removed) | Step 7 E2E (CR-01) |
| FR-011 | AC-008 | `buildTodoDates` lines 81, 84, 94 | Step 7 E2E (CR-01) |
| FR-012 | AC-008 | pure helpers + export lines 556–559 | unit: module load |
| FR-013 | AC-005 | existing re-render via `fetchAndRenderTodos` → `renderTodos` | Step 7 E2E (CR-01) |
| FR-014 | AC-008 | — | unit suite, 51 cases |
| FR-015 | AC-007 | `renderTodos` otherwise unchanged | Step 7 regression E2E (T-12) |
| NFR-001 | — | `textContent` lines 85, 90, 95 | review (Section 2, Security) |

## 6. Plan Compliance

| Task | Status | Evidence |
|---|---|---|
| T-1 helpers and constants | ✅ Done | `7eef3cb`, `script.js` 46–74 |
| T-2 `buildTodoDates` | ✅ Done | `7eef3cb`, `script.js` 76–98 |
| T-3 `renderTodos` change | ✅ Done | `7eef3cb`, `script.js` 125; diff limited to the timestamp block |
| T-4 guarded export | ✅ Done | `7eef3cb`, `script.js` 556–559 |
| T-5 CSS | ✅ Done | `b03a48d`; diff limited to colour, one `.todo-date` rule, one 480px media query after the 700px rule |
| T-6 unit tests | ✅ Done | `c05a389`; 51/51 passing (OOS-3 loader) |
| T-7 self-check + notes | ✅ Done | `9113d61` |
| T-8 … T-15 | Not started (Step 7, by plan) | Playwright not installed — expected (OOS-2) |
| Out of scope | None unapproved | Only OOS-1 (colour), OOS-3 (test loader) present; OOS-2 pending Step 7 |
| Commit format | ✅ | All 10 commits `<type>(EPMCDMETST-67543): <summary>` |
| Protected paths | ✅ | None in the diff |

## 7. Test and Audit Results

Tests run on this branch (2026-10-04):

| Command | Result |
|---|---|
| `npm run test:unit` | 1 suite, 51 passed, 51 total (0.305 s) |
| `npm run test:hooks` | 1 suite, 46 passed, 46 total |
| `npm run test:docs` | 1 suite, 9 passed, 9 total |

`npm audit --omit=dev`: 1 vulnerability — moderate 1, high 0, critical 0 (`uuid` < 11.1.1, GHSA-w5hq-g745-h8pq, fix `uuid@14.0.2` semver-major; dependency is unused in the app code).

`npm audit` (full): 31 vulnerabilities (1 moderate, 30 high) — high: `braces` (GHSA-vfj7-8cjw-p6xm) through the dev tooling chains of `jest` and `nodemon`. All pre-existing; this branch changes no dependency.

## 8. Verdict

**APPROVE** — 0 BLOCKER, 0 MAJOR. The implementation meets FR-001 … FR-007, FR-010, FR-012 and FR-014 with passing unit tests; FR-008, FR-009, FR-011, FR-013 and FR-015 are implemented and are to be proven by the Step 7 E2E suite (CR-01). MINOR/INFO findings CR-02 … CR-07 are optional or follow-up items outside this story.
