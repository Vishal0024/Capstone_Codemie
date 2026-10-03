---
name: implementation-planning
description: Template and rules for docs/sdlc/<KEY>/impl-plan.md — a prioritised, dependency-ordered task list with blocked tasks, critical path, unit-test tasks and Definition of Done. Use in SDLC Step 4.
---

# Implementation Planning

## Rules
- Tasks come only from the final `architecture.md`; each names exact files and traces to FR/AC.
- **Priority:** P1 (required for any AC), P2 (required for remaining ACs/NFRs), P3 (polish).
- **Order by dependency** (a task appears after everything it depends on), then by priority.
- **Blocked tasks:** list every task that cannot start until another finishes, with the reason. No dependency cycles.
- Include unit-test tasks for Step 5 next to the code they test; integration/E2E belong to Step 7.

## Template (`impl-plan.md`)
```markdown
# <KEY> – Implementation Plan
Branch: feature/<KEY>-<name> · Architecture: docs/sdlc/<KEY>/architecture.md

## 1. Task List (dependency-ordered)
| Order | T | Task | Priority | Files | FR/AC | Depends on |
## 2. Blocked Tasks
| T | Blocked until | Reason |
## 3. Critical Path
T-1 → T-3 → …
## 4. Unit Tests (Step 5)
| Test file | Covers T | Cases (happy path, Not Found / missing field, invalid input) |
## 5. Verification Outline (Step 7)
| AC | Gherkin scenario | Integration test | E2E test |
## 6. Risks
## 7. Definition of Done
```
