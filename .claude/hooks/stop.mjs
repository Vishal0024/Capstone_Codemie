// Stop: if an SDLC stage is awaiting approval, its artifact must exist and the turn must end with the gate question.
import fs from 'node:fs';
import path from 'node:path';
import { readInput, block } from './lib.mjs';

const input = readInput();
if (input.stop_hook_active) process.exit(0); // avoid loops
const cwd = input.cwd || process.cwd();

let state;
try {
  state = JSON.parse(fs.readFileSync(path.join(cwd, '.claude', 'state', 'sdlc-state.json'), 'utf8'));
} catch {
  process.exit(0); // no SDLC run in progress
}
if (state.status !== 'awaiting-approval') process.exit(0);

if (state.artifact) {
  const file = path.join(cwd, state.artifact);
  let size = 0;
  try { size = fs.statSync(file).size; } catch { /* missing */ }
  if (size === 0) {
    block(`Stage ${state.stage} (${state.stageName}) is marked awaiting approval, but ${state.artifact} is missing or empty. Produce it with the stage subagent, or set the state back to "in-progress" and report the problem.`);
  }
}

// The last assistant message must contain the gate question.
try {
  const lines = fs.readFileSync(input.transcript_path, 'utf8').trim().split(/\r?\n/).reverse();
  for (const line of lines) {
    const rec = JSON.parse(line);
    if (rec.type !== 'assistant') continue;
    const content = rec.message?.content;
    const text = Array.isArray(content) ? content.filter((c) => c.type === 'text').map((c) => c.text).join('\n') : String(content || '');
    if (!text.trim()) continue;
    if (!new RegExp(`Gate\\s*${state.stage}\\b`, 'i').test(text)) {
      block(`Stage ${state.stage} is awaiting approval: end your reply with the gate question ("Gate ${state.stage} — reply \\"approve\\" ...").`);
    }
    break;
  }
} catch { /* transcript unavailable: skip this check */ }
process.exit(0);
