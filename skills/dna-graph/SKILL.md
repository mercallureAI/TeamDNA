---
name: dna-graph
description: Visualize team knowledge graph
user-invokable: true
---

# /teamdna:dna-graph — Knowledge Graph Visualization

Generate knowledge base relationship graph, displaying connections between entries through Mermaid charts.

## Usage

**Basic call**:
```
/teamdna:dna-graph
```

Display complete knowledge graph.

## Implementation Steps

**1. Read configuration**

```bash
cat ~/.teamdna/config
```

Parse `repo_path` field. If config doesn't exist, prompt user to run `/teamdna:dna-init`.

**2. Sync knowledge base**

```bash
git -C <repo_path> pull
```

If it fails, prompt user to check network or repository status.

**3. Run graph generation script**

```bash
node ~/.claude/plugins/teamdna/scripts/dna-graph.mjs
```

The script reads the repo path from `~/.teamdna/config` internally and outputs:
- Statistics (entry count, relationship count)
- Mermaid chart syntax
- Legend with entry counts by type

**4. Display output**

Simply display the script's output as-is. The script already formats everything including statistics, Mermaid chart, and legend.

## Error Handling

- **Missing config**: Prompt to run `/teamdna:dna-init`
- **Missing index**: Prompt to run `/teamdna:dna-index`
- **Insufficient entries**: Prompt that at least 2 entries are needed
- **No relationships**: Prompt to add more tags to entries

## Notes

1. Graph complexity grows with entry count, recommended for knowledge bases < 50 entries
2. Relationships are based on tag co-occurrence, tag design affects graph quality
3. Uses zero-dependency design, only requires Node.js built-in modules
