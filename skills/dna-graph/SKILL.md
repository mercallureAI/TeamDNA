---
name: dna-graph
description: Visualize team knowledge graph
user-invokable: true
---

# /teamdna:dna-graph — Knowledge Graph Visualization

Generate knowledge base relationship graph with intelligent summarization for large datasets.

## Usage

**Summary mode (default for 50+ entries)**:
```
/teamdna:dna-graph
```

Shows condensed view with:
- Domain statistics (backend, frontend, typescript, etc.)
- Top 10 knowledge hubs (most connected entries)
- Tag frequency analysis
- Cross-domain relationship matrix
- Overall statistics

**Full detailed view**:
```
/teamdna:dna-graph --full
```

Shows complete ASCII graph with all entries and connections.

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
node <teamdna-dir>/scripts/dna-graph.mjs [--full]
```

The script automatically detects dataset size:
- **< 50 entries**: Shows full ASCII graph with all connections
- **≥ 50 entries**: Shows summary mode with aggregated insights
- **--full flag**: Forces full view regardless of size

Output includes:
- Domain-level statistics and distribution
- Knowledge hubs (most connected entries)
- Tag frequency analysis
- Cross-domain relationships
- Overall statistics

**4. Display output**

Simply display the script's output as-is. The script already formats everything including statistics, Mermaid chart, and legend.

## Error Handling

- **Missing config**: Prompt to run `/teamdna:dna-init`
- **Missing index**: Prompt to run `/teamdna:dna-index`
- **Insufficient entries**: Prompt that at least 2 entries are needed
- **No relationships**: Prompt to add more tags to entries

## Notes

1. **Automatic mode switching**: Summary mode activates at 50+ entries to prevent overwhelming output
2. **Domain extraction**: Automatically groups entries by path structure (backend, frontend, typescript)
3. **Knowledge hubs**: Identifies most connected entries as key reference points
4. **Cross-domain insights**: Shows how different domains interact through shared tags
5. Relationships are based on tag co-occurrence, tag design affects graph quality
6. Uses zero-dependency design, only requires Node.js built-in modules
