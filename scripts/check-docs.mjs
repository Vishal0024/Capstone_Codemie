#!/usr/bin/env node
// Document quality check for SDLC artifacts (Step 7 "Verify").
// Usage: node scripts/check-docs.mjs <STORY-KEY> [--root <repo-dir>] [--json]
// Checks docs/sdlc/<KEY>/*.md (+ README.md, CHANGELOG.md): presence, title, required sections,
// broken relative links, leftover placeholders, secret-like values; lists "Not Found" items.
// Exit code 1 if any error is found.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findSecret } from '../.claude/hooks/lib.mjs';

const REQUIRED = {
  'requirements.md': ['User Story', 'Acceptance Criteria', 'Clarifications', 'Functional Requirements', 'Non-Functional Requirements', 'Out of Scope'],
  'architecture.md': ['Recommendation', 'Component Diagram', 'Components', 'Technology Choices', 'Data Flow', 'API Contract', 'Wireframes', 'Traceability'],
  'design-review.md': ['Findings', 'Decisions', 'Verdict'],
  'impl-plan.md': ['Task List', 'Blocked Tasks', 'Definition of Done'],
  'implementation-notes.md': ['Tasks', 'Files', 'Test'],
  'code-review.md': ['Findings', 'Verdict'],
  'verification.md': ['Summary', 'Traceability', 'Document Quality', 'Defects'],
};
const MUST_EXIST = ['requirements.md', 'architecture.md', 'design-review.md', 'impl-plan.md', 'implementation-notes.md', 'code-review.md'];
const REVIEW_AREAS = ['Correctness', 'Security', 'Error Handling', 'Test Coverage', 'Code Clarity', 'DRY', 'Dependency Safety'];
const HTML_TAGS = new Set(['details', 'summary', 'br', 'b', 'i', 'em', 'strong', 'code', 'pre', 'sub', 'sup', 'kbd', 'p', 'div', 'span', 'img', 'a', 'ul', 'li', 'ol', 'table', 'tr', 'td', 'th']);

export function stripCode(md) {
  return md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

export function checkDocument(file, text, key) {
  const name = path.basename(file);
  const errors = [], warnings = [], notFound = [];
  const headings = text.split(/\r?\n/).filter((l) => /^#{1,6}\s/.test(l)).map((l) => l.replace(/^#+\s*/, '').toLowerCase());

  if (REQUIRED[name] && !(headings[0] || '').includes(key.toLowerCase())) errors.push(`first heading must contain the story key ${key}`);
  for (const section of REQUIRED[name] || []) {
    if (!headings.some((h) => h.includes(section.toLowerCase()))) errors.push(`missing required section "${section}"`);
  }
  if (name === 'code-review.md') {
    for (const area of REVIEW_AREAS) if (!text.toLowerCase().includes(area.toLowerCase())) errors.push(`review area "${area}" not evaluated`);
  }

  const prose = stripCode(text);
  for (const m of prose.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|#)/i.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target.split('#')[0]));
    if (!fs.existsSync(resolved)) errors.push(`broken link: ${target}`);
  }
  if (/\b(TODO|TBD|FIXME)\b/.test(prose)) errors.push('contains TODO/TBD/FIXME placeholder');
  for (const m of prose.matchAll(/<([A-Za-z][\w -]*)>/g)) {
    if (!HTML_TAGS.has(m[1].toLowerCase().split(' ')[0])) { warnings.push(`template placeholder left: <${m[1]}>`); }
  }
  const secret = findSecret(text);
  if (secret) errors.push(`contains a ${secret}`);
  text.split(/\r?\n/).forEach((line, i) => { if (/\bNot Found\b/i.test(line)) notFound.push(`line ${i + 1}: ${line.trim().slice(0, 120)}`); });
  return { file: name, errors, warnings, notFound };
}

export function checkStory(key, root) {
  const dir = path.join(root, 'docs', 'sdlc', key);
  const results = [];
  for (const name of MUST_EXIST) {
    if (!fs.existsSync(path.join(dir, name))) results.push({ file: name, errors: ['file missing'], warnings: [], notFound: [] });
  }
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f)) : [];
  for (const extra of ['README.md', 'CHANGELOG.md']) if (fs.existsSync(path.join(root, extra))) files.push(path.join(root, extra));
  for (const f of files) results.push(checkDocument(f, fs.readFileSync(f, 'utf8'), key));
  return results;
}

const same = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
const isMain = Boolean(process.argv[1]) && same(process.argv[1], fileURLToPath(import.meta.url));
if (isMain) {
  const args = process.argv.slice(2);
  const key = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--root');
  const root = args.includes('--root') ? args[args.indexOf('--root') + 1] : process.cwd();
  if (!key) { console.error('Usage: node scripts/check-docs.mjs <STORY-KEY> [--root <dir>] [--json]'); process.exit(2); }
  const results = checkStory(key, root);
  const errors = results.reduce((n, r) => n + r.errors.length, 0);
  const warnings = results.reduce((n, r) => n + r.warnings.length, 0);
  if (args.includes('--json')) {
    console.log(JSON.stringify({ key, errors, warnings, results }, null, 2));
  } else {
    console.log(`Document quality check — ${key}`);
    for (const r of results) {
      const status = r.errors.length ? 'FAIL' : r.warnings.length ? 'WARN' : 'PASS';
      console.log(`\n[${status}] ${r.file}`);
      r.errors.forEach((e) => console.log(`  ✗ ${e}`));
      r.warnings.forEach((w) => console.log(`  ! ${w}`));
      r.notFound.forEach((n) => console.log(`  · Not Found — ${n}`));
    }
    console.log(`\nTotal: ${errors} error(s), ${warnings} warning(s)`);
  }
  process.exit(errors ? 1 : 0);
}
