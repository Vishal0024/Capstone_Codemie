// PostToolUse: append a redacted audit entry; warn Claude if tool output contained a secret.
import fs from 'node:fs';
import path from 'node:path';
import { readInput, findSecret, redact } from './lib.mjs';

const input = readInput();
const tool = input.tool_name || '';
const ti = input.tool_input || {};
const cwd = input.cwd || process.cwd();

const target =
  ti.file_path || ti.notebook_path || ti.command || ti.issue_key || ti.title || ti.page_id || ti.jql || ti.cql || ti.query || '';

try {
  const dir = path.join(cwd, '.claude', 'logs');
  fs.mkdirSync(dir, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  const entry = { ts: new Date().toISOString(), session: input.session_id, tool, target: redact(String(target)).slice(0, 300) };
  fs.appendFileSync(path.join(dir, `audit-${day}.jsonl`), JSON.stringify(entry) + '\n');
} catch { /* logging must never break the session */ }

const secret = findSecret(input.tool_response);
if (secret) {
  process.stderr.write(`[pro-todo hook] The output of ${tool} contains a ${secret}. Do not repeat, store, commit or publish it.\n`);
  process.exit(2);
}
process.exit(0);
