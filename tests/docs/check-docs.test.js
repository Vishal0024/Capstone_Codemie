/**
 * Tests for scripts/check-docs.mjs (Step 7 document quality check).
 * Run: npm run test:docs
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SCRIPT = path.resolve(__dirname, '..', '..', 'scripts', 'check-docs.mjs');
const KEY = 'EPMCDMETST-999';

const GOOD = {
  'requirements.md': `# ${KEY} – Requirements\n## 1. User Story\n## 2. Acceptance Criteria\n## 3. Clarifications\nDue date format: Not Found\n## 4. Functional Requirements\n## 5. Non-Functional Requirements\n## 7. Out of Scope\nSee [plan](impl-plan.md).\n`,
  'architecture.md': `# ${KEY} – Architecture\n## 1. Architecture Recommendation\n## 2. Component Diagram\n\`\`\`mermaid\ngraph TD; A-->B\n\`\`\`\n## 3. Key Components & Responsibilities\n## 4. Technology Choices\n## 5. Data Flow\n## 7. API Contract\n## 8. Wireframes\n## 11. Traceability\n`,
  'design-review.md': `# ${KEY} – Design Review\n## Findings\n## Proposed Design Decisions\n## Verdict\nAPPROVED\n`,
  'impl-plan.md': `# ${KEY} – Implementation Plan\n## 1. Task List\n## 2. Blocked Tasks\n## 7. Definition of Done\n`,
  'implementation-notes.md': `# ${KEY} – Implementation Notes\n## Tasks\n## Files Changed\n## Unit Test Results\n`,
  'code-review.md': `# ${KEY} – Code Review\n| Correctness | Security | Error Handling | Test Coverage | Code Clarity | DRY | Dependency Safety |\n## Findings\n## Verdict\nAPPROVE\n`,
};

function makeRepo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-'));
  const dir = path.join(root, 'docs', 'sdlc', KEY);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  return root;
}
function check(root) {
  const r = spawnSync(process.execPath, [SCRIPT, KEY, '--root', root, '--json'], { encoding: 'utf8' });
  return { code: r.status, report: JSON.parse(r.stdout) };
}
const errorsOf = (report, file) => report.results.find((r) => r.file === file).errors;

test('complete, clean artifacts pass and list Not Found items', () => {
  const { code, report } = check(makeRepo(GOOD));
  expect(code).toBe(0);
  expect(report.errors).toBe(0);
  expect(report.results.find((r) => r.file === 'requirements.md').notFound).toHaveLength(1);
});

test('missing artifact fails', () => {
  const files = { ...GOOD }; delete files['impl-plan.md'];
  const { code, report } = check(makeRepo(files));
  expect(code).toBe(1);
  expect(errorsOf(report, 'impl-plan.md')).toContain('file missing');
});

test('missing required section fails', () => {
  const { report } = check(makeRepo({ ...GOOD, 'impl-plan.md': `# ${KEY} – Implementation Plan\n## 1. Task List\n## 7. Definition of Done\n` }));
  expect(errorsOf(report, 'impl-plan.md')).toContain('missing required section "Blocked Tasks"');
});

test('title without story key fails', () => {
  const { report } = check(makeRepo({ ...GOOD, 'design-review.md': GOOD['design-review.md'].replace(KEY, 'X') }));
  expect(errorsOf(report, 'design-review.md')).toContain(`first heading must contain the story key ${KEY}`);
});

test('code review missing a review area fails', () => {
  const { report } = check(makeRepo({ ...GOOD, 'code-review.md': GOOD['code-review.md'].replace('Dependency Safety', '') }));
  expect(errorsOf(report, 'code-review.md')).toContain('review area "Dependency Safety" not evaluated');
});

test('broken relative link fails, external and anchor links pass', () => {
  const text = GOOD['architecture.md'] + '\n[a](missing.md) [b](https://example.com) [c](#data-flow) [d](requirements.md)\n';
  const { report } = check(makeRepo({ ...GOOD, 'architecture.md': text }));
  expect(errorsOf(report, 'architecture.md')).toEqual(['broken link: missing.md']);
});

test('TODO placeholder fails; template placeholder warns; code blocks are ignored', () => {
  const text = GOOD['impl-plan.md'] + '\nTODO finish this\nOwner: <name>\n```\nTODO in code is fine <x>\n```\n';
  const { report } = check(makeRepo({ ...GOOD, 'impl-plan.md': text }));
  const r = report.results.find((x) => x.file === 'impl-plan.md');
  expect(r.errors).toContain('contains TODO/TBD/FIXME placeholder');
  expect(r.warnings).toEqual(['template placeholder left: <name>']);
});

test('secret-like value fails', () => {
  const text = GOOD['requirements.md'] + `\ntoken: ghp_${'a'.repeat(36)}\n`;
  const { report } = check(makeRepo({ ...GOOD, 'requirements.md': text }));
  expect(errorsOf(report, 'requirements.md')).toContain('contains a GitHub token');
});

test('README and CHANGELOG are checked when present', () => {
  const root = makeRepo(GOOD);
  fs.writeFileSync(path.join(root, 'README.md'), '# App\nSee [docs](docs/nope.md)\n');
  const { report } = check(root);
  expect(errorsOf(report, 'README.md')).toEqual(['broken link: docs/nope.md']);
});
