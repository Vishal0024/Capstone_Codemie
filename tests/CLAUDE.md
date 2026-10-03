# tests/ — testing rules

These rules apply when creating or editing anything under `tests/`.

## Layout
| Folder | Purpose | Runner | Written in |
|---|---|---|---|
| `tests/unit/` | Unit tests for new/changed logic | Jest — `npm run test:unit` | Step 5 |
| `tests/api/<KEY>.test.js` | Integration (API) tests | Jest + supertest — `npm run test:api` | Step 7 |
| `tests/e2e/<KEY>.spec.js` | Browser tests, one per Gherkin scenario (same title) | Playwright/Chromium — `npm run test:e2e` | Step 7 |
| `tests/features/<KEY>.feature` | Gherkin test cases, tagged `@<KEY>` and `@AC-n` | traceability | Step 7 |
| `tests/hooks/` | Tests for `.claude/hooks` | Jest — `npm run test:hooks` | pipeline |
| `tests/docs/` | Tests for `scripts/check-docs.mjs` | Jest — `npm run test:docs` | pipeline |

## Data safety (mandatory)
The app writes straight to `todos.json`, `users.json` and `sessions.json`. Before any API or E2E run: copy them to `*.bak`; afterwards (always, also on failure): restore them and delete the `.bak` files. Never commit data files or backups.

## Rules
- Cover the happy path **and** the "Not Found" / missing-field / invalid-input cases for every requirement.
- supertest needs the Express `app`: if `todoServer.js` does not export it, export `app` and start the listener only when `require.main === module` (a minimal planned change — note it in the artifact).
- Playwright: `playwright.config.js` with `webServer: { command: 'node todoServer.js', url: 'http://localhost:3000', reuseExistingServer: true }`, Chromium only, HTML reporter to `playwright-report/`, `testDir: 'tests/e2e'`.
- Use `data-testid` selectors; create a unique user per test (timestamped sign-up); accept `confirm()` dialogs.
- Fix test code for selector/timing issues only. Never change application code to make a test pass — report a defect.
- No `test.only`, no skipped tests in committed code. Report real numbers only.
