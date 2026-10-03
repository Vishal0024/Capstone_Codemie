---
name: mcp-retry-policy
description: Standard error handling and retry policy for every atlassian MCP (Jira) call and every gh/git/npm network call in the SDLC. Use whenever a tool call fails.
---

# Error Handling & Retry Policy

| Error | Action |
|---|---|
| **401 / 403** | Do not retry. Stop: the Jira Personal Access Token (`JIRA_PERSONAL_TOKEN`) is missing, expired or lacks access; for `gh`, run `gh auth status`. |
| **404** / "does not exist" | Do not retry blindly. Re-check the key against `CLAUDE.md`; if still missing, report it. |
| **400** (validation) | Read the message, fix the request once, retry once, then report. |
| **429 / 5xx / timeout** | Retry up to 2 times (~5 s, then ~15 s), then report. |
| `ETIMEDOUT` on an IPv6 address | Network issue on this machine — report and suggest the IPv4 fix from `CLAUDE.md`. |
| MCP server not connected / tool missing | Stop and ask the user to check `/mcp` (server `atlassian`). |

## Never
- Never invent a key, URL, SHA or result to "continue".
- Never switch to another Jira instance or project.
- Never print tokens or request headers.

## Report format
`<tool> failed: <exact error>. Tried <n> time(s). Likely cause: <cause>. Needed from you: <action>.`
