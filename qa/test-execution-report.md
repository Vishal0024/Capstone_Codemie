# QA Test Execution Report
## Feature: Todo Completion Counter / Summary Bar (Enhancement 5)
## Epic: EPMCDMETST-66727 | PR: https://github.com/Vishal0024/Capstone_Codemie/pull/3
## Branch: feat/summary-bar
## Date: 2026-09-26
## Environment: Windows localhost, Node.js, port 3000

---

## Test Suite 1 — Backend API Tests (Jest + supertest)
| Metric | Value |
|--------|-------|
| Test file | tests/api.test.js |
| Total tests | 10 |
| Passed | 10 |
| Failed | 0 |
| Errors | 0 |
| Duration | 1.68s |

### Test Case Results
| TC ID | Scenario | Result |
|-------|----------|--------|
| API-01 | POST /login valid credentials → 200 + token | PASS |
| API-02 | GET /todos authenticated → 200 + array | PASS |
| API-03 | GET /todos?filter=completed → completed only | PASS |
| API-04 | GET /todos?filter=active → active only | PASS |
| API-05 | GET /todos?search=term → filtered results | PASS |
| API-06 | POST /todos → 201 + new todo object | PASS |
| API-07 | DELETE /todos/:id → 200 + removed from list | PASS |
| API-08 | PATCH /todos/:id/toggle → completed toggled | PASS |
| API-09 | GET /todos no token → 401 | PASS |
| API-10 | POST /login wrong password → 401 | PASS |

---

## Test Suite 2 — Playwright E2E Tests (Chromium)
| Metric | Value |
|--------|-------|
| Test file | tests/e2e/summary-bar.spec.js |
| Browser | Chromium |
| Base URL | http://localhost:3000 |
| Total tests | 10 |
| Passed | 10 |
| Failed | 0 |
| Errors | 0 |
| Duration | 31.8s |

### Test Case Results
| TC ID | Scenario | Result |
|-------|----------|--------|
| TC-01 | Summary Bar visible on login, label contains correct text | PASS |
| TC-02 | Singular "task" label when total=1 | PASS |
| TC-03 | "0 of 0 tasks completed" when empty list | PASS |
| TC-04 | Toggle complete updates label count | PASS |
| TC-05 | All complete → .all-done class on progress fill | PASS |
| TC-06 | Active filter → bar reflects active count | PASS |
| TC-07 | Completed filter → bar reflects completed count | PASS |
| TC-08 | Search term → bar updates to search result count | PASS |
| TC-09 | 375px viewport → .summary-bar visible, no overflow | PASS |
| TC-10 | aria-valuenow is 0–100 numeric value | PASS |

---

## Overall Summary
| Metric | Value |
|--------|-------|
| Total test cases | 20 |
| Total passed | 20 |
| Total failed | 0 |
| Pass rate | 100% |
| Blocker defects | 0 |

## Defects Found (if any)
| # | TC ID | Description | Severity |
|---|-------|-------------|----------|
| (none) | | | |

## Sign-off
- QA executed by: Claude Code CLI (CodeMie)
- Reviewed by: Vishal Bansal
- Status: READY FOR MERGE
