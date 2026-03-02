#!/usr/bin/env node

/**
 * TeamDNA Session Start Hook
 *
 * Checks if TeamDNA is initialized and prompts user once if not.
 * Add to your Claude Code settings:
 *
 * "hooks": {
 *   "SessionStart": "node /path/to/teamdna/scripts/session-start-hook.mjs"
 * }
 */

import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const teamdnaDir = join(homedir(), '.teamdna');
const configPath = join(teamdnaDir, 'config');
const promptedPath = join(teamdnaDir, '.prompted');

// Only prompt if config doesn't exist and we haven't prompted before
if (!existsSync(configPath) && !existsSync(promptedPath)) {
  console.log('💡 TeamDNA is not initialized. Run /teamdna:dna-init to set up your team knowledge base.');

  // Create marker file to avoid repeated prompts
  try {
    mkdirSync(teamdnaDir, { recursive: true });
    writeFileSync(promptedPath, new Date().toISOString());
  } catch (err) {
    // Silently fail if we can't create the marker
  }
}
