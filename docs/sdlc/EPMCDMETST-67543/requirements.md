# EPMCDMETST-67543 – Requirements
Story: [EPMCDMETST-67543](https://jiraeu.epam.com/browse/EPMCDMETST-67543) · Branch: `feature/EPMCDMETST-67543-card-created-edited-dates` · Date: 2026-10-04

| Field | Value |
|---|---|
| Summary | Show created and edited dates on todo cards |
| Issue type | Story |
| Status | Open |
| Priority | Average |
| Labels | Not Found (none set) |
| Epic Link (`customfield_14500`) | Not Found (field is null) |

## 1. User Story

As a Pro To-Do user, I want to see when each task was created and last edited directly on its task card, so that I can tell how old a task is and whether it changed recently without opening it.

Business requirement (verbatim): Each todo already stores a creation date and a last-updated date, but the task cards do not show them. Display these dates in the card's metadata area in a consistent, readable format. Tasks with a missing or invalid date must show a neutral fallback instead of an error.

Note on current state: the cards do already render a `.todo-timestamp` line (`Created: … | Updated: …` using `toLocaleString()`, in `renderTodos` in `public/script.js`). Per Clarification 1 this existing line is replaced by the new display.

## 2. Acceptance Criteria (verbatim from Jira)

| AC | Text |
|---|---|
| AC-001 | Each todo card shows its creation date in the card's metadata area, labelled "Created", e.g. "Created 05 Oct 2026". |
| AC-002 | Dates use the format DD Mon YYYY (e.g. 05 Oct 2026), shown in the user's local time zone. |
| AC-003 | If a todo has been changed after it was created (last-updated date later than creation date), the card also shows "Edited " in the same format; otherwise no "Edited" label is shown. |
| AC-004 | If a todo's creation date is missing or invalid, the card shows "Created: Not available"; a missing or invalid last-updated date shows no "Edited" label. The list still renders without errors. |
| AC-005 | The dates appear immediately after creating or editing a task, without reloading the page. |
| AC-006 | The date text is styled consistently with the existing card metadata and remains readable on mobile widths (≤ 480px). |
| AC-007 | Existing features (sign-up, login, create, edit, complete, filter, sort, search, delete) continue to work. |
| AC-008 | Automated tests cover the date display, the "Edited" label, and the missing/invalid date fallback. |

## 3. Clarifications

The user replied "use defaults"; all suggested defaults from the questions pass were accepted.

| # | Question | Answer (user / default) | Effect on requirements |
|---|---|---|---|
| 1 | The card already shows `Created: … \| Updated: …` with `toLocaleString()`. Replace it or add a second line? | Default accepted: replace the existing `.todo-timestamp` content with the new Created/Edited display; remove "Updated:" and time-of-day. | FR-001, FR-010; no duplicate date line. |
| 2 | What counts as "later than creation date"? POST /todos calls `new Date()` twice, so `updatedAt` can exceed `createdAt` by about 1 ms on a never-edited todo. | Default accepted: show "Edited" only when `updatedAt` is more than 1000 ms later than `createdAt` (timestamp comparison, not calendar days). A same-day edit still shows "Edited" with the same date. | FR-004, FR-005. |
| 3 | Toggling Complete/Active also sets `updatedAt`. Does that count as an edit? | Default accepted: yes, any `updatedAt` change counts; the frontend cannot distinguish. Recorded as a known limitation. | FR-004; Section 9 (KL-2). |
| 4 | Exact label text and punctuation? | Default accepted: "Created 05 Oct 2026" and "Edited 06 Oct 2026" (no colon); fallback exactly "Created: Not available". | FR-001, FR-003, FR-006. |
| 5 | Month names: browser locale or fixed English? | Default accepted: always English 3-letter months (Jan–Dec) from a fixed array, 2-digit zero-padded day, 4-digit year, using local-time `getDate()` / `getMonth()` / `getFullYear()`. | FR-002. |
| 6 | What is a "missing or invalid" date? | Default accepted: absent, `null`, empty string, not a string or number, or `new Date(value)` yields NaN. "Edited" is hidden if `updatedAt` is invalid, if `createdAt` is invalid, or if `updatedAt` ≤ `createdAt` + 1000 ms. | FR-005, FR-006, FR-007. |
| 7 | Layout and mobile behaviour? | Default accepted: Created and Edited on one line separated by " · " inside the existing `.todo-timestamp` container, reusing its style; add a `@media (max-width: 480px)` rule that lets them wrap to separate lines, font size ≥ 0.8em, contrast adjusted if needed. | FR-008, FR-009, NFR-003, NFR-004. |
| 8 | Test hooks and testability? | Default accepted: `data-testid="todo-dates"` on the container, `data-testid="todo-created"` on the Created text, `data-testid="todo-edited"` on the Edited text (rendered only when shown). Date formatting lives in a small pure function in `public/script.js` that unit tests can call. | FR-011, FR-012, FR-014. |

## 4. Functional Requirements

| FR | Requirement | Traces to | Priority (Must/Should) |
|---|---|---|---|
| FR-001 | Every rendered todo card shows, in its metadata area, the text "Created " followed by the formatted `createdAt` date (e.g. "Created 05 Oct 2026"), with no colon. | AC-001, Clar. 1, 4 | Must |
| FR-002 | Dates are formatted as `DD Mon YYYY`: 2-digit zero-padded day, English 3-letter month from a fixed list (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec), 4-digit year, computed in the user's local time zone; no time-of-day is shown. Output does not depend on browser locale. | AC-002, Clar. 5 | Must |
| FR-003 | When "Edited" is shown, the text is "Edited " followed by the formatted `updatedAt` date in the FR-002 format (e.g. "Edited 06 Oct 2026"). | AC-003, Clar. 4 | Must |
| FR-004 | "Edited" is shown only when both dates are valid and `updatedAt` is more than 1000 ms later than `createdAt`. Any such change, including a Complete/Active toggle, counts as an edit. | AC-003, Clar. 2, 3 | Must |
| FR-005 | "Edited" is not shown (no element, no label) when `updatedAt` ≤ `createdAt` + 1000 ms, when `updatedAt` is missing/invalid, or when `createdAt` is missing/invalid. | AC-003, AC-004, Clar. 2, 6 | Must |
| FR-006 | When `createdAt` is missing or invalid, the card shows exactly "Created: Not available". | AC-004, Clar. 4, 6 | Must |
| FR-007 | A date value is invalid when it is absent, `null`, an empty string, not a string or number, or `new Date(value)` yields an invalid date (NaN). Invalid values never throw and never render "Invalid Date", "NaN" or "undefined". The rest of the list renders normally. | AC-004, Clar. 6 | Must |
| FR-008 | Created and Edited appear on one line separated by " · " inside the existing `.todo-timestamp` metadata container, reusing its existing visual style. | AC-006, Clar. 7 | Must |
| FR-009 | At viewport widths ≤ 480px, the Created and Edited texts may wrap onto separate lines, stay fully visible (no clipping or horizontal overflow) and use a font size of at least 0.8em. | AC-006, Clar. 7 | Must |
| FR-010 | The previous "Created: … \| Updated: …" text with time-of-day is no longer displayed on the cards. | Clar. 1 | Must |
| FR-011 | The dates container has `data-testid="todo-dates"`, the Created text has `data-testid="todo-created"`, and the Edited text has `data-testid="todo-edited"`; the `todo-edited` element exists only when Edited is shown. | Story constraint, AC-008, Clar. 8 | Must |
| FR-012 | The date-formatting and validity logic is exposed as a small pure function (no DOM access) in `public/script.js` that unit tests can call directly. | AC-008, Clar. 8 | Must |
| FR-013 | After a task is created or edited, its card shows the current Created/Edited dates without a page reload (the existing create/edit flow re-renders via `fetchAndRenderTodos()`). | AC-005 | Must |
| FR-014 | Automated tests cover: valid date formatting (including zero-padded day and all month names), the Edited label shown/hidden rules including the 1000 ms threshold, and the missing/invalid date fallbacks for both fields. | AC-008 | Must |
| FR-015 | Existing features (sign-up, login, create, edit, complete, filter, sort, search, delete) behave as before. | AC-007 | Must |

## 5. Non-Functional Requirements

| NFR | Category (security, performance, usability, compatibility, accessibility) | Requirement |
|---|---|---|
| NFR-001 | Security | Date text is inserted with `textContent` (or equivalent safe text APIs), never as unescaped HTML. |
| NFR-002 | Compatibility | Uses built-in JavaScript `Date` only; no new npm or CDN dependencies. Works with existing todos whose `createdAt`/`updatedAt` are ISO strings, and with todos lacking these fields. |
| NFR-003 | Usability | The date text is visually consistent with the existing `.todo-timestamp` metadata (size, colour family, placement). |
| NFR-004 | Accessibility | Date text remains legible at ≤ 480px with a font size ≥ 0.8em; text contrast against the card background is checked and adjusted if needed so it stays readable. |
| NFR-005 | Performance | Formatting adds no network requests and negligible render cost (constant work per card). |
| NFR-006 | Compatibility | No backend, API or data-file changes; GET /todos response shape is unchanged. |

## 6. Constraints

- Frontend-only: changes limited to `index.html`, `public/script.js` and `public/styles.css`, plus tests (from Jira).
- Use the existing `createdAt` and `updatedAt` fields returned by GET /todos; no backend, API or data-file changes (from Jira).
- No new dependencies; format dates with built-in JavaScript only (from Jira).
- Render date text safely (`textContent`) and add `data-testid` attributes for testing (from Jira).
- Do not modify unrelated application behaviour (from Jira).
- Never commit `todos.json`, `users.json`, `sessions.json`; back up and restore them around test runs (project rule).

## 7. Out of Scope

- Due dates or reminders.
- Sorting or filtering by date.
- Relative times (e.g. "2 days ago") or time-of-day display.
- User-selectable date formats or time-zone settings.
- Editing the dates manually.
- Distinguishing a status toggle from a content edit (would need backend changes; see KL-2).
- Fixing the double `new Date()` call in POST /todos (backend change; handled on the frontend by the 1000 ms threshold).

## 8. Impacted Components

| Component | File(s) | Expected change |
|---|---|---|
| Todo card rendering | `public/script.js` (`renderTodos`) | Replace the `.todo-timestamp` content with Created/Edited elements carrying `data-testid` attributes, set via `textContent`. |
| Date helper | `public/script.js` | New small pure function(s) for validity check and `DD Mon YYYY` formatting, callable from unit tests. |
| Card metadata style | `public/styles.css` (`.output .todo-timestamp`) | Reuse existing style; add a `@media (max-width: 480px)` rule for wrapping, font size ≥ 0.8em and contrast. |
| Page markup | `index.html` | Not expected to change; listed because the Story allows it. |
| Tests | `tests/` | New unit tests for the date helper and E2E/API-backed checks for the card display. |
| Backend | `todoServer.js` | No change. |

## 9. Assumptions & Open Questions

Assumptions:
- A-1: GET /todos returns `createdAt` and `updatedAt` as ISO 8601 strings for todos created by the current server (observed in `todoServer.js`).
- A-2: The existing create and edit flows already call `fetchAndRenderTodos()`, so AC-005 is met by the current re-render path; verification will confirm it.
- A-3: The only existing responsive breakpoints are 700px and 400px; a new 480px breakpoint is added for this Story.
- A-4: No existing tests reference `.todo-timestamp`, so replacing its content does not break current tests.

Open questions / Known Limitations:
- KL-1: Epic Link (`customfield_14500`) is Not Found (null in Jira); the Story is not linked to an Epic.
- KL-2: Toggling Complete/Active updates `updatedAt` on the server, so a toggled-but-otherwise-unchanged todo shows "Edited". The frontend cannot distinguish a toggle from a content edit (accepted default, Clarification 3).
- KL-3: Changes of less than 1000 ms after creation are not shown as "Edited" (deliberate threshold, Clarification 2).
- KL-4: Labels in Jira: Not Found (none set).
- KL-5: `git pull` on `main` before branching failed with a network error ("Failed to connect to github.com port 443"); the branch was created from local `main`, which git reported as up to date with `origin/main` at the last fetch.
