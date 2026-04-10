#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getConfigDir, getDefaultDataDir, getConfigPath, readConfig, getRepoPath, writeConfig } from "../scripts/paths.mjs";

// --- Resolve scripts directory from this file's location ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scriptsDir = join(__dirname, "..", "scripts");

// --- Git helpers (use execFileSync to avoid shell injection) ---

function gitExec(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf-8",
    timeout: 60_000,
  }).trim();
}

function gitClone(url, dest) {
  execFileSync("git", ["clone", url, dest], { encoding: "utf-8", timeout: 120_000 });
}

function gitPull(cwd) {
  return gitExec(["pull"], cwd);
}

function gitAdd(cwd, files = ".") {
  gitExec(["add", files], cwd);
}

function gitCommit(cwd, message) {
  gitExec(["commit", "-m", message], cwd);
}

function gitPush(cwd) {
  gitExec(["push"], cwd);
}

function gitPushWithRetry(cwd) {
  try {
    gitPush(cwd);
  } catch {
    gitExec(["pull", "--rebase"], cwd);
    gitPush(cwd);
  }
}

// --- Index helpers ---

function parseIndexRows(repoPath) {
  const indexFile = join(repoPath, ".teamdna", "index.md");
  if (!existsSync(indexFile)) return [];
  const content = readFileSync(indexFile, "utf-8");
  const lines = content.split("\n").slice(2); // skip header rows
  const rows = [];
  for (const line of lines) {
    if (!line.trim() || !line.startsWith("|")) continue;
    const parts = line.split("|").map((p) => p.trim()).filter(Boolean);
    if (parts.length < 4) continue;
    const [title, tags, path, scenario] = parts;
    rows.push({ title, tags, path, scenario });
  }
  return rows;
}

function runIndexScript(repoPath) {
  return execFileSync("node", [join(scriptsDir, "dna-index.mjs"), repoPath], {
    encoding: "utf-8",
    timeout: 30_000,
  }).trim();
}

// --- Template helpers ---

function generateEntryMarkdown({ title, author, date, tags, scenario, problem, solution, notes }) {
  let md = `# ${title}\n\n`;
  md += `- **Author**: ${author}\n`;
  md += `- **Date**: ${date}\n`;
  md += `- **Tags**: ${tags}\n`;
  md += `- **Scenario**: ${scenario}\n`;
  md += `\n## Problem/Background\n\n${problem}\n`;
  md += `\n## Solution\n\n${solution}\n`;
  if (notes) {
    md += `\n## Notes\n\n${notes}\n`;
  }
  return md;
}

function generateFilePath(type, title, date) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `${type}/${date}-${slug}.md`;
}

// --- MCP response helpers ---

function textResult(data) {
  return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }] };
}

function errorResult(message, suggestion) {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message, suggestion }, null, 2) }],
    isError: true,
  };
}

// --- MCP Server ---

const config = readConfig();

const server = new McpServer(
  { name: "teamdna-mcp", version: "0.1.0" },
  {
    instructions: config
      ? `TeamDNA is initialized. Knowledge repo: ${config.repoPath}. Use teamdna_search to find entries, teamdna_push to share new knowledge, teamdna_pull to sync latest, teamdna_index to rebuild index, teamdna_graph to visualize relationships.`
      : "TeamDNA is not initialized. Call teamdna_init with the team's Git repo URL before using other tools.",
  },
);

// --- Tool: teamdna_status ---

server.registerTool("teamdna_status", {
  description: "Check TeamDNA initialization status and configuration",
}, async () => {
  const cfg = readConfig();
  if (!cfg) {
    return textResult({
      initialized: false,
      configDir: getConfigDir(),
      configPath: getConfigPath(),
      message: "TeamDNA is not initialized. Call teamdna_init to set up.",
    });
  }
  return textResult({
    initialized: true,
    configDir: cfg.configDir,
    configPath: cfg.configPath,
    dataDir: getDefaultDataDir(),
    repoPath: cfg.repoPath,
  });
});

