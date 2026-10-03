const { restore } = require('./data-files');

module.exports = async () => {
  const child = globalThis.__TODO_SERVER__;
  if (child && child.exitCode === null) {
    const exited = new Promise(r => child.once('exit', r));
    child.kill();
    await exited;
  }
  restore();
};
