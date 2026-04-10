#!/usr/bin/env node
// dna-init.mjs — Initialize TeamDNA: clone repo, write config
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { getConfigDir, getDefaultDataDir, writeConfig } from './paths.mjs';

const REPO_URL = process.argv[2];
if (!REPO_URL) {
  console.log('Usage: node scripts/dna-init.mjs <repo-url> [clone-path]');
  process.exit(1);
}

const CLONE_DIR = process.argv[3] || getDefaultDataDir();

// 1. Clone or pull
if (existsSync(CLONE_DIR)) {
  console.log(`[dna-init] Repo already exists at ${CLONE_DIR}, pulling latest...`);
  execSync(`git -C "${CLONE_DIR}" pull`, { stdio: 'inherit' });
} else {
  console.log(`[dna-init] Cloning ${REPO_URL} to ${CLONE_DIR}...`);
  execSync(`git clone "${REPO_URL}" "${CLONE_DIR}"`, { stdio: 'inherit' });
}

// 2. Write config
writeConfig(CLONE_DIR);
console.log(`[dna-init] Config written to ${getConfigDir()}/config`);

console.log('[dna-init] Done! Use /teamdna:dna-search, /teamdna:dna-push, /teamdna:dna-pull, /teamdna:dna-index in Claude Code.');
