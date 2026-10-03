---
name: requirements-analysis
description: Clarifying-question process and template for turning a Jira Story into docs/sdlc/<KEY>/requirements.md with traceable functional and non-functional requirements. Use in SDLC Step 1.
---

# Requirements Analysis

## Clarifying questions (questions mode)
- Ask only about genuine ambiguity that would change behaviour, data, UI, validation or scope — not about things the Story or code already answers.
- 3–8 numbered questions, each with: **why it matters** and a **suggested default**.
- Typical topics: display formats, empty/missing data behaviour ("Not Found"), validation limits, sorting/filtering interplay, which screens are affected, backward compatibility with existing todos.

## Rules (final mode)
- Every acceptance criterion (AC-n) maps to ≥1 functional requirement (FR-n); every FR traces to an AC or a clarification, or is marked "derived" with a reason.
- Requirements are testable and free of design decisions.
- Unknowns stay visible: `Not Found` / open questions — never silent guesses.

## Template (`requirements.md`)
```markdown
# <KEY> – Requirements
Story: <Jira link> · Branch: feature/<KEY>-<name> · Date: <date>

## 1. User Story
## 2. Acceptance Criteria (verbatim from Jira)
| AC | Text |
## 3. Clarifications
| # | Question | Answer (user / default) | Effect on requirements |
## 4. Functional Requirements
| FR | Requirement | Traces to | Priority (Must/Should) |
## 5. Non-Functional Requirements
| NFR | Category (security, performance, usability, compatibility, accessibility) | Requirement |
## 6. Constraints
## 7. Out of Scope
## 8. Impacted Components
| Component | File(s) | Expected change |
## 9. Assumptions & Open Questions
```