// --- Tool: teamdna_init ---

server.registerTool("teamdna_init", {
  description: "Initialize TeamDNA: clone a team knowledge repo and write config",
  inputSchema: {
    repo_url: z.string().describe("Git repository URL for the team knowledge base"),
    clone_path: z.string().optional().describe("Custom clone location (default: platform-specific)"),
  },
}, async ({ repo_url, clone_path }) => {
  try {
    const dest = clone_path || getDefaultDataDir();

    if (existsSync(dest) && existsSync(join(dest, ".git"))) {
      const output = gitPull(dest);
      writeConfig(dest);
      return textResult({
        action: "pulled",
        message: `Repo already exists at ${dest}, pulled latest.`,
        output,
        repoPath: dest,
        configPath: getConfigPath(),
      });
    }

    if (existsSync(dest) && readdirSync(dest).length > 0) {
      return errorResult(
        `Directory ${dest} exists and is not a git repo.`,
        "Remove the directory or choose a different clone_path.",
      );
    }

    gitClone(repo_url, dest);
    writeConfig(dest);
    return textResult({
      action: "cloned",
      message: `Cloned ${repo_url} to ${dest}.`,
      repoPath: dest,
      configPath: getConfigPath(),
      nextSteps: [
        "teamdna_search — search knowledge base",
        "teamdna_push — share new knowledge",
        "teamdna_pull — sync latest updates",
      ],
    });
  } catch (err) {
    return errorResult(err.message, "Check that git is installed, the repo URL is accessible, and you have write permissions.");
  }
});

// --- Tool: teamdna_pull ---

server.registerTool("teamdna_pull", {
  description: "Sync the team knowledge base (git pull)",
}, async () => {
  try {
    const repoPath = getRepoPath();
    const output = gitPull(repoPath);
    return textResult({ repoPath, output: output || "Already up to date." });
  } catch (err) {
    return errorResult(err.message, "Check network connectivity and repository access.");
  }
});

// --- Tool: teamdna_index ---

server.registerTool("teamdna_index", {
  description: "Rebuild the knowledge base search index (.teamdna/index.md)",
}, async () => {
  try {
    const repoPath = getRepoPath();
    const output = runIndexScript(repoPath);
    const rows = parseIndexRows(repoPath);
    return textResult({
      message: output,
      entriesIndexed: rows.length,
      indexPath: join(repoPath, ".teamdna", "index.md"),
    });
  } catch (err) {
    return errorResult(err.message, "Ensure the knowledge repo exists and contains entries.");
  }
});

// --- Tool: teamdna_search ---

server.registerTool("teamdna_search", {
  description: "Search the team knowledge base by keyword. Returns matched entries with full content for semantic analysis.",
  inputSchema: {
    keyword: z.string().describe("Search keyword to match against titles, tags, and scenarios"),
  },
}, async ({ keyword }) => {
  try {
    const repoPath = getRepoPath();
    const indexFile = join(repoPath, ".teamdna", "index.md");

    // Auto-rebuild index if missing
    if (!existsSync(indexFile)) {
      runIndexScript(repoPath);
    }

    const rows = parseIndexRows(repoPath);
    const kw = keyword.toLowerCase();
    const matches = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(kw) ||
        r.tags.toLowerCase().includes(kw) ||
        r.scenario.toLowerCase().includes(kw),
    );

    if (matches.length === 0) {
      return textResult({
        query: keyword,
        totalMatches: 0,
        entries: [],
        suggestions: [
          "Try more general keywords",
          "Check spelling",
          "Call teamdna_pull to sync latest knowledge base",
        ],
      });
    }

    if (matches.length > 30) {
      return textResult({
        query: keyword,
        totalMatches: matches.length,
        message: "Too many results. Use more specific keywords to narrow down.",
        titles: matches.slice(0, 10).map((m) => m.title),
      });
    }

    // Read full content of each matched entry
    const repoRoot = resolve(repoPath);
    const entries = matches.map((m) => {
      const filePath = resolve(repoPath, m.path);
      if (!filePath.startsWith(repoRoot + "/")) return { ...m, content: "(invalid path in index)" };
      let content = "";
      try {
        content = readFileSync(filePath, "utf-8");
      } catch {
        content = "(file not found — index may be stale, call teamdna_index to rebuild)";
      }
      return { title: m.title, tags: m.tags, path: m.path, scenario: m.scenario, content };
    });

    return textResult({
      query: keyword,
      totalMatches: entries.length,
      entries,
      hint: "Results are keyword-matched. Review content to determine relevance.",
    });
  } catch (err) {
    return errorResult(err.message, "Ensure TeamDNA is initialized and the index exists.");
  }
});

