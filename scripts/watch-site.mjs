import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const watchedPaths = ['assets', 'pages', 'content', 'scripts', 'index.html', 'robots.txt']
  .map((entry) => path.join(projectDir, entry));
let timer;
let building = false;
let rebuildQueued = false;

function build() {
  if (building) {
    rebuildQueued = true;
    return;
  }
  building = true;
  const child = spawn(process.execPath, ['scripts/build-clean-routes.mjs'], {
    cwd: projectDir,
    stdio: 'inherit'
  });
  child.on('exit', (code) => {
    building = false;
    if (code !== 0) console.error(`Build failed with exit code ${code}. Watching for the next change…`);
    if (rebuildQueued) {
      rebuildQueued = false;
      build();
    }
  });
}

function scheduleBuild() {
  clearTimeout(timer);
  timer = setTimeout(build, 180);
}

function watchPath(target) {
  if (!fs.existsSync(target)) return;
  if (!fs.statSync(target).isDirectory()) {
    fs.watch(target, scheduleBuild);
    return;
  }
  fs.watch(target, scheduleBuild);
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      watchPath(path.join(target, entry.name));
    }
  }
}

for (const directory of watchedPaths) {
  watchPath(directory);
}

console.log('Watching site sources. Press Ctrl+C to stop.');
build();
