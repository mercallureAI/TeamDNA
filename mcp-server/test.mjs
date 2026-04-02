#!/usr/bin/env node

// E2E tests for TeamDNA MCP server
// Uses node:test (built-in) — no extra dependencies
// Isolation: temp directories via XDG_CONFIG_HOME / XDG_DATA_HOME env vars

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_PATH = join(__dirname, "server.mjs");

// --- JSON-RPC client over stdio ---

function createMcpClient(env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [SERVER_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, ...env },
    });

    let buffer = "";
    const waiters = [];

    proc.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      // Each JSON-RPC response is a single line
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id != null) {
            // Match to a waiter
            const idx = waiters.findIndex((w) => w.id === msg.id);
            if (idx >= 0) {
              waiters.splice(idx, 1)[0].resolve(msg);
            }
          }
        } catch {
          // ignore non-JSON lines
        }
      }
    });

    let stderrOutput = "";
    proc.stderr.on("data", (chunk) => {
      stderrOutput += chunk.toString();
    });

    proc.on("error", reject);

    let nextId = 1;

    const client = {
      send(method, params = {}) {
        const id = nextId++;
        const msg = JSON.stringify({ jsonrpc: "2.0", id, method, params });
        proc.stdin.write(msg + "\n");
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`Timeout waiting for response to ${method} (id=${id})`)), 15_000);
          waiters.push({
            id,
            resolve: (msg) => {
              clearTimeout(timer);
              resolve(msg);
            },
          });
        });
      },
      notify(method, params = {}) {
        const msg = JSON.stringify({ jsonrpc: "2.0", method, params });
        proc.stdin.write(msg + "\n");
      },
      async initialize() {
        const res = await client.send("initialize", {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        });
        client.notify("notifications/initialized");
        return res;
      },
      async callTool(name, args = {}) {
        return client.send("tools/call", { name, arguments: args });
      },
      async listTools() {
        return client.send("tools/list", {});
      },
      close() {
        proc.stdin.end();
        proc.kill();
      },
      get stderr() {
        return stderrOutput;
      },
    };

    // Give the process a moment to start
    setTimeout(() => resolve(client), 200);
  });
}

// Parse the text content from an MCP tool result
function parseToolResult(response) {
  const text = response.result.content[0].text;
  try {
    return JSON.parse(text);
  } catch {
    return text; // plain text (e.g., graph output)
  }
}

// --- Fixtures ---

let tmpDir, configHome, dataHome, bareRepo, localRepo, env;

