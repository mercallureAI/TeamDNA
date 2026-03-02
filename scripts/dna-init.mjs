#!/usr/bin/env node
// dna-init.mjs — Initialize TeamDNA: clone repo, write config
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const REPO_URL = process.argv[2];
if (!REPO_URL) {
  console.log('Usage: node dna-init.mjs <repo-url> [clone-path]');
  process.exit(1);
}

const CLONE_DIR = process.argv[3] || join(homedir(), 'teamdna-repo');
const CONFIG_DIR = join(homedir(), '.teamdna');

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

console.log('[dna-init] Done! Use /teamdna:dna-search, /teamdna:dna-push, /teamdna:dna-pull, /teamdna:dna-index in Claude Code.');
