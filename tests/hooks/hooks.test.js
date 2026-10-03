/**
 * Tests for the Claude Code hooks in .claude/hooks (PreToolUse, PostToolUse, Stop).
 * Each hook is run as a child process with a JSON payload on stdin, exactly like Claude Code does.
 * Run: npm run test:hooks
 */
const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOKS = path.resolve(__dirname, '..', '..', '.claude', 'hooks');
const FAKE_GH = 'ghp_' + 'a'.repeat(36);

function run(hook, payload) {
  const r = spawnSync(process.execPath, [path.join(HOOKS, hook)], { input: JSON.stringify(payload), encoding: 'utf8' });
  return { code: r.status, stderr: r.stderr };
}

let repo;
beforeAll(() => {
  repo = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-'));
  execSync('git init -q && git config user.email t@t && git config user.name t', { cwd: repo });
});
afterAll(() => fs.rmSync(repo, { recursive: true, force: true }));

const pre = (tool_name, tool_input) => run('pre-tool-use.mjs', { tool_name, tool_input, cwd: repo });

describe('PreToolUse — protected paths', () => {
  test.each([
    ['Write', '.env'], ['Edit', '.env.local'], ['Write', '.github/workflows/ci.yml'],
    ['Edit', 'todos.json'], ['Write', 'users.json'], ['Write', 'sessions.json'],
  ])('%s %s is blocked', (tool, file) => {
    expect(pre(tool, { file_path: path.join(repo, file), content: 'x' }).code).toBe(2);
  });
  test('Windows-style absolute path is blocked', () => {
    expect(run('pre-tool-use.mjs', { tool_name: 'Write', cwd: 'C:\\repo', tool_input: { file_path: 'C:\\repo\\.env', content: 'x' } }).code).toBe(2);
  });
  test.each([['Write', '.env.example'], ['Edit', 'todoServer.js'], ['Write', 'docs/sdlc/EPMCDMETST-1/requirements.md'], ['Read', 'todos.json']])(
    '%s %s is allowed', (tool, file) => {
      expect(pre(tool, { file_path: path.join(repo, file), content: 'hello', old_string: 'a', new_string: 'b' }).code).toBe(0);
    });
  test('Read .env is blocked', () => expect(pre('Read', { file_path: path.join(repo, '.env') }).code).toBe(2));
});

describe('PreToolUse — secrets', () => {
  test('literal GitHub token in file content is blocked', () => {
    expect(pre('Write', { file_path: path.join(repo, 'a.js'), content: `const t = "${FAKE_GH}";` }).code).toBe(2);
  });
  test('credential assignment is blocked', () => {
    expect(pre('Edit', { file_path: path.join(repo, 'a.js'), new_string: 'apiKey = "Zx8Qw2Lk9Vb4Nm7Rt5Yu"' }).code).toBe(2);
  });
  test('environment-variable reference is allowed', () => {
    expect(pre('Write', { file_path: path.join(repo, '.mcp.json'), content: '"JIRA_PERSONAL_TOKEN": "${JIRA_PERSONAL_TOKEN}"' }).code).toBe(0);
  });
  test('secret in an MCP request is blocked', () => {
    expect(pre('mcp__atlassian__jira_add_comment', { issue_key: 'EPMCDMETST-1', comment: `token ${FAKE_GH}` }).code).toBe(2);
  });
  test('normal MCP request is allowed', () => {
    expect(pre('mcp__atlassian__jira_get_issue', { issue_key: 'EPMCDMETST-1' }).code).toBe(0);
  });
});

