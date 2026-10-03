---
name: architecture-design
description: Template and design rules for docs/sdlc/<KEY>/architecture.md — architecture recommendation, component diagram, components and responsibilities, technology choices, data flow, LLD, API contract and wireframes for the Pro To-Do Express + vanilla JS app. Use in SDLC Step 2.
---

# Architecture Design

## Design rules
- Recommend the simplest design that satisfies `requirements.md` and fits the existing app (Express routes in `todoServer.js`, JSON-file storage, vanilla JS in `public/script.js`).
- No new frameworks, database servers, Docker or runtime dependencies unless a requirement forces it (justify; list rejected alternatives).
- New data fields get defaults so existing records keep working.
- Every route: auth, user scoping, input validation, consistent errors (400/401/404/500). UI: XSS-safe rendering, `data-testid` on new elements.

## Template (`architecture.md`)
```markdown
# <KEY> – Architecture
Requirements: docs/sdlc/<KEY>/requirements.md

## 1. Architecture Recommendation        (approach in 3–5 sentences, and why)
## 2. Component Diagram                  (mermaid)
## 3. Key Components & Responsibilities
| Component | File(s) | Responsibility | New/Changed |
## 4. Technology Choices
| Concern | Choice | Reason | Alternatives rejected |
## 5. Data Flow                          (mermaid sequence diagram, request → storage → UI)
## 6. Low Level Design
### 6.1 Backend  ### 6.2 Data Model (before/after, defaults)  ### 6.3 Frontend (state, functions, DOM ids, data-testids)
## 7. API Contract                       (method, path, auth, params, request/response, errors — or "No API change")
## 8. Wireframes                         (ASCII, incl. empty/error states)
## 9. Error Handling                     (missing data → "Not Found", invalid input, file I/O, API failures)
## 10. Risks & Mitigations
## 11. Traceability (FR/NFR → section)
## 12. Changes after design review       (added in Step 3 apply-review mode)
```
