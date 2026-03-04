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
