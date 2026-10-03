# Claude Code CLI Usage — Pro To-Do SDLC

## Run: Due Dates for todos (EPMCDMETST-67513)

- **Date:** 2026-10-03
- **Tool:** Claude Code CLI via CodeMie (`/protodo-sdlc --from 5 EPMCDMETST-67513`)
- **Prompt summary:** Phase 5: get the implementation spec from `@5-protodo-developer` for Epic EPMCDMETST-67513, then implement it on branch `feat/add-due-date`, verify, commit and open a PR.
- **Jira:** Epic EPMCDMETST-67513; Stories EPMCDMETST-67514, -67515, -67516, -67517, -67518; Sub-tasks EPMCDMETST-67519 to -67527

### Files changed
| File | Change |
|---|---|
| `todoServer.js` | `normalizeDueDate`, `withDueDate`, `isOverdue` helpers. `dueDate` on POST/PUT (400 `Invalid dueDate`; PUT keeps the existing value when the key is absent). `filter=overdue`, `sort=dueDate` (undated last, ties by id). Legacy todos returned with `dueDate: null` |
| `index.html` | "Overdue" filter option, "Sort by Due date" option, `#edit-dueDate` date input in the modal |
| `public/script.js` | Removed the duplicate `fetchAndRenderTodos`. Fixed the empty `filter=` param. Due date pre-filled and cleared in the modal and sent on create/edit. Due date line, `overdue` card class and `OVERDUE` badge rendered |
| `public/styles.css` | `.todo-dueDate`, `.output.overdue`, `.overdue-badge`, date input styling |
| `package.json` | `start` → `node todoServer.js`, added `dev` (nodemon) and `build` scripts |
| `scripts/build.ps1` | New: packages `dist/pro-todo-<version>.zip` (server, index.html, public/, package.json, package-lock.json; runtime JSON data excluded) |
| `.gitignore` | Added `.sdlc/`. Removed the self-ignoring `.gitignore` entry |
| `README.md` | Due-date feature, API notes, build instructions, Claude Code CLI usage section |
| `docs/ai/claude-code-cli-usage.md` | This run log |

### Verification results (actual, Windows PowerShell, Node v22.12.0)
| Step | Result |
|---|---|
| `npm install` | exit 0 (npm audit reports pre-existing advisories) |
| `npm run build` | exit 0. `dist/pro-todo-1.0.0.zip` created (1,360,525 bytes). It contains `todoServer.js`, `index.html`, `package.json`, `package-lock.json`, `public/**`. No `todos.json`/`users.json`/`sessions.json` |
| Server start + `GET http://localhost:3000` | HTTP 200 |
| API smoke test (temporary user; data files backed up and restored) | POST with `2020-01-01` → `2020-01-01T00:00:00.000Z`. POST without dueDate → `null`. POST `dueDate:"nope"` → 400. PUT without key keeps the date. PUT with a new date updates it. PUT `null` clears it. `sort=dueDate` → Past, Future2, (undated) Welcome, NoDate. `filter=overdue` → Past only |
| Server stop | Port 3000 released |
