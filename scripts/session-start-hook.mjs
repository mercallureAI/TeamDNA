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

import { readConfig } from "./paths.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Derive plugin root from this script's location: <plugin-root>/scripts/session-start-hook.mjs
const __filename = fileURLToPath(import.meta.url);
const pluginRoot = dirname(dirname(__filename));

// Emit scripts directory so Claude can locate scripts (e.g. dna-init.mjs, dna-index.mjs)
console.log(`TeamDNA scripts directory <teamdna-scripts-dir> is: ${join(pluginRoot, "scripts")}`);

const config = readConfig();

// If config doesn't exist, instruct Claude to remind user on any TeamDNA skill usage
if (!config) {
  console.log(
    [
      "TeamDNA is NOT initialized.",
      "Whenever the user triggers any teamdna skill (dna-graph, dna-search, dna-push, dna-pull, dna-index),",
      "you MUST tell the user that TeamDNA is not initialized, then invoke the `/teamdna:dna-init` skill to set up the team knowledge base.",
      "Do NOT proceed with the original skill until dna-init has completed successfully.",
    ].join(" "),
  );
} else {
  console.log(`TeamDNA repo directory <teamdna-repo-dir> is: ${config.repoPath}`);
  console.log("TeamDNA initialized. Use /teamdna:dna-search for team knowledge, /teamdna:dna-push to share learnings.");
}
