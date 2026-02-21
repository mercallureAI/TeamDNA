# TeamDNA

Enterprise team knowledge collaboration system based on Git + Claude Code SKILL.

One person's lesson learned, the whole team benefits.

## How It Works

- **Storage**: A shared Git repo organized by knowledge type (pitfalls/standards/solutions)
- **Interface**: 4 Claude Code SKILL commands for search/push/pull/index
- **Setup**: Node.js scripts for initialization, no database or backend needed

## Install

```bash
git clone https://github.com/xxx/teamdna.git
node teamdna/scripts/dna-init.mjs https://git.company.com/teamdna-repo.git
```

The init script will:
1. Clone your team's knowledge repo
2. Write config to `~/.teamdna/config`
3. Install SKILL files to `~/.claude/skills/`

## Usage

In Claude Code, use these commands:

| Command | Description |
|---------|-------------|
| `/dna-search <keyword>` | Search knowledge base |
| `/dna-push` | Share new experience (interactive) |
| `/dna-pull` | Sync latest knowledge |
| `/dna-index` | Rebuild search index |

## Knowledge Repo Structure

```
teamdna-repo/
├── .teamdna/index.md        # Auto-generated index
├── pitfalls/                 # Lessons learned
├── standards/                # Team conventions
└── solutions/                # Proven solutions
```

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
