// Backs up and restores the JSON data files the server writes to, so test runs leave no trace.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = ['todos.json', 'users.json', 'sessions.json'];
const BACKUP = path.join(ROOT, 'qa', '_backup');

function backup() {
  fs.mkdirSync(BACKUP, { recursive: true });
  for (const f of FILES) {
    const src = path.join(ROOT, f);
    const dest = path.join(BACKUP, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, dest);
    else if (fs.existsSync(dest)) fs.unlinkSync(dest);
  }
}

function restore() {
  for (const f of FILES) {
    const saved = path.join(BACKUP, f);
    const target = path.join(ROOT, f);
    if (fs.existsSync(saved)) fs.copyFileSync(saved, target);
    else if (fs.existsSync(target)) fs.unlinkSync(target); // file did not exist before the run
  }
}

module.exports = { ROOT, backup, restore };
