#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { existsSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

// --- Path resolution (replicated from scripts/paths.mjs) ---

const getConfigDir = () => {
  if (platform() === "linux") {
    return join(
      process.env.XDG_CONFIG_HOME || join(homedir(), ".config"),
      "teamdna",
    );
  }
  return join(homedir(), ".teamdna");
};

const getDefaultDataDir = () => {
  if (platform() === "linux") {
    return join(
      process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"),
      "teamdna",
    );
  }
  return join(getConfigDir(), "repo");
};

const getConfigPath = () => join(getConfigDir(), "config");

// --- MCP Server ---

const server = new McpServer({
  name: "teamdna-mcp",
  version: "0.1.0",
});

// Demo tool: check TeamDNA initialization status
server.tool("teamdna_status", "Check TeamDNA initialization status", {}, async () => {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              initialized: false,
              configDir: getConfigDir(),
              configPath,
              message:
                "TeamDNA is not initialized. Run the dna-init skill to set up the team knowledge base.",
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  const config = readFileSync(configPath, "utf-8");
  const repoPath = config.match(/repo_path=(.+)/)?.[1]?.trim();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            initialized: true,
            configDir: getConfigDir(),
            configPath,
            dataDir: getDefaultDataDir(),
            repoPath: repoPath || "unknown",
          },
          null,
          2,
        ),
      },
    ],
  };
});

// --- Add future tools below ---
// server.tool("tool_name", "description", { /* zod schema */ }, async (params) => {
//   return { content: [{ type: "text", text: result }] };
// });

// --- Start server ---

const transport = new StdioServerTransport();
await server.connect(transport);
