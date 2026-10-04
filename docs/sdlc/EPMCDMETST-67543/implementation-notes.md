# EPMCDMETST-67543 – Implementation Notes
Story: [EPMCDMETST-67543](https://jiraeu.epam.com/browse/EPMCDMETST-67543) · Branch: `feature/EPMCDMETST-67543-card-created-edited-dates` · Plan: [impl-plan.md](impl-plan.md) (commit `e0ca5b7`) · Architecture: [architecture.md](architecture.md) (commit `098a1af`) · Design review: [design-review.md](design-review.md) (commit `5d70e26`) · Requirements: [requirements.md](requirements.md) (commit `58dfc33`) · Date: 2026-10-04

Scope: Step 5 tasks T-1 … T-7 of the approved plan. Step 7 tasks T-8 … T-15 (Playwright, Gherkin, E2E, verification) are not part of this step. `todoServer.js`, `index.html`, `package.json` and the data files are unchanged.

## 1. Tasks

| T | Status | What was done | FR / AC / decisions | Commit |
|---|---|---|---|---|
| T-1 | ✅ | Constants `EDITED_THRESHOLD_MS = 1000` and `CARD_MONTHS` plus pure helpers `parseCardDate`, `formatCardDate`, `getCardDates` placed directly above `renderTodos`, matching architecture Section 6.3. No DOM access, never throw, tolerate `null` / non-object `todo`. | FR-001 … FR-007, FR-012; AC-001 … AC-004; NFR-002, NFR-005; D-11 | `7eef3cb` |
| T-4 | ✅ | Guarded `module.exports = { parseCardDate, formatCardDate, getCardDates, EDITED_THRESHOLD_MS }` as the last statement of `public/script.js`; no effect in the browser. | FR-012; AC-008; R-4, D-11 | `7eef3cb` |
| T-6 | ✅ | `tests/unit/EPMCDMETST-67543.test.js`: 51 Jest cases covering every case of plan Section 4 (module load, `formatCardDate` incl. 12-month table and 00:30 / 23:30 local-midnight cases, `parseCardDate` valid / invalid inputs, `getCardDates` labels, fallback, 1 / 500 / 1000 / 1001 ms and ±1 day thresholds, null todo, no `Invalid Date` / `NaN` / `undefined`). Three D-9 global stubs; local-time constructors; no `process.env.TZ`; no jsdom. Loading via `fs` + `vm` instead of `require` (OOS-3, see Section 5). | FR-014, FR-002, FR-004 … FR-007, FR-012; AC-002 … AC-004, AC-008; D-4, D-9 (deviation OOS-3) | `c05a389` |
| T-2 | ✅ | `buildTodoDates(todo)`: `div.todo-timestamp[data-testid="todo-dates"]` with `span.todo-date[data-testid="todo-created"]`; only when `edited` is not `null` also `span.todo-date-sep` and `span.todo-date[data-testid="todo-edited"]`. Text set with `textContent` only. Separator has no `aria-hidden`; its source is the JavaScript escape (space, backslash-u00B7, space), not the literal character. | FR-001, FR-003, FR-005, FR-008, FR-011; AC-001, AC-003, AC-006, AC-008; NFR-001; D-6, D-8 | `7eef3cb` |
| T-3 | ✅ | In `renderTodos` the 3-line `Created: … \| Updated: …` `toLocaleString()` block was replaced by `const timestamps = buildTodoDates(element);`. Card assembly order and every other line unchanged; pre-existing duplicates not refactored. | FR-010, FR-013, FR-015; AC-001, AC-005, AC-007; D-11 | `7eef3cb` |
| T-5 | ✅ | `.output .todo-timestamp` colour `#bbb` → `#6b7280` (font-size 0.85em and margin kept); new `.output .todo-timestamp .todo-date { white-space: nowrap; }`; new `@media (max-width: 480px)` after the 700px rule: `.todo-date` block / normal / `overflow-wrap: anywhere`, `.todo-date-sep` hidden. | FR-008, FR-009; AC-006; NFR-003, NFR-004; OOS-1, D-5, D-7 | `b03a48d` |
| T-7 | ✅ | Self-check: unit, hooks and docs suites green; app start verified with data backup / restore; D-8 escape byte check; these notes. | AC-001 … AC-006, AC-008 (smoke); FR-015 | this commit |

## 2. Files Changed

| File | Change |
|---|---|
| `public/script.js` | +60 / −3 lines in `7eef3cb`: constants, three pure helpers, `buildTodoDates`, the `renderTodos` timestamp line, guarded export. |
| `public/styles.css` | +8 / −1 lines in `b03a48d`: colour, `.todo-date` nowrap rule, 480px media query. |
| `tests/unit/EPMCDMETST-67543.test.js` | New file in `c05a389` (196 lines, 51 tests). |
| `docs/sdlc/EPMCDMETST-67543/implementation-notes.md` | New (this file). |

Not changed: `todoServer.js`, `index.html`, `package.json`, `package-lock.json`, `todos.json`, `users.json`, `sessions.json`, `.github/`, `.env*`.

## 3. Commits

| SHA | Message |
|---|---|
| `7eef3cb` | feat(EPMCDMETST-67543): show created and edited dates on todo cards |
| `b03a48d` | style(EPMCDMETST-67543): style card date line and mobile wrapping |
| `c05a389` | test(EPMCDMETST-67543): add unit tests for card date helpers |
| (this commit) | docs(EPMCDMETST-67543): add implementation notes |

Nothing pushed.

## 4. Test Results

| Command | Suites | Tests | Result |
|---|---|---|---|
| `npm run test:unit` | 1 passed / 1 | 51 passed / 51 | PASS (no transform override) |
| `npm run test:hooks` | 1 passed / 1 | 46 passed / 46 | PASS |
| `npm run test:docs` | 1 passed / 1 | 9 passed / 9 | PASS |

No `test.only`, no skipped tests.

Build: `npm run build` / `scripts/build.ps1` are Not Found in the repository (PR-2); no build was run.

App start (data files `todos.json`, `users.json`, `sessions.json` copied to `*.bak` first): `node todoServer.js` logged `App is listening on http://localhost:3000`; `GET /` → 200; `GET /script.js` → 200 and the served file contains `buildTodoDates`. Server stopped (port 3000 no longer answers). Data files compared byte-for-byte with the backups (unchanged), restored, `.bak` files deleted; `git status` shows no data file modified or staged. A browser render check of the cards is covered by the Step 7 E2E tests (T-11).

D-8 byte check on `public/script.js`: literal U+00B7 (bytes `C2 B7`) count 0; escape sequence backslash-u00B7 count 1 (the separator line in `buildTodoDates`).

## 5. Deviations

| ID | Deviation | Reason | Approval |
|---|---|---|---|
| OOS-3 | T-6 loads `public/script.js` with `fs.readFileSync` + `vm.runInThisContext` (a wrapper function receiving `module`, `window`, `localStorage`, `document`) instead of the single `require` of D-9. Two `Date` assertions use `Object.prototype.toString.call(x) === '[object Date]'` instead of `toBeInstanceOf(Date)`, because the vm-loaded code runs in a different realm from the Jest test context. | With `require`, Jest's default Babel transform parses `script.js` as a strict module and fails: `SyntaxError: … public/script.js: Identifier 'fetchAndRenderTodos' has already been declared. (275:9)` (pre-existing duplicate, not refactored per D-11). Only the test file changed; no Jest config, `package.json` or app code change. | Human, after Gate-5 escalation: option "A" |
| – | Line endings: `public/script.js` and the new test file are LF in the working copy (the files were rewritten by Node to keep the D-8 escape intact, because the editing tools turned the escape into the literal character). With `core.autocrlf=true` Git normalises them; committed diffs contain only the intended lines. | Tooling | Informational |

## 6. Known Limitations

- `public/script.js` is not strictly ASCII-only: it already contained a literal `×` (U+00D7) in the clear-search button (`clearBtn.textContent`), which is kept unchanged per human decision and D-11. The new code adds no non-ASCII characters.
- Build script (`npm run build`, `scripts/build.ps1`): Not Found (PR-2).
- `buildTodoDates` (DOM) is not unit-tested (no jsdom, D-9); covered by the Step 7 E2E tests (T-11).
- Carried forward from earlier steps: KL-2 (toggle counts as an edit), KL-3 (edits within 1000 ms of creation are not shown), D-10 items, Epic Link `customfield_14500` Not Found (KL-1), network access for the Playwright install unverified (PR-1).
