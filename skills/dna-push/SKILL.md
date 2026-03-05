---
name: dna-push
description: Share experience to team knowledge base
user-invokable: true
---

# /dna-push — Share Experience

Interactively guide user to create and push a knowledge entry.

## Steps

1. Read `~/.teamdna/config` to get `repo_path`
2. Run `git -C <repo_path> pull`
3. Ask user for:
   - Type: pitfalls / standards / solutions
   - Title, tags, scenario description
   - Problem/background and solution
4. Generate MD file using this template:

```markdown
# [Title]

- **Author**: [ask user]
- **Date**: [today YYYY-MM-DD]
- **Tags**: [comma separated]
- **Scenario**: [one line description]

## Problem/Background

[user input]

## Solution

[user input]

## Notes

[user input]
```

5. Auto-determine file path based on type and content (e.g. `pitfalls/docker/2025-06-15-xxx.md`), present to user for confirmation
6. Write file, then run:
   ```
   git -C <repo_path> add .
   git -C <repo_path> commit -m "add: [title]"
   git -C <repo_path> push
   ```
7. If push fails due to conflict, run `git -C <repo_path> pull --rebase` and retry push
8. After successful push, rebuild index by running `node <teamdna-dir>/scripts/dna-index.mjs <repo_path>`, then commit and push the updated index
