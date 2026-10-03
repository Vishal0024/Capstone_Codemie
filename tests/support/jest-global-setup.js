const { spawn } = require('child_process');
const { ROOT, backup } = require('./data-files');

const BASE = 'http://localhost:3000';
const isUp = async () => {
  try { return (await fetch(BASE + '/')).ok; } catch { return false; }
};

module.exports = async () => {
  backup();
  if (await isUp()) return; // reuse a server that is already running
  const child = spawn(process.execPath, ['todoServer.js'], { cwd: ROOT, stdio: 'ignore' });
  globalThis.__TODO_SERVER__ = child;
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    if (await isUp()) return;
    await new Promise(r => setTimeout(r, 250));
  }
  child.kill();
  throw new Error('todoServer.js did not start on :3000');
};
