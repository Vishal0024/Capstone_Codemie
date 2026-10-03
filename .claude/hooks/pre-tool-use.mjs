// PreToolUse: block protected paths, secrets, unsafe git/shell commands, secrets sent to MCP tools.
import { execSync } from 'node:child_process';
import { readInput, relPath, protectedReason, findSecret, block } from './lib.mjs';

const input = readInput();
const tool = input.tool_name || '';
const ti = input.tool_input || {};
const cwd = input.cwd || process.cwd();

// 1) File tools
if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Read'].includes(tool)) {
  const rel = relPath(ti.file_path || ti.notebook_path || '', cwd);
  const reason = rel && protectedReason(rel);
  if (reason && (tool !== 'Read' || reason.includes('secrets'))) {
    block(`${tool} blocked: ${reason}. See CLAUDE.md "Protected paths".`);
  }
  if (tool !== 'Read') {
    const newText = [ti.content, ti.new_string, ti.new_source, ...(ti.edits || []).map((e) => e.new_string)].filter(Boolean).join('\n');
    const secret = findSecret(newText);
    if (secret) block(`${tool} blocked: the new content contains a ${secret}. Use environment variables, never literal credentials.`);
  }
}

// 2) Shell tools
if (tool === 'Bash' || tool === 'PowerShell') {
  const cmd = String(ti.command || '');
  const tokens = cmd.split(/\s+/);
  const secret = findSecret(cmd);
  if (secret) block(`Command blocked: it contains a literal ${secret}. Reference an environment variable instead.`);

  if (/\bgit\s+push\b/.test(cmd)) {
    if (/\s(--force|--force-with-lease|-f)(\s|=|$)/.test(cmd)) block('Force-push is not allowed (CLAUDE.md "Git safety").');
    if (tokens.some((t) => /^(?:\+?(?:HEAD:)?)?(?:refs\/heads\/)?(main|master)$/.test(t) || /:(main|master)$/.test(t))) {
      block('Pushing to main is not allowed. Push the feature branch and open a PR.');
    }
  }
  if (/\bgh\s+pr\s+merge\b/.test(cmd)) block('Merging PRs is reserved for the human reviewer.');
  if (/\bgit\s+(reset\s+--hard|filter-branch|push\s+--mirror)\b/.test(cmd)) block('History-rewriting / destructive git commands are not allowed.');
  if (/\b(rm\s+-[a-z]*r[a-z]*f|rm\s+-[a-z]*f[a-z]*r|Remove-Item\b[^\n]*-Recurse)/i.test(cmd) &&
      /(\s|^)(\/|~|\.|\.\.|\*|\.git|src|docs|public|tests)(\/|\s|$)/i.test(cmd)) {
    block('Recursive delete of the project, source or git folders is not allowed.');
  }
  if (/\b(cat|type|Get-Content|gc|more|less)\b[^\n|;]*\.env(?!\.example)\b/i.test(cmd)) block('Reading .env files is not allowed.');

  if (/\bgit\s+add\b/.test(cmd)) {
    const hit = tokens.slice(tokens.indexOf('add') + 1).map((t) => relPath(t.replace(/^["']|["']$/g, ''), cwd)).map(protectedReason).find(Boolean);
    if (hit) block(`git add blocked: ${hit}.`);
  }
  if (/\bgit\s+commit\b/.test(cmd)) {
    try {
      const all = /\s-[a-zA-Z]*a/.test(cmd) || /\s--all\b/.test(cmd);
      const opt = { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] };
      const files = execSync('git diff --cached --name-only', opt) + (all ? execSync('git diff --name-only', opt) : '');
      const bad = files.split(/\r?\n/).filter(Boolean).map((f) => protectedReason(relPath(f, cwd))).find(Boolean);
      if (bad) block(`Commit blocked: staged changes include a protected path — ${bad}. Unstage it with git restore --staged.`);
      const diff = execSync('git diff --cached -U0', opt) + (all ? execSync('git diff -U0', opt) : '');
      const added = diff.split(/\r?\n/).filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');
      const s = findSecret(added);
      if (s) block(`Commit blocked: staged changes contain a ${s}. Remove it before committing.`);
    } catch { /* not a git repo or git unavailable: let git report its own error */ }
  }
}

// 3) MCP tools (e.g. Jira): never send secrets out
if (tool.startsWith('mcp__')) {
  const secret = findSecret(ti);
  if (secret) block(`${tool} blocked: the request contains a ${secret}. Never send credentials to external systems.`);
}

process.exit(0);
