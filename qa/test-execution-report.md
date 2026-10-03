# Test Execution Report: Due Dates for todos (EPMCDMETST-67513)

- **Date:** 2026-10-03
- **Branch / PR:** `feat/add-due-date` / https://github.com/Vishal0024/Capstone_Codemie/pull/4
- **Environment:** Windows 11 Enterprise, PowerShell, Node v22.12.0, npm. Jest 29.7, supertest 6.3, @playwright/test 1.63 (Chromium)
- **Executed by:** Claude Code CLI via CodeMie (`/protodo-sdlc --from 7 EPMCDMETST-67513`), from the @7-protodo-qa test spec
- **Data safety:** `todos.json`, `users.json` and `sessions.json` were backed up before the run and restored afterwards. `git diff` shows no change to tracked data files.

## Summary
| Suite | Command | Total | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|---|---|
| API (Jest + supertest) | `npm run test:api` | 20 | 20 | 0 | 0 | 0.87 s (rerun 0.75 s) |
| E2E (Playwright, Chromium) | `npm run test:e2e` | 5 | 5 | 0 | 0 | 29.2 s |
| **Total** | | **25** | **25** | **0** | **0** | |

**Result: PASS.** 25 of 25 tests passed. No test code needed fixing for selectors or timing, and no app code was changed.

## API results (`tests/api/due-dates.test.js`)
| ID | Test | Story | Result |
|---|---|---|---|
| TC-001 | Date-only string is stored as UTC midnight and returned by GET | 67514, 67515 | PASS |
| TC-002 | Missing dueDate becomes null | 67514, 67515 | PASS |
| TC-002b | null and "" become null | 67514, 67515 | PASS |
| TC-003 ×6 | Invalid dueDate ("not-a-date", "2026-13-01", "2026-02-31", 12345, true, {}) returns 400 `Invalid dueDate` | 67515 | PASS |
| TC-003b | Timestamp with an offset is normalised to ISO UTC | 67515 | PASS |
| TC-004 | PUT sets dueDate, and GET /:id returns it | 67515 | PASS |
| TC-005 | PUT without the key keeps the value; null and "" clear it | 67515 | PASS |
| TC-005b | Invalid dueDate on PUT returns 400 and the stored value is unchanged | 67515 | PASS |
| TC-005c | Missing title or description returns 400 `Invalid input` | 67515 | PASS |
| TC-005d | Omitting `completed` is accepted (records current behaviour) | 67515 | PASS |
| TC-005e | Unknown id returns 404 | 67515 | PASS |
| TC-006 | sort=dueDate: ascending, undated last, ties broken by id | 67516 | PASS |
| TC-007 | filter=overdue returns only incomplete past-due todos | 67516 | PASS |
| — | Unauthenticated list returns 401 | 67516 | PASS |
| TC-008 | Legacy record without a dueDate key returns dueDate null (list and detail) | 67514 | PASS |

## E2E results (`tests/e2e/due-dates.spec.js`)
| ID | Test | Story | Result | Time |
|---|---|---|---|---|
| TC-009 | Sign up and log in through the UI, create a todo with a due date, card shows "Due: 1/2/2099" | 67517 | PASS | 13.4 s |
| TC-010 | Edit pre-fills `2099-01-02`; changing it updates the card to "Due: 1/3/2099" | 67517 | PASS | 2.0 s |
| TC-011 | Clearing the due date removes the Due line; API returns null | 67517 | PASS | 5.2 s |
| TC-012 | Overdue card has the `overdue` class and an OVERDUE badge; the Overdue filter shows one card | 67518 | PASS | 0.97 s |
| TC-013 | Sort by Due date: earliest first, undated last | 67518 | PASS | 0.65 s |

## Artefacts
- Gherkin: `qa/features/due-dates.feature`
- API tests: `tests/api/due-dates.test.js`, `jest.config.js`, `tests/support/*`
- E2E tests: `tests/e2e/due-dates.spec.js`, `playwright.config.js`, `tests/e2e/global-setup.js`, `tests/e2e/global-teardown.js`
- Playwright HTML report: `playwright-report/` (gitignored)

## Notes and known issues
- **Test-config change (not a test fix):** after the first API run, `modulePathIgnorePatterns: ['<rootDir>/dist/']` was added to `jest.config.js`. It removes a Jest haste-map warning about the duplicate `package.json` in the `dist/` build output. Results were the same before and after.
- **Story mapping:** inferred by @7-protodo-qa and from the commit messages. The QA assistant reported reading the Jira acceptance criteria but did not quote them.
- **Open code-review finding (not covered):** the repeated `window.onclick` assignments in `public/script.js` mean a click outside the edit modal doesn't close it. The bug was already on `main`, no test depends on it, and it is still open from the Phase 6 review.
- **Overdue rule:** a todo is overdue once UTC midnight at the start of its due day has passed, as specified. The tests use 2020 dates for overdue and 2099 dates for not overdue, so results don't depend on the run date.
