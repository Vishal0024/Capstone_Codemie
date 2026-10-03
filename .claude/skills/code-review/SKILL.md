---
name: code-review
description: The 7-area code review checklist from the capstone (correctness, security, error handling, test coverage, code clarity, DRY, dependency safety) with severity rules, for Pro To-Do changes. Use in SDLC Step 6.
---

# Code Review — 7 Review Areas

Answer every review question explicitly (✅ / ⚠️ / ❌ + evidence).

| Review Area | Review Question | How to check |
|---|---|---|
| **Correctness** | Does each component behave as specified in `requirements.md`? | Trace every FR/AC to code; edge cases incl. existing records without new fields |
| **Security** | Are secrets excluded from output? Is user input validated? | No tokens/`.env`/logs of credentials; validation on every new input; auth + user scoping; XSS-safe rendering |
| **Error Handling** | Are all API failures, missing files, and empty data handled gracefully? | JSON file read/write errors, empty lists, missing fields → "Not Found"/defaults, fetch failures in the UI, consistent HTTP status codes |
| **Test Coverage** | Do tests cover the happy path AND the "Not Found" / missing-field edge cases? | Unit/API tests per FR; negative and missing-data cases present; no `.only`/skipped tests |
| **Code Clarity** | Are function names self-explanatory? Is logic easy to follow without comments? | Naming, function size, nesting, no dead code/debug logs |
| **DRY Principle** | Is there duplicated logic that can be refactored into a shared function? | Grep for repeated blocks; reuse of existing helpers; duplicate handlers |
| **Dependency Safety** | Are any known-vulnerable package versions present? | `npm audit` result; any new dependency justified and current |

## Severity
- **BLOCKER** — AC not met, security issue, data-loss risk, protected path changed, failing tests, high/critical vulnerability, out-of-scope change without approval.
- **MAJOR** — missing validation/error handling, missing tests for an AC or edge case, significant duplication, moderate vulnerability.
- **MINOR** — naming, style, small refactors, low vulnerability with no fix available.
Verdict: any BLOCKER ⇒ **REQUEST CHANGES**; otherwise **APPROVE** (MAJORs listed as follow-ups or fixed via `fix`).
