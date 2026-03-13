---
name: dna-push
description: Share experience to team knowledge base
user-invokable: true
---

# /dna-push — Share Experience

Interactively guide user to create and push a knowledge entry.

## Steps

1. Get `<teamdna-repo-dir>` from session context
2. Run `git -C <teamdna-repo-dir> pull`
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
   git -C <teamdna-repo-dir> add .
   git -C <teamdna-repo-dir> commit -m "add: [title]"
   git -C <teamdna-repo-dir> push
   ```
7. If push fails due to conflict, run `git -C <teamdna-repo-dir> pull --rebase` and retry push
8. After successful push, rebuild index by running `node <teamdna-scripts-dir>/dna-index.mjs <teamdna-repo-dir>`, then commit and push the updated index
