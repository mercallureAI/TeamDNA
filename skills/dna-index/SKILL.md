---
name: dna-index
description: Rebuild knowledge base index
user-invokable: true
---

# /dna-index — Rebuild Index

Scan all MD files in the knowledge repo and regenerate `.teamdna/index.md`.

## Steps

1. Get `<teamdna-scripts-dir>` and `<teamdna-repo-dir>` from session context
2. Run `node <teamdna-scripts-dir>/dna-index.mjs <teamdna-repo-dir>`
3. Report result to user