// --- Tool: teamdna_push ---

server.registerTool("teamdna_push", {
  description: "Create and push a new knowledge entry to the team repo",
  inputSchema: {
    type: z.enum(["pitfalls", "standards", "solutions"]).describe("Knowledge entry type"),
    title: z.string().describe("Entry title"),
    author: z.string().describe("Author name"),
    tags: z.string().describe("Comma-separated tags for indexing"),
    scenario: z.string().describe("One-line scenario description"),
    problem: z.string().describe("Problem or background description"),
    solution: z.string().describe("Solution description"),
    notes: z.string().optional().describe("Additional notes or caveats"),
    file_path: z.string().optional().describe("Custom file path relative to repo root (auto-generated if omitted)"),
  },
}, async ({ type, title, author, tags, scenario, problem, solution, notes, file_path }) => {
  try {
    const repoPath = getRepoPath();

    // Sync before writing
    try {
      gitPull(repoPath);
    } catch {
      // Continue even if pull fails (offline scenario)
    }

    const date = new Date().toISOString().slice(0, 10);
    const markdown = generateEntryMarkdown({ title, author, date, tags, scenario, problem, solution, notes });
    const relPath = file_path || generateFilePath(type, title, date);
    const absPath = resolve(repoPath, relPath);

    // Guard against path traversal
    if (!absPath.startsWith(resolve(repoPath) + "/")) {
      return errorResult("file_path resolves outside the repo directory.", "Use a relative path within the repo.");
    }

    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, markdown, "utf-8");

    // Commit and push the entry
    gitAdd(repoPath, ".");
    gitCommit(repoPath, `add: ${title}`);
    gitPushWithRetry(repoPath);

    // Rebuild index and push
    runIndexScript(repoPath);
    gitAdd(repoPath, ".teamdna/index.md");
    try {
      gitCommit(repoPath, "chore: rebuild index");
      gitPushWithRetry(repoPath);
    } catch {
      // Index commit may fail if index unchanged — that's fine
    }

    return textResult({
      message: `Entry "${title}" pushed successfully.`,
      filePath: relPath,
      repoPath,
    });
  } catch (err) {
    return errorResult(err.message, "Check git status and network connectivity.");
  }
});

// --- Tool: teamdna_graph ---

server.registerTool("teamdna_graph", {
  description: "Generate a knowledge graph visualization showing relationships between entries",
}, async () => {
  try {
    const repoPath = getRepoPath();
    const indexFile = join(repoPath, ".teamdna", "index.md");

    if (!existsSync(indexFile)) {
      return errorResult("Index not found.", "Call teamdna_index to rebuild the index first.");
    }

    const output = execFileSync("node", [join(scriptsDir, "dna-graph.mjs")], {
      encoding: "utf-8",
      timeout: 30_000,
    });

    return textResult(output);
  } catch (err) {
    // dna-graph.mjs writes to both stdout and stderr
    const message = err.stderr ? err.stderr.trim() : err.message;
    const stdout = err.stdout ? err.stdout.trim() : "";
    if (stdout) {
      // Script may output partial results before erroring
      return textResult(stdout + "\n\n" + message);
    }
    return errorResult(message, "Ensure the knowledge base has at least 2 entries with shared tags.");
  }
});

// --- Start server ---

const transport = new StdioServerTransport();
await server.connect(transport);
