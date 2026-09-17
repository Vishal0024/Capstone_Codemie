# Claude Code CLI Usage — Task Summary Counter Bar

**Date:** 2026-09-17
**Tool:** Claude Code CLI via CodeMie
**Jira Epic:** EPMCDMETST-65254
**Stories:** EPMCDMETST-65255 – EPMCDMETST-65258
**Sub-tasks:** EPMCDMETST-65259 – EPMCDMETST-65266
**Branch:** `feat/task-summary-counter-bar`

## Prompt Summary

> Add a "Task Summary Counter Bar" showing Total, Active and Completed counts for the logged-in user.
> Requirements included: HTML summary bar with ARIA, JS consolidation of duplicate functions + updateSummaryBar(),
> glassmorphism CSS, a PowerShell build script, package.json build command, .gitignore updates, and documentation.

## Files Changed

| File | Change |
|---|---|
| `index.html` | Added `#todo-summary` region with 3 counter cards (Total, Active, Completed) |
| `public/script.js` | Removed duplicate `fetchAndRenderTodos()`; added `updateSummaryBar()`; show/hide bar on login/logout |
| `public/styles.css` | Added glassmorphism styles for `.summary-card`, responsive stacking at ≤480 px |
| `package.json` | Updated `build` script to invoke `scripts/build.ps1` |
| `scripts/build.ps1` | New PowerShell build script: copies source → `dist/pro-todo-<version>/`, zips, exits 1 on error |
| `.gitignore` | Added `todos.json` and `users.json` exclusions |
| `README.md` | Added "Task Summary Counter Bar" feature section and "Claude Code CLI Usage" link |
| `docs/ai/claude-code-cli-usage.md` | This file |

## Verification Results

### Build
```
npm install          # OK — no new packages added
npm run build        # dist/pro-todo-1.0.0.zip created successfully
```

### Manual UI Checks (http://localhost:3000)

1. **Logged-out state** — summary bar is hidden; login/register buttons visible.
2. **Login** — summary bar appears with correct Total / Active / Completed counts.
3. **Add todo** — all three counters update (Total +1, Active +1).
4. **Mark Complete** — Completed +1, Active -1, Total unchanged.
5. **Mark Active** — Active +1, Completed -1, Total unchanged.
6. **Delete todo** — Total -1, appropriate Active or Completed -1.
7. **Edit todo** (title/description only) — counts remain consistent.
8. **Filter (Active / Completed / All)** — bar always shows unfiltered totals regardless of filter selection.
9. **Search** — bar counts do not change when search narrows the view.
10. **Logout** — bar hides, all counts reset to 0.
11. **Refresh while logged in** — bar reappears with correct counts immediately.
12. **Mobile (≤480 px)** — cards stack vertically in a column layout.
13. **ARIA** — `aria-label` on each card reads e.g. "7 Total tasks"; `aria-live="polite"` on the region.
