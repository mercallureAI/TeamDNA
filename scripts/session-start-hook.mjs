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
import { getConfigPath } from "./paths.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Derive plugin root from this script's location: <plugin-root>/scripts/session-start-hook.mjs
const __filename = fileURLToPath(import.meta.url);
const pluginRoot = dirname(dirname(__filename));

// Always emit the plugin directory so Claude can locate scripts (e.g. dna-init.mjs, dna-index.mjs)
console.log(`TeamDNA plugin installation directory <teamdna-dir> is: ${pluginRoot}`);

const configPath = getConfigPath();

// If config doesn't exist, instruct Claude to remind user on any TeamDNA skill usage
if (!existsSync(configPath)) {
  console.log(
    [
      "TeamDNA is NOT initialized.",
      "Whenever the user triggers any teamdna skill (dna-search, dna-push, dna-pull, dna-index),",
      "you MUST tell the user that TeamDNA is not initialized, then invoke the `/teamdna:dna-init` skill to set up the team knowledge base.",
      "Do NOT proceed with the original skill until dna-init has completed successfully.",
    ].join(" "),
  );
} else {
  // TeamDNA is initialized - minimal reminder
  console.log("TeamDNA initialized. Use /teamdna:dna-search for team knowledge, /teamdna:dna-push to share learnings.");
}