describe('PreToolUse — git & shell safety', () => {
  test.each([
    'git push --force origin feature/EPMCDMETST-1-x',
    'git push -f',
    'git push origin main',
    'git push origin HEAD:main',
    'gh pr merge 5 --squash',
    'git reset --hard HEAD~1',
    'rm -rf .',
    'Remove-Item -Recurse -Force src',
    'cat .env',
    'Get-Content .env',
    'git add .env users.json',
  ])('blocks: %s', (command) => expect(pre('Bash', { command }).code).toBe(2));

  test.each([
    'git push -u origin feature/EPMCDMETST-1-main-page',
    'git status',
    'npm run build',
    'rm -rf dist',
    'Get-Content .env.example',
    'git add todoServer.js public/script.js',
    'gh pr create --base main --head feature/EPMCDMETST-1-x --title t --body-file b.md',
  ])('allows: %s', (command) => expect(pre('Bash', { command }).code).toBe(0));

  test('PowerShell tool is checked too', () => expect(pre('PowerShell', { command: 'git push origin main' }).code).toBe(2));

  test('commit with a staged protected file is blocked', () => {
    fs.writeFileSync(path.join(repo, 'todos.json'), '[]');
    execSync('git add todos.json', { cwd: repo });
    expect(pre('Bash', { command: 'git commit -m "feat(EPMCDMETST-1): x"' }).code).toBe(2);
    execSync('git rm -q --cached todos.json', { cwd: repo });
  });
  test('commit with a staged secret is blocked', () => {
    fs.writeFileSync(path.join(repo, 'cfg.js'), `module.exports = "${FAKE_GH}";\n`);
    execSync('git add cfg.js', { cwd: repo });
    expect(pre('Bash', { command: 'git commit -m "x"' }).code).toBe(2);
    execSync('git rm -q --cached cfg.js', { cwd: repo });
  });
  test('clean commit is allowed', () => {
    fs.writeFileSync(path.join(repo, 'ok.js'), 'module.exports = 1;\n');
    execSync('git add ok.js', { cwd: repo });
    expect(pre('Bash', { command: 'git commit -m "feat(EPMCDMETST-1): ok"' }).code).toBe(0);
  });
});

describe('PostToolUse', () => {
  test('writes a redacted audit entry and warns on secret output', () => {
    const r = run('post-tool-use.mjs', { tool_name: 'Bash', cwd: repo, session_id: 's1', tool_input: { command: `echo ${FAKE_GH}` }, tool_response: { stdout: FAKE_GH } });
    expect(r.code).toBe(2);
    const dir = path.join(repo, '.claude', 'logs');
    const log = fs.readFileSync(path.join(dir, fs.readdirSync(dir)[0]), 'utf8');
    expect(log).toContain('[REDACTED]');
    expect(log).not.toContain(FAKE_GH);
  });
  test('clean output passes', () => {
    expect(run('post-tool-use.mjs', { tool_name: 'Read', cwd: repo, tool_input: { file_path: 'x' }, tool_response: 'ok' }).code).toBe(0);
  });
});

describe('Stop', () => {
  const stateDir = () => path.join(repo, '.claude', 'state');
  const transcript = (text) => {
    const f = path.join(repo, 't.jsonl');
    fs.writeFileSync(f, JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text }] } }) + '\n');
    return f;
  };
  const setState = (s) => { fs.mkdirSync(stateDir(), { recursive: true }); fs.writeFileSync(path.join(stateDir(), 'sdlc-state.json'), JSON.stringify(s)); };
  const art = 'docs/sdlc/EPMCDMETST-1/requirements.md';

  test('no state file → allowed', () => expect(run('stop.mjs', { cwd: path.join(repo, 'none') }).code).toBe(0));
  test('awaiting approval with missing artifact → blocked', () => {
    setState({ story: 'EPMCDMETST-1', stage: 1, stageName: 'requirement-analyst', status: 'awaiting-approval', artifact: art });
    expect(run('stop.mjs', { cwd: repo, transcript_path: transcript('Gate 1 — reply "approve"') }).code).toBe(2);
  });
  test('artifact present but no gate question → blocked', () => {
    fs.mkdirSync(path.join(repo, path.dirname(art)), { recursive: true });
    fs.writeFileSync(path.join(repo, art), '# Requirements');
    expect(run('stop.mjs', { cwd: repo, transcript_path: transcript('Done.') }).code).toBe(2);
  });
  test('artifact present and gate question asked → allowed', () => {
    expect(run('stop.mjs', { cwd: repo, transcript_path: transcript('Gate 1 — reply "approve" to continue') }).code).toBe(0);
  });
  test('stop_hook_active → allowed (no loop)', () => {
    expect(run('stop.mjs', { cwd: repo, stop_hook_active: true, transcript_path: transcript('Done.') }).code).toBe(0);
  });
});
