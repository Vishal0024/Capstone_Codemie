# docs/ — SDLC artifact rules

These rules apply when creating or editing anything under `docs/`.

- Artifacts live in `docs/sdlc/<STORY-KEY>/` with fixed names: `requirements.md`, `architecture.md`, `design-review.md`, `impl-plan.md`, `implementation-notes.md`, `code-review.md`, `verification.md`.
- First heading of every artifact: `# <STORY-KEY> – <Artifact Name>`; next line: links (Jira Story, branch, related artifacts).
- Use the templates from the skills (`requirements-analysis`, `architecture-design`, `implementation-planning`, `code-review`, `verification-suite`). Keep the section headings — `npm run docs:check -- <KEY>` validates them in Step 7.
- Each step commits its own artifact on the feature branch (`docs(<KEY>): …`). When a later step changes an earlier artifact (e.g. Step 3 updates `architecture.md`), add a dated "Changes" section instead of silently rewriting history.
- Facts only: real Jira keys, SHAs, test numbers. Missing information is written as `Not Found` and listed under open questions / Known Limitations.
- No `TODO`/`TBD`/`FIXME` and no unfilled `<placeholders>` in final artifacts.
- Diagrams in fenced `mermaid` blocks; wireframes in fenced text blocks.
- Never include secrets, tokens, or real user data from `todos.json` / `users.json` / `sessions.json`.
