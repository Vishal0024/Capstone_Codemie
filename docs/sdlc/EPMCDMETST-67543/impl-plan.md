# EPMCDMETST-67543 – Implementation Plan
Story: [EPMCDMETST-67543](https://jiraeu.epam.com/browse/EPMCDMETST-67543) · Branch: `feature/EPMCDMETST-67543-card-created-edited-dates` · Requirements: [requirements.md](requirements.md) (commit `58dfc33`) · Architecture: [architecture.md](architecture.md) (commit `098a1af`) · Design review: [design-review.md](design-review.md) (commit `5d70e26`, final verdict APPROVED) · Date: 2026-10-04

Scope: tasks are derived only from the final `architecture.md` plus the agreed implementation-note decisions D-8, D-9, D-11 and D-12 of `design-review.md`. Approved out-of-story changes included: OOS-1 (`.todo-timestamp` colour `#bbb` → `#6b7280`, Gate 2) and OOS-2 (`@playwright/test` devDependency, `playwright.config.js`, `test:e2e` script, AC-007 regression specs, Gate 3). Nothing else is in scope; `todoServer.js`, `index.html`, the data files and the pre-existing duplicate code in `public/script.js` stay untouched (NFR-006, D-2, D-11).

Priorities: **P1** required for any AC, **P2** required for remaining ACs/NFRs, **P3** polish.

**D-8 separator, source form (explicit instruction for Step 5):** in `public/script.js` the separator string must be written as a JavaScript Unicode escape, i.e. the characters space, backslash, `u00B7`, space inside quotes: `' · '`. The literal middle-dot character must **not** appear in `script.js`, so the file stays ASCII-only. `architecture.md` and `design-review.md` show the rendered "·" only because the escape was rendered; the authoritative wording is `design-review.md` Section 6, D-8 row. At runtime the browser displays " · " (U+00B7 between two spaces), which is what FR-008 and the E2E assertions expect.

## 1. Task List (dependency-ordered)

### Step 5 – application code and unit tests

| Order | T | Task | Priority | Files | FR/AC | Depends on |
|---|---|---|---|---|---|---|
| 1 | T-1 | Add constants `EDITED_THRESHOLD_MS = 1000` and `CARD_MONTHS` (`Jan` … `Dec`), and the pure helpers `parseCardDate(value)`, `formatCardDate(date)`, `getCardDates(todo)` exactly per architecture Section 6.3 contract, placed **directly above** `renderTodos` (D-11). No DOM access, never throws, tolerates `null`/non-object `todo`. | P1 | `public/script.js` | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-012; AC-001, AC-002, AC-003, AC-004; NFR-002, NFR-005 | – |
| 2 | T-4 | Add the guarded export as the **last statement** of the file: `if (typeof module !== 'undefined' && module.exports) { module.exports = { parseCardDate, formatCardDate, getCardDates, EDITED_THRESHOLD_MS }; }` (R-4, D-11). | P1 | `public/script.js` | FR-012; AC-008 | T-1 |
| 3 | T-6 | Write the Jest unit tests for the pure helpers (cases in Section 4). Setup per D-9: define `global.window = { location: { origin: 'http://localhost:3000' } }`, `global.localStorage = { getItem: () => null }`, `global.document = { addEventListener: () => {} }`, then a single `require('../../public/script.js')`. Inputs from local-time constructors, local-midnight boundary cases, no `process.env.TZ`, no jsdom (D-4, D-9). | P1 | `tests/unit/EPMCDMETST-67543.test.js` (new) | FR-014, FR-002, FR-004, FR-005, FR-006, FR-007, FR-012; AC-002, AC-003, AC-004, AC-008 | T-1, T-4 |
| 4 | T-2 | Add DOM builder `buildTodoDates(todo)` next to the helpers: `div.todo-timestamp[data-testid="todo-dates"]` containing `span.todo-date[data-testid="todo-created"]`; only when `edited` is not `null` also `span.todo-date-sep` (text written as the D-8 escape `' · '`, **no** `aria-hidden`, D-6) and `span.todo-date[data-testid="todo-edited"]`. All text via `textContent` only. | P1 | `public/script.js` | FR-001, FR-003, FR-005, FR-008, FR-011; AC-001, AC-003, AC-006, AC-008; NFR-001 | T-1 |
| 5 | T-3 | In `renderTodos`, replace only the current timestamp block (lines 70–73, `Created: … \| Updated: …` with `toLocaleString()`) with `const timestamps = buildTodoDates(element);`. Card assembly order unchanged; no other line of `renderTodos` and no pre-existing duplicate (second `fetchAndRenderTodos`, overlapping `window.onclick` / `keydown` handlers) is changed (D-11). | P1 | `public/script.js` | FR-010, FR-013, FR-015; AC-001, AC-005, AC-007 | T-2 |
| 6 | T-5 | CSS: in `.output .todo-timestamp` keep `font-size: 0.85em` and `margin-top`, change `color: #bbb` → `#6b7280` (OOS-1, D-7); add `.output .todo-timestamp .todo-date { white-space: nowrap; }` (D-5); add `@media (max-width: 480px)` **after** the existing 700px rule with `.todo-date { display: block; white-space: normal; overflow-wrap: anywhere; }` and `.todo-date-sep { display: none; }`. Font size stays ≥ 0.8em. | P2 | `public/styles.css` | FR-008, FR-009; AC-006; NFR-003, NFR-004 | – (class names fixed by architecture; visual check after T-3) |
| 7 | T-7 | Step 5 self-check: `npm run test:unit`, `npm run test:hooks`, `npm run test:docs` green; start the app (`node todoServer.js`) and confirm cards render with the new line and no console error (data files backed up and restored); confirm `public/script.js` is ASCII-only (no U+00B7 literal); write `implementation-notes.md`; commit in logical steps, no push. | P1 | `docs/sdlc/EPMCDMETST-67543/implementation-notes.md` (new) | AC-001 … AC-006, AC-008 (smoke); FR-015 | T-3, T-5, T-6 |

### Step 7 – verification tooling, E2E, Gherkin, checks

| Order | T | Task | Priority | Files | FR/AC | Depends on |
|---|---|---|---|---|---|---|
| 8 | T-8 | Install `@playwright/test` as a **devDependency** (`npm install -D @playwright/test`), install Chromium (`npx playwright install chromium`), add script `"test:e2e": "playwright test"`. No runtime dependency added (OOS-2, D-1). On network failure apply `mcp-retry-policy`, report the exact error and stop for the human. | P1 | `package.json`, `package-lock.json` | FR-014, FR-015; AC-007, AC-008; NFR-002 | T-7 (Gate 5/6 passed) |
| 9 | T-9 | Create `playwright.config.js` per `tests/CLAUDE.md`: `testDir: 'tests/e2e'`, Chromium only, HTML reporter to `playwright-report/`, `webServer: { command: 'node todoServer.js', url: 'http://localhost:3000', reuseExistingServer: true }`. | P1 | `playwright.config.js` (new) | AC-007, AC-008 | T-8 |
| 10 | T-10 | Write Gherkin scenarios tagged `@EPMCDMETST-67543` and `@AC-n` for AC-001 … AC-008, including the AC-007 regression scenarios (sign-up, login, create, edit, complete, filter, sort, search, delete). | P1 | `tests/features/EPMCDMETST-67543.feature` (new) | AC-001 … AC-008 | T-7 |
| 11 | T-11 | E2E story specs, one test per Gherkin scenario (same title), `data-testid` selectors, unique timestamped user per test (details in Section 5): real create → wait ≥ 1100 ms → edit flow (AC-003, AC-005, D-3); `page.route` fixtures for GET /todos with missing, `null`, `''`, `'not-a-date'`, `true`, number, updated = created + 500 ms, + 1500 ms, updated before created (D-3); expected date computed in the browser with `page.evaluate(() => formatCardDate(new Date()))` (D-4); D-12 assertions for FR-009, FR-010, FR-011. | P1 | `tests/e2e/EPMCDMETST-67543.spec.js` (new) | FR-001 … FR-011, FR-013, FR-014; AC-001 … AC-006, AC-008 | T-9, T-10 |
| 12 | T-12 | AC-007 regression specs for sign-up, login, create, edit, complete, filter, sort, search, delete (accept `confirm()` dialogs), in the same spec file under a separate `describe`, titles matching the Gherkin scenarios. | P1 | `tests/e2e/EPMCDMETST-67543.spec.js` | FR-015; AC-007 | T-9, T-10 |
| 13 | T-13 | Run the full suite with data backup/restore of `todos.json`, `users.json`, `sessions.json` (copy to `*.bak`, always restore and delete): `npm run test:unit`, `npm run test:hooks`, `npm run test:docs`, `npm run test:e2e`. Record real numbers. | P1 | `docs/sdlc/EPMCDMETST-67543/verification.md` | AC-001 … AC-008 | T-11, T-12 |
| 14 | T-14 | Contrast / visual check: confirm computed colour `rgb(107, 114, 128)` of `todo-dates`, record the calculated ≈ 4.7:1 (worst case `#fafbff`) / ≈ 4.8:1 (white) ratios, screenshots at desktop and 375×667 (D-7, R-3). | P2 | `docs/sdlc/EPMCDMETST-67543/verification.md` | AC-006; NFR-003, NFR-004 | T-11 |
| 15 | T-15 | Document quality check `npm run docs:check -- EPMCDMETST-67543`, write and commit `verification.md` with AC traceability and defects. | P1 | `docs/sdlc/EPMCDMETST-67543/verification.md` | AC-008 (evidence), Global Rule 7 | T-13, T-14 |

Task count: 15 (P1: 13 · P2: 2 · P3: 0). Step 5: T-1 … T-7 (7 tasks). Step 7: T-8 … T-15 (8 tasks).

Done criteria per task:

| T | Done when |
|---|---|
| T-1 | Helpers and constants exist above `renderTodos`, match the Section 6.3 contract, no DOM reference inside them. |
| T-4 | Export is the last statement; loading `index.html` in the browser shows no `ReferenceError`; `require` in Node returns the four names. |
| T-6 | Unit test file passes with `npm run test:unit`; every case in Section 4 present; no `test.only`/skips. |
| T-2 | `buildTodoDates` returns the DOM in architecture Section 6.3; no `innerHTML`; separator source is the D-8 escape; no `aria-hidden`. |
| T-3 | Diff of `renderTodos` is limited to the timestamp block; cards show "Created DD Mon YYYY" (plus " · Edited …" when edited); no "Updated:" text. |
| T-5 | Diff limited to the `.todo-timestamp` colour, one `.todo-date` rule and one new 480px media query after the 700px rule. |
| T-7 | All existing and new Jest suites green; app starts; data files restored; `implementation-notes.md` committed. |
| T-8 | `@playwright/test` appears only under `devDependencies`; `npx playwright --version` works; `test:e2e` script present. |
| T-9 | `npx playwright test --list` lists the specs. |
| T-10 | Every AC-001 … AC-008 has at least one tagged scenario. |
| T-11 | All story specs pass; each fixture case from D-3 and each D-12 assertion present. |
| T-12 | Nine regression scenarios pass against the changed build. |
| T-13 | Real pass/fail counts recorded; data files restored, no `.bak` left. |
| T-14 | Colour and screenshots recorded in `verification.md`. |
| T-15 | `docs:check` shows 0 errors for this Story; `verification.md` committed. |

## 2. Blocked Tasks

| T | Blocked until | Reason |
|---|---|---|
| T-4 | T-1 | Exports the helpers T-1 defines. |
| T-6 | T-1, T-4 | Tests `require` the helpers through the guarded export. |
| T-2 | T-1 | Calls `getCardDates`. |
| T-3 | T-2 | Replaces the timestamp block with a call to `buildTodoDates`. |
| T-7 | T-3, T-5, T-6 | Self-check needs the complete change and the unit tests. |
| T-8 | T-7 (and Gates 5 and 6) | Step 7 starts only after implementation and code review are approved. **External block:** needs network access to the npm registry and the Playwright Chromium download; the earlier `git pull` to github.com failed with "Failed to connect to github.com port 443" (KL-5, R-8). If install fails, T-9, T-11, T-12, T-13 (E2E part) and T-14 (screenshots) are blocked until the human restores network access. |
| T-9 | T-8 | Config needs the installed `@playwright/test`. |
| T-10 | T-7 | Scenarios describe the implemented behaviour; Step 7 work. |
| T-11 | T-9, T-10 | Needs the Playwright runner and the scenario titles. |
| T-12 | T-9, T-10 | Same as T-11. |
| T-13 | T-11, T-12 | Runs the complete suite. |
| T-14 | T-11 | Uses the Playwright browser for computed style and screenshots. |
| T-15 | T-13, T-14 | `verification.md` needs real results. |

Blocked-task count: 13 of 15 (only T-1 and T-5 can start immediately). Dependency graph checked: every edge points to an earlier order number, so there are no cycles.

## 3. Critical Path

T-1 → T-4 → T-6 → T-7 → T-8 → T-9 → T-11 → T-13 → T-15

(T-2 → T-3 runs in parallel with T-4 → T-6 and also feeds T-7; T-5, T-10, T-12 and T-14 are off the critical path. T-8 is the riskiest node because of the network dependency.)

## 4. Unit Tests (Step 5)

| Test file | Covers T | Cases (happy path, Not Found / missing field, invalid input) |
|---|---|---|
| `tests/unit/EPMCDMETST-67543.test.js` | T-1, T-4 | **Load:** the three D-9 stubs, then one `require`; exports `parseCardDate`, `formatCardDate`, `getCardDates`, `EDITED_THRESHOLD_MS === 1000`. |
| | T-1 `formatCardDate` | Happy path: `new Date(2026, 9, 5, 12, 0)` → `05 Oct 2026`; zero-padded single-digit day; two-digit day unpadded (`31`); all 12 month names via a table test (`Jan` … `Dec`, note `Sep` not `Sept`); 4-digit year. Local-time proof (D-4): `new Date(2026, 9, 5, 0, 30)` and `new Date(2026, 9, 5, 23, 30)` passed through `.toISOString()` and parsed back both give `05 Oct 2026`. |
| | T-1 `parseCardDate` | Valid ISO string (from local constructor `.toISOString()`) → `Date`; valid number → `Date`; missing (`undefined`), `null`, `''`, whitespace-only `'   '`, `'not-a-date'`, `true`, `{}`, `[]`, `NaN` → `null`; never throws. |
| | T-1 `getCardDates` | Created label `Created 05 Oct 2026` (no colon); `createdAt` missing / `null` / `''` / `'not-a-date'` / `true` → `created === 'Created: Not available'` and `edited === null`; `updatedAt` missing / invalid → `edited === null`; updated = created + 1 ms, + 500 ms, + 1000 ms (boundary, not shown) → `null`; + 1001 ms and + 1 day → `Edited DD Mon YYYY`; updated before created → `null`; same-day edit (> 1000 ms) shows Edited with the same date; `todo` = `null`, `undefined`, `'x'` → `Created: Not available`, no throw; output never contains `Invalid Date`, `NaN` or `undefined`. |

`buildTodoDates` (DOM) is not unit-tested (no jsdom, D-9); it is covered by T-11.

## 5. Verification Outline (Step 7)

| AC | Gherkin scenario | Integration test | E2E test |
|---|---|---|---|
| AC-001 | New task shows "Created" with today's date | None (D-2: no new/changed endpoint, `todoServer.js` unchanged) | Create a task; `todo-created` text equals `'Created ' + formatCardDate(new Date())` computed via `page.evaluate` (D-4). |
| AC-002 | Dates use DD Mon YYYY in local time | None (D-2) | Fixture via `page.route` with known ISO values; assert `/^Created \d{2} [A-Z][a-z]{2} \d{4}$/` and the value computed in the browser. Unit tests carry the month table and boundary cases. |
| AC-003 | Edited shown after an edit; hidden otherwise | None (D-2) | Real flow: create → wait ≥ 1100 ms → edit → `todo-edited` visible with today's date (D-3). Fixtures: + 500 ms → `todo-edited` count 0; + 1500 ms → visible; updated before created → count 0. **FR-011 (D-12):** unedited card has `getByTestId('todo-edited')` count 0. |
| AC-004 | Missing or invalid dates show the fallback | None (D-2) | Fixtures for `createdAt` missing, `null`, `''`, `'not-a-date'`, `true` → `todo-created` = `Created: Not available`, no `todo-edited`; `updatedAt` invalid → no `todo-edited`; number → formatted date; other cards in the same list still render; no page error (`page.on('pageerror')`); no `Invalid Date` / `NaN` / `undefined` text. |
| AC-005 | Dates appear without page reload | None (D-2) | Real create and edit flow with a navigation listener asserting no reload; dates present right after save. |
| AC-006 | Date text readable on mobile | None (D-2) | Desktop: edited card shows `Created … · Edited …` on one line (separator visible). Viewport 375×667: separator hidden, spans `display: block`; **FR-009 (D-12):** `scrollWidth ≤ clientWidth` for `todo-dates`; computed font size ≥ 0.8 × parent font size; colour `rgb(107, 114, 128)` (T-14). |
| AC-007 | Existing features keep working (sign-up, login, create, edit, complete, filter, sort, search, delete) | None (D-2) | Nine regression tests (T-12), one per feature. |
| AC-008 | Automated tests cover dates, Edited label and fallback | Not applicable | Evidence: unit (T-6) + E2E (T-11) results in `verification.md`. **FR-010 (D-12):** card text contains no `Updated:`. |

## 6. Risks

| ID | Risk | Affects | Mitigation |
|---|---|---|---|
| PR-1 | Network: `npm install -D @playwright/test` and `npx playwright install chromium` need registry/CDN access; github.com was unreachable earlier (KL-5, R-8). If `ETIMEDOUT` on IPv6, set `$env:NODE_OPTIONS = "--dns-result-order=ipv4first"`. | T-8 and everything after it on the critical path | Apply `mcp-retry-policy`; on persistent failure report the exact error and stop for the human. Unit tests (Step 5) do not need network. |
| PR-2 | `npm run build` / `scripts/build.ps1` named in root `CLAUDE.md`: **Not Found** — `package.json` has no `build` script and `scripts/` contains only `check-docs.mjs`. | T-7 (build verification) | Step 5 verifies `node todoServer.js` start and the Jest suites instead, and records the missing build script as a known limitation; adding a build script is out of scope. |
| PR-3 | Non-ASCII separator literal slipping into `script.js` (editor auto-replacement, copy from docs). | T-2 | Use the D-8 escape; T-7 greps `public/script.js` for non-ASCII bytes. |
| PR-4 | `script.js` load-time globals break `require` in Jest (R-1). | T-6 | D-9 stubs defined before the single `require`. |
| PR-5 | Time-zone or local-midnight flakiness (R-2). | T-6, T-11 | Local-time constructors, 00:30 / 23:30 cases, expected E2E date computed in the browser (D-4). |
| PR-6 | Edit within 1 s of creation does not show Edited; fallback data unreachable through the API (R-9). | T-11 | Wait ≥ 1100 ms in the real flow; `page.route` fixtures for fallbacks (D-3). |
| PR-7 | Regression in AC-007 features from touching duplicate handlers. | T-3 | Change only lines 70–73 of `renderTodos`; no refactor (D-11); T-12 regression specs. |
| PR-8 | Test runs overwrite user data in `todos.json`, `users.json`, `sessions.json`. | T-7, T-13 | Back up to `*.bak` before, always restore and delete after; never commit data files. |
| PR-9 | Known limitations carried forward (KL-2 toggle counts as edit, KL-3 < 1000 ms not shown, D-10 date-only strings / years outside 1000–9999 / numeric timestamps / unchanged Edit-modal save). | T-11 expectations | Tests assert the documented behaviour; no extra code. |
| PR-10 | Epic Link (`customfield_14500`): Not Found (KL-1). | Traceability only | Carried as known limitation. |

## 7. Definition of Done

- T-1 … T-7 complete in Step 5; T-8 … T-15 complete in Step 7; each task's done criterion in Section 1 met.
- Only these files changed by the Story: `public/script.js`, `public/styles.css`, `tests/unit/EPMCDMETST-67543.test.js`, and in Step 7 `package.json`, `package-lock.json`, `playwright.config.js`, `tests/features/EPMCDMETST-67543.feature`, `tests/e2e/EPMCDMETST-67543.spec.js`, plus the artifacts in `docs/sdlc/EPMCDMETST-67543/`. `todoServer.js`, `index.html` and the data files unchanged.
- No runtime dependency added; `@playwright/test` only under `devDependencies` (OOS-2).
- Date text set with `textContent` only; `data-testid` hooks `todo-dates`, `todo-created`, `todo-edited` present as specified; `public/script.js` ASCII-only with the D-8 escape for the separator.
- `npm run test:unit`, `npm run test:hooks`, `npm run test:docs` and `npm run test:e2e` pass with real, recorded numbers; no `test.only` or skipped tests.
- Every AC-001 … AC-008 traced to at least one Gherkin scenario and passing test; FR-009, FR-010, FR-011 have the explicit D-12 assertions.
- Data files backed up and restored around every API/E2E run; no `.bak` or data file committed.
- `npm run docs:check -- EPMCDMETST-67543` reports 0 errors once all artifacts exist.
- Commits follow `<type>(EPMCDMETST-67543): <summary>` on the feature branch; nothing pushed to `main`.

## Open Questions / Not Found

- Build script (`npm run build`, `scripts/build.ps1`): Not Found in the repository (PR-2).
- Epic Link (`customfield_14500`): Not Found (KL-1).
- Network access for the Playwright install: unverified until T-8 (PR-1).
