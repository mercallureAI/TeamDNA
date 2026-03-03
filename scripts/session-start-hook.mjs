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

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const configPath = join(homedir(), ".teamdna", "config");

// If config doesn't exist, instruct Claude to remind user on any TeamDNA skill usage
if (!existsSync(configPath)) {
  console.log(
    [
      "TeamDNA is NOT initialized.",
      "Whenever the user triggers any teamdna skill (dna-search, dna-push, dna-pull, dna-index),",
      "you MUST tell the user: 'TeamDNA is not initialized. Run /teamdna:dna-init to set up your team knowledge base.'",
      "Do NOT proceed with the skill until the user has run /teamdna:dna-init.",
    ].join(" "),
  );
}