function setupFixtures() {
  tmpDir = mkdtempSync(join(tmpdir(), "teamdna-test-"));
  configHome = join(tmpDir, "config");
  dataHome = join(tmpDir, "data");
  bareRepo = join(tmpDir, "remote.git");
  localRepo = join(tmpDir, "repo");

  mkdirSync(configHome, { recursive: true });
  mkdirSync(dataHome, { recursive: true });

  // Write a test-only global gitconfig that disables GPG signing
  const testGitconfig = join(tmpDir, "gitconfig");
  writeFileSync(
    testGitconfig,
    `[user]\n\tname = Test User\n\temail = test@test.com\n[commit]\n\tgpgsign = false\n`,
  );
  const gitEnv = { ...process.env, GIT_CONFIG_GLOBAL: testGitconfig };

  // Create a bare repo as "remote"
  execSync(`git init --bare "${bareRepo}"`, { stdio: "pipe", env: gitEnv });

  // Clone it, add sample entries, push
  execSync(`git clone "${bareRepo}" "${localRepo}"`, { stdio: "pipe", env: gitEnv });
  execSync(`git -C "${localRepo}" config user.email "test@test.com"`, { stdio: "pipe" });
  execSync(`git -C "${localRepo}" config user.name "Test User"`, { stdio: "pipe" });
  execSync(`git -C "${localRepo}" config commit.gpgsign false`, { stdio: "pipe" });

  // Create directory structure
  mkdirSync(join(localRepo, "pitfalls"), { recursive: true });
  mkdirSync(join(localRepo, "standards"), { recursive: true });
  mkdirSync(join(localRepo, "solutions"), { recursive: true });
  mkdirSync(join(localRepo, ".teamdna"), { recursive: true });

  // Add sample entries
  writeFileSync(
    join(localRepo, "pitfalls", "2025-01-01-null-pointer.md"),
    `# Null Pointer in Production

- **Author**: Alice
- **Date**: 2025-01-01
- **Tags**: java, nullpointer, debugging
- **Scenario**: Production crash due to unchecked null return value

## Problem/Background

Service crashed when external API returned null instead of expected object.

## Solution

Added null checks and Optional wrapper for all external API calls.

## Notes

Always validate external input at system boundaries.
`,
  );

  writeFileSync(
    join(localRepo, "solutions", "2025-01-02-retry-pattern.md"),
    `# Retry Pattern for Flaky APIs

- **Author**: Bob
- **Date**: 2025-01-02
- **Tags**: resilience, retry, java
- **Scenario**: External API calls failing intermittently under load

## Problem/Background

Third-party payment API had 2% failure rate during peak hours.

## Solution

Implemented exponential backoff retry with circuit breaker pattern.

## Notes

Max 3 retries with jitter to avoid thundering herd.
`,
  );

  writeFileSync(
    join(localRepo, "standards", "2025-01-03-error-handling.md"),
    `# Error Handling Standard

- **Author**: Charlie
- **Date**: 2025-01-03
- **Tags**: error-handling, logging, standards
- **Scenario**: Inconsistent error handling across microservices

## Problem/Background

Each team handled errors differently, making debugging cross-service issues hard.

## Solution

Standardized error response format and centralized error logging.

## Notes

All services must return RFC 7807 Problem Details format.
`,
  );

  // Commit and push (use gitEnv to avoid GPG signing)
  execSync(`git -C "${localRepo}" add .`, { stdio: "pipe", env: gitEnv });
  execSync(`git -C "${localRepo}" commit -m "initial entries"`, { stdio: "pipe", env: gitEnv });
  execSync(`git -C "${localRepo}" push`, { stdio: "pipe", env: gitEnv });

  // Write config pointing to the local repo
  const teamdnaConfigDir = join(configHome, "teamdna");
  mkdirSync(teamdnaConfigDir, { recursive: true });
  writeFileSync(join(teamdnaConfigDir, "config"), `repo_path=${localRepo}\n`);

  // Env vars for isolation (testGitconfig defined above during git setup)
  env = {
    XDG_CONFIG_HOME: configHome,
    XDG_DATA_HOME: dataHome,
    GIT_CONFIG_GLOBAL: testGitconfig,
  };
}

