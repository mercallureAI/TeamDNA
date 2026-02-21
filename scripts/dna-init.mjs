#!/usr/bin/env node
// dna-init.mjs — Initialize TeamDNA: clone repo, write config, install skills
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_URL = process.argv[2];
if (!REPO_URL) {
  console.log('Usage: node dna-init.mjs <repo-url> [clone-path]');
  process.exit(1);
}

const SCRIPT_DIR = join(__dirname, '..');
const CLONE_DIR = process.argv[3] || join(homedir(), 'teamdna-repo');
const CONFIG_DIR = join(homedir(), '.teamdna');
const SKILLS_DIR = join(homedir(), '.claude', 'skills');

// 1. Clone or pull
if (existsSync(CLONE_DIR)) {
  console.log(`[dna-init] Repo already exists at ${CLONE_DIR}, pulling latest...`);
  execSync(`git -C "${CLONE_DIR}" pull`, { stdio: 'inherit' });
} else {
  console.log(`[dna-init] Cloning ${REPO_URL} to ${CLONE_DIR}...`);
  execSync(`git clone "${REPO_URL}" "${CLONE_DIR}"`, { stdio: 'inherit' });
}

// 2. Write config
mkdirSync(CONFIG_DIR, { recursive: true });
writeFileSync(join(CONFIG_DIR, 'config'), `repo_path=${CLONE_DIR}\n`);
console.log(`[dna-init] Config written to ${CONFIG_DIR}/config`);

// 3. Install skills
mkdirSync(SKILLS_DIR, { recursive: true });
for (const f of readdirSync(join(SCRIPT_DIR, 'skills')).filter(f => f.endsWith('.md'))) {
  copyFileSync(join(SCRIPT_DIR, 'skills', f), join(SKILLS_DIR, f));
}
console.log(`[dna-init] Skills installed to ${SKILLS_DIR}`);

console.log('[dna-init] Done! Use /dna-search, /dna-push, /dna-pull, /dna-index in Claude Code.');
