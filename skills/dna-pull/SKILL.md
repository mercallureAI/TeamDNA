---
name: dna-pull
description: Pull latest team knowledge base
user-invokable: true
---

# /dna-pull — Pull Latest Knowledge Base

Get `<teamdna-repo-dir>` from session context, then execute `git pull` in that directory.

## Steps

1. Get `<teamdna-repo-dir>` from session context
2. Run `git -C <teamdna-repo-dir> pull`
3. Report the result to user