function cleanupFixtures() {
  if (tmpDir && existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

// --- Tests ---

describe("MCP Server E2E", () => {
  before(() => {
    setupFixtures();
  });

  after(() => {
    cleanupFixtures();
  });

  // --- Initialize & list tools ---

  it("should return server info and instructions on initialize", async () => {
    const client = await createMcpClient(env);
    try {
      const res = await client.initialize();
      assert.equal(res.result.serverInfo.name, "teamdna-mcp");
      assert.equal(res.result.serverInfo.version, "0.1.0");
      assert.ok(res.result.instructions.includes("TeamDNA is initialized"));
      assert.ok(res.result.instructions.includes(localRepo));
    } finally {
      client.close();
    }
  });

  it("should list all 7 tools", async () => {
    const client = await createMcpClient(env);
    try {
      await client.initialize();
      const res = await client.listTools();
      const names = res.result.tools.map((t) => t.name).sort();
      assert.deepEqual(names, [
        "teamdna_graph",
        "teamdna_index",
        "teamdna_init",
        "teamdna_pull",
        "teamdna_push",
        "teamdna_search",
        "teamdna_status",
      ]);
    } finally {
      client.close();
    }
  });

  // --- teamdna_status ---

  it("teamdna_status should return initialized state", async () => {
    const client = await createMcpClient(env);
    try {
      await client.initialize();
      const res = await client.callTool("teamdna_status");
      const data = parseToolResult(res);
      assert.equal(data.initialized, true);
      assert.equal(data.repoPath, localRepo);
      assert.ok(data.configPath.includes("teamdna"));
    } finally {
      client.close();
    }
  });

  it("teamdna_status should return not-initialized when config missing", async () => {
    const emptyConfig = join(tmpDir, "empty-config");
    mkdirSync(emptyConfig, { recursive: true });
    const client = await createMcpClient({
      XDG_CONFIG_HOME: emptyConfig,
      XDG_DATA_HOME: dataHome,
    });
    try {
      await client.initialize();
      const res = await client.callTool("teamdna_status");
      const data = parseToolResult(res);
      assert.equal(data.initialized, false);
      assert.ok(data.message.includes("not initialized"));
    } finally {
      client.close();
    }
  });

  // --- teamdna_init ---

  it("teamdna_init should clone a repo to custom path", async () => {
    const initConfig = join(tmpDir, "init-config");
    const initData = join(tmpDir, "init-data");
    mkdirSync(initConfig, { recursive: true });
    mkdirSync(initData, { recursive: true });
    const cloneDest = join(tmpDir, "init-clone");

    const client = await createMcpClient({
      XDG_CONFIG_HOME: initConfig,
      XDG_DATA_HOME: initData,
    });
    try {
      await client.initialize();
      const res = await client.callTool("teamdna_init", {
        repo_url: bareRepo,
        clone_path: cloneDest,
      });
      const data = parseToolResult(res);
      assert.equal(data.action, "cloned");
      assert.equal(data.repoPath, cloneDest);
      assert.ok(existsSync(join(cloneDest, ".git")));
      // Config should be written
      const cfgPath = join(initConfig, "teamdna", "config");
      assert.ok(existsSync(cfgPath));
      const cfgContent = readFileSync(cfgPath, "utf-8");
      assert.ok(cfgContent.includes(cloneDest));
    } finally {
      client.close();
    }
  });

  it("teamdna_init should pull if repo already exists", async () => {
    const initConfig2 = join(tmpDir, "init-config2");
    mkdirSync(initConfig2, { recursive: true });

    const client = await createMcpClient({
      XDG_CONFIG_HOME: initConfig2,
      XDG_DATA_HOME: dataHome,
    });
    try {
      await client.initialize();
      // localRepo already exists and is a git repo
      const res = await client.callTool("teamdna_init", {
        repo_url: bareRepo,
        clone_path: localRepo,
      });
      const data = parseToolResult(res);
      assert.equal(data.action, "pulled");
      assert.equal(data.repoPath, localRepo);
    } finally {
      client.close();
    }
  });

  it("teamdna_init should error on non-empty non-git directory", async () => {
    const badDir = join(tmpDir, "bad-dir");
    mkdirSync(badDir, { recursive: true });
    writeFileSync(join(badDir, "file.txt"), "not a repo");

    const client = await createMcpClient(env);
    try {
      await client.initialize();
      const res = await client.callTool("teamdna_init", {
        repo_url: bareRepo,
        clone_path: badDir,
      });
      assert.equal(res.result.isError, true);
      const data = parseToolResult(res);
      assert.ok(data.error.includes("not a git repo"));
    } finally {
      client.close();
    }
  });

  // --- teamdna_pull ---

  it("teamdna_pull should sync the repo", async () => {
    const client = await createMcpClient(env);
    try {
      await client.initialize();
      const res = await client.callTool("teamdna_pull");
      const data = parseToolResult(res);
      assert.equal(data.repoPath, localRepo);
      assert.ok(typeof data.output === "string");
    } finally {
      client.close();
    }
  });

  // --- teamdna_index ---

  it("teamdna_index should rebuild the index", async () => {
    const client = await createMcpClient(env);
    try {
      await client.initialize();
      const res = await client.callTool("teamdna_index");
      const data = parseToolResult(res);
      assert.equal(data.entriesIndexed, 3);
      assert.ok(data.indexPath.includes(".teamdna/index.md"));
      // Verify index file exists with content
      const indexContent = readFileSync(data.indexPath, "utf-8");
      assert.ok(indexContent.includes("Null Pointer"));
      assert.ok(indexContent.includes("Retry Pattern"));
      assert.ok(indexContent.includes("Error Handling"));
    } finally {
      client.close();
    }
  });

  // --- teamdna_search ---

  it("teamdna_search should find entries by keyword", async () => {
    // Ensure index exists first
    const client = await createMcpClient(env);
    try {
      await client.initialize();
      await client.callTool("teamdna_index");

      const res = await client.callTool("teamdna_search", { keyword: "java" });
      const data = parseToolResult(res);
      assert.equal(data.query, "java");
      assert.equal(data.totalMatches, 2); // null-pointer and retry-pattern both tagged java
      assert.ok(data.entries.length === 2);
      // Each entry should have full content
      for (const entry of data.entries) {
        assert.ok(entry.content.length > 0);
        assert.ok(entry.title.length > 0);
        assert.ok(entry.tags.includes("java"));
      }
    } finally {
      client.close();
    }
  });

  it("teamdna_search should return empty for nonexistent keyword", async () => {
    const client = await createMcpClient(env);
    try {
      await client.initialize();
      await client.callTool("teamdna_index");

      const res = await client.callTool("teamdna_search", { keyword: "xyznonexistent" });
      const data = parseToolResult(res);
      assert.equal(data.totalMatches, 0);
      assert.deepEqual(data.entries, []);
      assert.ok(data.suggestions.length > 0);
    } finally {
      client.close();
    }
  });

  it("teamdna_search should match on title", async () => {
    const client = await createMcpClient(env);
    try {
      await client.initialize();
      await client.callTool("teamdna_index");

      const res = await client.callTool("teamdna_search", { keyword: "Retry" });
      const data = parseToolResult(res);
      assert.equal(data.totalMatches, 1);
      assert.equal(data.entries[0].title, "Retry Pattern for Flaky APIs");
      assert.ok(data.entries[0].content.includes("exponential backoff"));
    } finally {
      client.close();
    }
  });

  it("teamdna_search should match case-insensitively", async () => {
    const client = await createMcpClient(env);
    try {
      await client.initialize();
      await client.callTool("teamdna_index");

      const res = await client.callTool("teamdna_search", { keyword: "NULL" });
      const data = parseToolResult(res);
      assert.ok(data.totalMatches >= 1);
      assert.ok(data.entries.some((e) => e.title.includes("Null Pointer")));
    } finally {
      client.close();
    }
  });

  // --- teamdna_push ---

  it("teamdna_push should create and commit a new entry", async () => {
    const client = await createMcpClient(env);
    try {
      await client.initialize();

      const res = await client.callTool("teamdna_push", {
        type: "pitfalls",
        title: "Test Push Entry",
        author: "Tester",
        tags: "test, e2e",
        scenario: "Testing the push tool",
        problem: "Need to verify push works end-to-end.",
        solution: "Write an E2E test that calls teamdna_push.",
        notes: "This is a test entry.",
      });
      const data = parseToolResult(res);
      assert.ok(data.message.includes("Test Push Entry"));
      assert.ok(data.filePath.startsWith("pitfalls/"));
      assert.ok(data.filePath.endsWith(".md"));

      // Verify file exists in repo
      const absPath = join(localRepo, data.filePath);
      assert.ok(existsSync(absPath));
      const content = readFileSync(absPath, "utf-8");
      assert.ok(content.includes("# Test Push Entry"));
      assert.ok(content.includes("Tester"));
      assert.ok(content.includes("test, e2e"));
      assert.ok(content.includes("This is a test entry."));

      // Verify it was committed
      const log = execSync(`git -C "${localRepo}" log --oneline -1`, { encoding: "utf-8" }).trim();
      assert.ok(log.includes("rebuild index") || log.includes("Test Push Entry"));
    } finally {
      client.close();
    }
  });

  it("teamdna_push should use custom file_path when provided", async () => {
    const client = await createMcpClient(env);
    try {
      await client.initialize();

      const customPath = "solutions/custom/my-solution.md";
      const res = await client.callTool("teamdna_push", {
        type: "solutions",
        title: "Custom Path Entry",
        author: "Tester",
        tags: "test",
        scenario: "Custom path test",
        problem: "Testing custom file path.",
        solution: "Provide file_path parameter.",
      });
      // Without custom path — verify auto-generated path
      const data = parseToolResult(res);
      assert.ok(data.filePath.startsWith("solutions/"));

      // Now with custom path
      const res2 = await client.callTool("teamdna_push", {
        type: "solutions",
        title: "Custom Path Entry 2",
        author: "Tester",
        tags: "test",
        scenario: "Custom path test 2",
        problem: "Testing custom file path.",
        solution: "Provide file_path parameter.",
        file_path: customPath,
      });
      const data2 = parseToolResult(res2);
      assert.equal(data2.filePath, customPath);
      assert.ok(existsSync(join(localRepo, customPath)));
    } finally {
      client.close();
    }
  });

  // --- teamdna_graph ---

  it("teamdna_graph should generate a graph", async () => {
    const client = await createMcpClient(env);
    try {
      await client.initialize();
      // Rebuild index first to include pushed entries
      await client.callTool("teamdna_index");

      const res = await client.callTool("teamdna_graph");
      const data = parseToolResult(res);
      // Graph output is plain text with emoji symbols and relationship info
      assert.ok(typeof data === "string");
      assert.ok(data.includes("Knowledge Graph"));
      assert.ok(data.includes("entries"));
      assert.ok(data.includes("Legend"));
    } finally {
      client.close();
    }
  });

  // --- Error handling ---

  it("tools should return isError when not initialized", async () => {
    const emptyConfig = join(tmpDir, "err-config");
    mkdirSync(emptyConfig, { recursive: true });
    const client = await createMcpClient({
      XDG_CONFIG_HOME: emptyConfig,
      XDG_DATA_HOME: join(tmpDir, "err-data"),
    });
    try {
      await client.initialize();

      // pull should error
      const pullRes = await client.callTool("teamdna_pull");
      assert.equal(pullRes.result.isError, true);
      const pullData = parseToolResult(pullRes);
      assert.ok(pullData.error.includes("not initialized"));

      // search should error
      const searchRes = await client.callTool("teamdna_search", { keyword: "test" });
      assert.equal(searchRes.result.isError, true);

      // index should error
      const indexRes = await client.callTool("teamdna_index");
      assert.equal(indexRes.result.isError, true);

      // graph should error
      const graphRes = await client.callTool("teamdna_graph");
      assert.equal(graphRes.result.isError, true);
    } finally {
      client.close();
    }
  });

  it("instructions should say not initialized when config missing", async () => {
    const emptyConfig = join(tmpDir, "instr-config");
    mkdirSync(emptyConfig, { recursive: true });
    const client = await createMcpClient({
      XDG_CONFIG_HOME: emptyConfig,
      XDG_DATA_HOME: join(tmpDir, "instr-data"),
    });
    try {
      const res = await client.initialize();
      assert.ok(res.result.instructions.includes("not initialized"));
      assert.ok(res.result.instructions.includes("teamdna_init"));
    } finally {
      client.close();
    }
  });
});
