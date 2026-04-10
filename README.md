# TeamDNA

Enterprise team knowledge collaboration system based on Git + Claude Code SKILL.

One person's lesson learned, the whole team benefits.

## How It Works

- **Storage**: A shared Git repo organized by knowledge type (pitfalls/standards/solutions)
- **Interface**: 4 Claude Code SKILL commands for search/push/pull/index
- **Setup**: Node.js scripts for initialization, no database or backend needed

## Install

```text
# Add the marketplace
/plugin marketplace add mercallureAI/plugins

# Install the plugin
/plugin install teamdna@mercallure-plugins

# Initialize your team's knowledge repo
/teamdna:dna-init
```

## Usage

In Claude Code, use these commands:

| Command                         | Description                                  |
|---------------------------------|----------------------------------------------|
| `/teamdna:dna-init`             | Initialize knowledge repo (first-time setup) |
| `/teamdna:dna-search <keyword>` | Search knowledge base                        |
| `/teamdna:dna-push`             | Share new experience (interactive)           |
| `/teamdna:dna-pull`             | Sync latest knowledge                        |
| `/teamdna:dna-index`            | Rebuild search index                         |
| `/teamdna:dna-graph`            | Generate knowledge graph visualization       |

## MCP Server

TeamDNA includes an MCP (Model Context Protocol) server alongside its skills. While skills provide interactive workflows (search, push, pull), the MCP server exposes programmatic tools that AI agents can call directly.

The server is published as a separate npm package (`@mercallureai/teamdna-mcp`) to GitHub Packages. When the plugin is installed, Claude Code auto-starts the MCP server via `npx` -- no manual setup needed.

**Tools:**

| Tool | Description |
|------|-------------|
| `teamdna_status` | Check initialization status, config paths, and repo location |
| `teamdna_init` | Initialize TeamDNA: clone a team knowledge repo and write config |
| `teamdna_search` | Search knowledge base by keyword, returns entries with full content |
| `teamdna_push` | Create and push a new knowledge entry to the team repo |
| `teamdna_pull` | Sync the team knowledge base (git pull) |
| `teamdna_index` | Rebuild the search index (.teamdna/index.md) |
| `teamdna_graph` | Generate knowledge graph visualization |

### MCP Development Guide

**Local setup:**

```bash
cd mcp-server
npm install
```

**Test locally:**

```bash
# Send an initialize + tools/list request over stdio
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}\n{"jsonrpc":"2.0","method":"notifications/initialized"}\n{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}\n' | node mcp-server/server.mjs
```

**Add a new tool:**

In `mcp-server/server.mjs`, add a `server.registerTool()` call:

```js
server.registerTool("tool_name", {
  description: "description",
  inputSchema: { /* zod schema */ },
}, async (params) => {
  // call script logic or spawn process
  return { content: [{ type: "text", text: result }] };
});
```

**Publish to GitHub Packages:**

```bash
cd mcp-server
npm publish
```

Requires authentication to the GitHub npm registry. See [GitHub Packages docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).

## Knowledge Repo Structure

```text
teamdna-repo/
├── .teamdna/index.md        # Auto-generated index
├── pitfalls/                 # Lessons learned
├── standards/                # Team conventions
└── solutions/                # Proven solutions
```

## File Locations

TeamDNA follows platform conventions for storing configuration and data:

**Linux (XDG-compliant):**
- Config: `$XDG_CONFIG_HOME/teamdna/config` (typically `~/.config/teamdna/config`)
- Data: `$XDG_DATA_HOME/teamdna` (typically `~/.local/share/teamdna`)

**macOS/Windows:**
- Config: `~/.teamdna/config`
- Data: `~/.teamdna/repo`

## Entry Template

```markdown
# [Title]

- **Author**: Name
- **Date**: YYYY-MM-DD
- **Tags**: tag1, tag2
- **Context**: One-line description

## Problem

What happened.

## Solution

How it was solved.

## Notes

Caveats and boundaries.
```

## License

MIT
