import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const children = [
  spawn(process.execPath, ['server.js', '--api-only'], {
    cwd: root,
    env: { ...process.env, PORT: '3001' },
    stdio: 'inherit'
  }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5173'], {
    cwd: root,
    stdio: 'inherit'
  })
];

function stopChildren() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

process.on('SIGINT', stopChildren);
process.on('SIGTERM', stopChildren);
for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) process.exitCode = code;
    stopChildren();
  });
}
