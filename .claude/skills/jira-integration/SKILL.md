---
name: jira-integration
description: How to read a Jira Story from EPAM Jira Data Center (jiraeu.epam.com, project EPMCDMETST) through the atlassian MCP server, add a traceability comment, and the instance-specific field IDs. Use for any Jira call in the SDLC.
---

# Jira Integration (EPAM Jira Data Center)

Values come from "Project Configuration" in the root `CLAUDE.md`.

## Rules
- Use the `atlassian` MCP server's Jira tools (in mcp-atlassian typically `jira_get_issue`, `jira_search`, `jira_add_comment`; use the equivalent the server exposes).
- Project `EPMCDMETST` only. The Story is **human-written input** — never create or edit Epics, Stories or their descriptions.
- Links: `https://jiraeu.epam.com/browse/<ISSUE-KEY>` with real keys.

## Reading the Story
Fetch summary, description, issue type, status, labels, and Epic Link (`customfield_14500`, never `customfield_10014`). Acceptance criteria are in the description, numbered `AC-001…`; quote them exactly. A field that is empty or missing → `Not Found`.

## Writing to Jira
Only one kind of write is allowed: a short comment on the Story at Step 8, e.g. `[SDLC Step 8] Pull request opened: <PR URL>`. No secrets, no large pastes.
Do **not** call `/rest/api/2/issue/createmeta` (removed in this Jira version; it returns "Issue Does Not Exist").
