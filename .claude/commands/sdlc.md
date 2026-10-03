---
description: Run the full 8-step Pro To-Do SDLC for a Jira story, with human approval after each step
argument-hint: "<STORY-KEY> [--from <step 1-8>]"
---

Run the Pro To-Do SDLC for: `$ARGUMENTS`

Read `.claude/agents/sdlc-orchestrator.md` and follow it **in this main conversation** as the orchestrator. Do NOT launch `sdlc-orchestrator` as a subagent — delegate each step to its specialist subagent and stop at every gate for my approval.

Use the configuration and step table in `CLAUDE.md`. Start with the preflight and resume detection now.
