# EPMCDMETST-67543 – Design Review
Story: [EPMCDMETST-67543](https://jiraeu.epam.com/browse/EPMCDMETST-67543) · Branch: `feature/EPMCDMETST-67543-card-created-edited-dates` · Requirements: [requirements.md](requirements.md) (commit `58dfc33`) · Architecture: [architecture.md](architecture.md) (reviewed at commit `920ffc7`, updated in `098a1af`) · Date: 2026-10-04 (decisions recorded 2026-10-04)

## 1. Scope of the Review

Reviewed `requirements.md` and `architecture.md` against the current code: `public/script.js`, `public/styles.css`, `index.html`, `todoServer.js`, `package.json` (Jest config and scripts), `package-lock.json`, `tests/` and `tests/CLAUDE.md`, `scripts/check-docs.mjs`, and the `verification-suite` skill. No code or `architecture.md` was changed by this review.

Overall the design is sound and small: a frontend-only change, pure helpers for formatting and validity, `textContent` rendering, no new runtime dependency and no data migration. The findings concern test infrastructure, test determinism and small layout/accessibility details. None is a blocker.

Facts confirmed in the code:

| Item | Evidence |
|---|---|
| Load-time globals in `script.js` | `window.location.origin` (line 12), `localStorage.getItem` (lines 131–133), `document.addEventListener` (line 238). Nothing else runs at load. Architecture R-1 lists exactly these three. |
| Line being replaced | `renderTodos`, lines 70–73: `Created: … \| Updated: …` with `toLocaleString()`. |
| Timestamps on the server | POST /todos and the signup default todo call `new Date().toISOString()` twice (lines 110–111, 185–186); PUT (line 207) and PATCH toggle (line 226) set `updatedAt` only. |
| Existing tests | Only `tests/hooks/` and `tests/docs/`. No test references `.todo-timestamp` (A-4 holds). No `tests/e2e/`, `tests/api/` or `tests/unit/` exists yet. |
| Test tooling | `package.json` has `test:unit`, `test:hooks`, `test:docs` only. No `test:api` / `test:e2e` script, no `playwright.config.js`, and `@playwright/test` is in neither `package.json` nor `package-lock.json`. `todoServer.js` does not export `app` (it calls `app.listen` unconditionally, line 251). |
| Jest | Jest 29, no `jest` key in `package.json`, so the default `node` environment and default `testMatch` apply. |
| Card background | `.output { background: rgba(255,255,255,0.85) }` over the body gradient `#e0e7ff → #f5f7fa`; no `.output.completed` background override. |
| Non-ASCII precedent | `script.js` already contains `'×'` (line 330), served by `express.static`. |

## 2. Findings

| ID | Severity | Area | Risk or gap | Recommendation |
|---|---|---|---|---|
| F-01 | MAJOR | Testability, dependencies, scope | AC-007/AC-008 and the `verification-suite` skill need E2E (Playwright) tests, but the repository has no Playwright dependency, config or `test:e2e` script, and no existing E2E regression suite for sign-up, login, create, edit, complete, filter, sort, search, delete. NFR-002 says "no new npm or CDN dependencies" and the architecture does not mention that test tooling must be added. Architecture Section 3 also lists `tests/api/`, which per `tests/CLAUDE.md` would require exporting `app` from `todoServer.js`, conflicting with NFR-006 / the frontend-only constraint. Installing Playwright and Chromium also needs network access (KL-5 already shows a GitHub network failure). | Interpret NFR-002 as runtime/product dependencies only; add `@playwright/test` as a **devDependency**, `playwright.config.js` and `test:e2e` script in Step 7, recorded as an explicitly approved out-of-story change (D-1). Write no `tests/api/` file for this Story, because no endpoint is new or changed, so `todoServer.js` stays untouched (D-2). |
| F-02 | MAJOR | Testability (AC-003, AC-004) | The missing/invalid-date fallbacks cannot be produced through the real API: the server always writes valid ISO timestamps, and test code must not hand-edit `todos.json`. The "Edited" label also needs `updatedAt − createdAt > 1000 ms`, so an E2E test that edits a task within one second of creating it will be flaky or wrong. | E2E tests fulfil GET /todos with fixture data via `page.route` for the fallback and threshold cases (missing, `null`, `''`, `'not-a-date'`, `true`, number, updated = created + 500 ms, + 1500 ms, updated before created). One real create → wait → edit flow proves AC-005 and Edited end to end, with a deliberate wait of at least 1100 ms before saving the edit (D-3). |
| F-03 | MINOR | Testability (time zone, AC-002) | R-2 suggests setting `process.env.TZ` in the test file. Changing `TZ` at runtime is less portable (this team runs on Windows) and does not prove local-time behaviour. A fixed ISO input such as `'2026-10-05T12:00:00Z'` gives a different local date in UTC+12 and beyond. E2E "today" assertions can flake around local midnight. | Unit tests build inputs from local-time constructors (`new Date(2026, 9, 5, 12, 0).toISOString()`) and include local-time boundary cases (00:30 and 23:30 local) so the test proves local, not UTC, formatting in any time zone. Do not set `process.env.TZ`. E2E computes the expected date in the browser with `page.evaluate(() => formatCardDate(new Date()))` (a global in the classic script) (D-4). |
| F-04 | MINOR | Layout (AC-006, FR-008) | Cards can be as narrow as 320px above 700px (`minmax(320px, 1fr)`). The full line "Created 05 Oct 2026 · Edited 06 Oct 2026" at 0.85em is close to the inner card width, so above 480px it can wrap inside a label (e.g. "Edited" on one line and its date on the next). | Add `white-space: nowrap` to `.output .todo-timestamp .todo-date`, so the line can only break between the two items; in the `≤ 480px` rule reset it to `white-space: normal` so `overflow-wrap: anywhere` still prevents overflow (D-5). |
| F-05 | MINOR | Accessibility | The separator span is `aria-hidden="true"`. Because the other spans are inline, the accessible text becomes "Created 05 Oct 2026Edited 06 Oct 2026" (no space, no pause) for screen readers. | Remove `aria-hidden` from the separator so assistive technology reads the visible text as shown. On mobile the separator is `display: none` and the block spans already give a line break (D-6). |
| F-06 | MINOR | Accessibility (NFR-004) | The architecture's contrast figure assumes pure white and leaves the real background as an open question. | Verified by calculation: effective card background worst case ≈ `#fafbff` (85% white over `#e0e7ff`). `#6b7280` on it ≈ 4.7:1 (≥ 4.5:1, WCAG AA); on white ≈ 4.8:1. Old `#bbb` ≈ 1.9:1. The colour change is approved by the user (see Section 5). Replace the open question with this figure (D-7). |
| F-07 | MINOR | Robustness | The separator " · " (U+00B7) is a non-ASCII literal in `script.js`. It works today (UTF-8, precedent `'×'`), but an editor saving the file in another encoding would corrupt it. | Write the separator as the escape `' · '` in code (D-8). |
| F-08 | MINOR | Testability (FR-012) | The guarded `module.exports` and the three stubs are correct. Risks are only in how the test sets them up: stubs must exist before `require`, and `buildTodoDates` (DOM) cannot be unit-tested in the `node` environment without a new dependency. | In the unit test, define `global.window = { location: { origin: 'http://localhost:3000' } }`, `global.localStorage = { getItem: () => null }`, `global.document = { addEventListener: () => {} }` before a single `require('../../public/script.js')`. Do not add `jest-environment-jsdom`. `buildTodoDates` and the `data-testid` structure are covered by E2E (D-9). |
| F-09 | MINOR | Data / error handling (FR-007) | Some unusual legacy values parse as valid but render oddly: a date-only string `'2026-10-05'` is parsed as UTC midnight and can show the previous day in negative offsets; years outside 1000–9999 (e.g. `'0001-01-01'`) do not render with 4 digits; a numeric value such as `0` renders "01 Jan 1970". Saving the Edit modal without changes also bumps `updatedAt`, so it shows "Edited" (same cause as KL-2). The server always writes full ISO UTC timestamps, so this affects only hand-edited or legacy data. | No extra code (keep the helpers simple). Record these as known limitations next to KL-2 / KL-3 (D-10). |
| F-10 | MINOR | Fit with existing code, regression | `script.js` contains a duplicate `fetchAndRenderTodos` (lines 31 and 223) and three overlapping `window.onclick` / `keydown` handlers. They are pre-existing and out of scope; touching them risks regressions in AC-007 features. | Do not refactor them. Place the constants and the pure helpers directly above `renderTodos`, `buildTodoDates` next to them, and the guarded export as the last statement of the file. Change `renderTodos` only at lines 70–73 (D-11). |
| F-11 | MINOR | Traceability | FR-009 (no horizontal overflow at ≤ 480px), FR-010 (old "Updated:" text gone) and FR-011 (`todo-edited` absent when not edited) have design coverage but no named test evidence in the architecture. | Step 4/7 map them to tests: E2E at viewport 375×667 checks `scrollWidth ≤ clientWidth` for `todo-dates`; asserts the card text contains no "Updated:"; asserts `getByTestId('todo-edited')` has count 0 for an unedited card (D-12). |

Findings per severity: BLOCKER 0 · MAJOR 2 · MINOR 9.

## 3. Proposed Design Decisions

| Decision | Decision | Resolves finding(s) | Changes `architecture.md`? |
|---|---|---|---|
| D-1 | NFR-002 applies to runtime/product dependencies. Step 7 adds `@playwright/test` as a devDependency, `playwright.config.js` (per `tests/CLAUDE.md`) and a `test:e2e` script, and writes E2E regression specs for the AC-007 features. This is an out-of-story change that needs explicit user approval and is recorded in the artifacts. If install fails (network), apply `mcp-retry-policy` and report the exact error. | F-01 | yes (Technology Choices, Components table, Risks) |
| D-2 | No `tests/api/` file for this Story (no new or changed endpoint); `todoServer.js` is not modified. GET /todos shape is exercised through E2E. | F-01 | yes (Components table row for API tests) |
| D-3 | E2E uses `page.route` fixtures for fallback and threshold cases, plus one real create → wait ≥ 1100 ms → edit flow for AC-003/AC-005. | F-02 | yes (test approach in Components table and Risks) |
| D-4 | Unit tests use local-time constructors and local-midnight boundary cases; no `process.env.TZ`. E2E computes expected dates in the browser with `formatCardDate`. | F-03 | yes (R-2 mitigation) |
| D-5 | `.todo-date { white-space: nowrap }` above 480px; `white-space: normal` plus `overflow-wrap: anywhere` at ≤ 480px. | F-04 | yes (CSS sketch, Section 6.3) |
| D-6 | Separator span is not `aria-hidden`. | F-05 | yes (Components table, DOM sketch) |
| D-7 | Record the calculated contrast (≈ 4.7:1 worst case for `#6b7280`) and close the open question; final visual check stays in Step 7. | F-06 | yes (R-3, Open Questions) |
| D-8 | Separator written as `' · '` in code. | F-07 | no (implementation detail for Steps 4/5) |
| D-9 | Unit-test setup: three global stubs, then one `require`; no jsdom; DOM structure covered by E2E. | F-08 | no (already consistent with R-1; detail for Steps 4/5) |
| D-10 | Add known limitations: date-only strings (UTC midnight), years outside 1000–9999, numeric timestamps, and unchanged Edit-modal save showing "Edited". | F-09 | yes (Open Questions / Known Limitations) |
| D-11 | Do not refactor pre-existing duplicates; helpers above `renderTodos`, export last; change only lines 70–73 of `renderTodos`. | F-10 | no (consistent with Section 3; detail for Step 4) |
| D-12 | Plan/verification map FR-009, FR-010, FR-011 to explicit E2E assertions. | F-11 | no (belongs in `impl-plan.md` / `verification.md`) |

Decisions that would change `architecture.md`: D-1, D-2, D-3, D-4, D-5, D-6, D-7, D-10. They are additive clarifications (test approach, CSS detail, separator attribute, known limitations); none changes the component structure, the helper contracts or the data flow.

## 4. Traceability

| Requirement | AC | Design coverage (architecture section) | Review result |
|---|---|---|---|
| FR-001 Created label | AC-001 | 3, 6.3, 8 | Covered |
| FR-002 `DD Mon YYYY`, local, locale-independent | AC-002 | 3, 4, 6.3 | Covered; test determinism via D-4 |
| FR-003 Edited format | AC-003 | 3, 6.3, 8 | Covered |
| FR-004 Edited only if > 1000 ms | AC-003 | 4, 6.1, 6.3 | Covered; E2E timing via D-3 |
| FR-005 Edited hidden otherwise | AC-003, AC-004 | 6.3, 9 | Covered; E2E fixtures via D-3 |
| FR-006 `Created: Not available` | AC-004 | 6.3, 8, 9 | Covered; E2E fixtures via D-3 |
| FR-007 Invalid-value definition, no throw | AC-004 | 3, 4, 9 | Covered; edge cases recorded via D-10 |
| FR-008 One line, " · ", existing container | AC-006 | 3, 6.3, 8 | Covered; wrapping via D-5, a11y via D-6, encoding via D-8 |
| FR-009 ≤ 480px wrap, ≥ 0.8em | AC-006 | 3, 6.3, 8 | Covered; test evidence via D-12 |
| FR-010 Old line removed | Clar. 1 | 3 | Covered; test evidence via D-12 |
| FR-011 data-testids | AC-008 | 3, 4, 6.3 | Covered; test evidence via D-12 |
| FR-012 Pure function callable from tests | AC-008 | 3, 4, 10 R-1 | Covered; setup via D-9 |
| FR-013 No reload | AC-005 | 5 | Covered; real-flow E2E via D-3 |
| FR-014 Automated tests | AC-008 | 3, 10 | Gap closed by D-1, D-3, D-4 |
| FR-015 Existing features unchanged | AC-007 | 1, 6.1, 7, 10 R-6 | Gap: no regression suite exists; closed by D-1, D-11 |
| NFR-001 `textContent` | – | 3, 4 | Covered |
| NFR-002 No dependencies | – | 4, 6.2 | Covered for runtime; devDependency via D-1 |
| NFR-003 Consistent style | – | 3, 6.3 | Covered |
| NFR-004 Legibility, contrast | – | 6.3, 10 R-3 | Covered; verified via D-7 |
| NFR-005 Performance | – | 5 | Covered |
| NFR-006 No backend/API change | – | 6.1, 7 | Covered; preserved by D-2 |

Security: rendering uses `createElement` + `textContent` only (NFR-001); no new route, auth or user-scoping change; no secrets involved. Data model: unchanged, missing fields handled at render time, so no defaults for existing records are needed.

## 5. Approved Out-of-Scope Changes

| ID | Change | Reason | Approval |
|---|---|---|---|
| OOS-1 | `.output .todo-timestamp` colour changes from `#bbb` to `#6b7280`. | Readability / contrast (NFR-004): ≈ 1.9:1 → ≈ 4.7:1 on the card background. | Explicitly approved by the user at Gate 2 (Global Rule 2). |
| OOS-2 | `@playwright/test` as a devDependency, `playwright.config.js`, `test:e2e` script and AC-007 regression specs, added in Step 7 (D-1). NFR-002 read as runtime/product dependencies only. | AC-007/AC-008 need repeatable E2E evidence; the repository has no E2E tooling (F-01). | Explicitly approved by the user at Gate 3 ("approve" of D-1 … D-12 as written; Global Rule 2). Recorded in `architecture.md` (commit `098a1af`). |

No change is pending approval.

## 6. Agreed Design Decisions

At Gate 3 the user replied "approve", agreeing to all twelve decisions D-1 … D-12 as proposed in Section 3 (commit `0ad83a6`), with no modifications. The `architecture` agent applied them in commit `098a1af` ("docs(EPMCDMETST-67543): update architecture after design review"), which adds a dated "Changes after design review" section. Each decision was checked against the updated `architecture.md`.

| Decision | Agreed | Status | Verified in `architecture.md` |
|---|---|---|---|
| D-1 | As proposed | Applied in `098a1af` | Section 1; Section 2 (PW node); Section 3 (E2E tests, E2E tooling rows); Section 4 (E2E test tooling row); R-6, R-8; Section 11 NFR-002; Approved Out-of-Scope Changes OOS-2. |
| D-2 | As proposed | Applied in `098a1af` | Section 3: `tests/api/` removed, "API tests – Not added" row; `todoServer.js` stays unchanged. |
| D-3 | As proposed | Applied in `098a1af` | Section 3 (E2E tests row: `page.route` fixture list, real create → wait ≥ 1100 ms → edit flow); Section 4 (Fallback-case test data row); R-9. |
| D-4 | As proposed | Applied in `098a1af` | Section 3 (Unit tests and E2E tests rows); R-2: local-time constructors, 00:30 / 23:30 boundary cases, `process.env.TZ` not set, expected E2E date via `formatCardDate(new Date())`. |
| D-5 | As proposed | Applied in `098a1af` | Section 3 (Card metadata style row); Section 4 (Mobile layout row); Section 6.3 CSS sketch: `.todo-date { white-space: nowrap }`, and `white-space: normal; overflow-wrap: anywhere` at ≤ 480px. |
| D-6 | As proposed | Applied in `098a1af` | Section 3 (`buildTodoDates` row) and Section 6.3 DOM sketch: separator not `aria-hidden`. |
| D-7 | As proposed | Applied in `098a1af` | R-3 records ≈ 4.7:1 (worst case `#fafbff`) and ≈ 4.8:1 (white); the contrast open question is closed; final visual check stays in Step 7. |
| D-8 | As proposed | No architecture change needed (implementation note for Steps 4/5); also noted in `098a1af` | Section 3 (`buildTodoDates` row) and Section 6.3 DOM sketch. Clarification: both documents show the separator as the rendered character U+00B7; the intended source form in `script.js` is the JavaScript Unicode escape (a backslash followed by `u00B7`) between two spaces, so the file stays ASCII-only. |
| D-9 | As proposed | No architecture change needed (implementation note for Steps 4/5); also noted in `098a1af` | Section 3 (Unit tests row): the three global stubs before one `require`, no jsdom. |
| D-10 | As proposed | Applied in `098a1af` | Open Questions / Not Found (known-limitations bullet) and R-10. |
| D-11 | As proposed | No architecture change needed (implementation note for Step 4); also noted in `098a1af` | Section 3 (`renderTodos` row) and R-6. |
| D-12 | As proposed | No architecture change needed (belongs in `impl-plan.md` / `verification.md`); also noted in `098a1af` | Section 3 (E2E tests row) names the FR-009, FR-010 and FR-011 assertions. |

Result: all eight decisions that change `architecture.md` (D-1, D-2, D-3, D-4, D-5, D-6, D-7, D-10) are applied correctly. The four implementation-note decisions (D-8, D-9, D-11, D-12) need no architecture change and are carried forward to Steps 4, 5 and 7. No decision was applied incorrectly or left out. The component structure, helper contracts and data flow are unchanged, as the review expected.

## 7. Verdict

Initial verdict (commit `0ad83a6`): **APPROVED WITH CHANGES**. No BLOCKER findings; 2 MAJOR and 9 MINOR findings.

**Final verdict: APPROVED.** All MAJOR and MINOR findings (F-01 … F-11) are resolved by agreed decisions D-1 … D-12. The decisions that change the design are applied in `architecture.md` (commit `098a1af`). The rest are carried as implementation notes. The out-of-story change for the E2E tooling is approved as OOS-2. Step 4 (Implementation Planning) can start from `architecture.md` at `098a1af` together with D-8, D-9, D-11 and D-12 above.

## Open Questions / Not Found

- `@playwright/test` as a devDependency under NFR-002 (D-1): resolved; approved by the user at Gate 3 (OOS-2).
- Epic Link (`customfield_14500`): Not Found (carried over from requirements KL-1).
