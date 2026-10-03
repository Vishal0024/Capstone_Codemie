---
description: Show the 8-step SDLC progress of a Jira story from its artifacts (read-only)
argument-hint: "<STORY-KEY>"
---

Show the SDLC status of `$ARGUMENTS` without changing anything:
1. List the artifacts in `docs/sdlc/$ARGUMENTS/` and map them to Steps 1–8 from `CLAUDE.md`, with the last commit of each (`git log -1 --format="%h %s" -- <file>`).
2. Show `.claude/state/sdlc-state.json` if it refers to this story.
3. Show the feature branch for this story (if any) and `gh pr list --head <branch>`.
4. Print a table — step, status (done / pending / awaiting approval), artifact or link — and suggest the next command.
