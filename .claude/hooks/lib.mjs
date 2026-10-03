// Shared helpers for Pro To-Do Claude Code hooks (no dependencies, Node 18+).
import fs from 'node:fs';

export function readInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const norm = (p) => String(p || '').replace(/\\/g, '/').replace(/\/+$/, '');

/** Path relative to the project root, lower-cased, forward slashes. */
export function relPath(filePath, cwd) {
  let p = norm(filePath);
  const root = norm(cwd || process.cwd());
  if (root && p.toLowerCase().startsWith(root.toLowerCase() + '/')) p = p.slice(root.length + 1);
  return p.replace(/^\.\//, '').toLowerCase();
}

const DATA_FILES = new Set(['todos.json', 'users.json', 'sessions.json']);

/** Returns a reason string if the path is protected, otherwise null. */
export function protectedReason(rel) {
  const base = rel.split('/').pop();
  if (base.startsWith('.env') && base !== '.env.example') return `"${rel}" is an environment/secrets file`;
  if (rel === '.github' || rel.startsWith('.github/')) return `"${rel}" is under .github/ (protected)`;
  if (DATA_FILES.has(rel)) return `"${rel}" is a user data file`;
  return null;
}

const SECRET_PATTERNS = [
  ['GitHub token', /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/],
  ['Atlassian API token', /\bATATT3[A-Za-z0-9_\-=]{20,}/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Private key', /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/],
  ['Bearer token', /\bBearer\s+[A-Za-z0-9\-._~+/]{24,}=*/],
  ['Credential assignment', /\b(?:api[_-]?key|access[_-]?token|personal[_-]?token|secret|password|passwd)["']?\s*[:=]\s*["']?(?![$<{%])[A-Za-z0-9\-_/+=]{16,}/i],
];

/** Returns the name of the first secret-like pattern found, or null. */
export function findSecret(text) {
  if (!text) return null;
  const s = typeof text === 'string' ? text : JSON.stringify(text);
  for (const [name, re] of SECRET_PATTERNS) if (re.test(s)) return name;
  return null;
}

/** Masks secret-like values for logging. */
export function redact(text) {
  let s = String(text ?? '');
  for (const [, re] of SECRET_PATTERNS) s = s.replace(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'), '[REDACTED]');
  return s;
}

/** Block the tool call / turn: message goes back to Claude. */
export function block(message) {
  process.stderr.write(`[pro-todo hook] ${message}\n`);
  process.exit(2);
}
