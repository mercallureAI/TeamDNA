---
name: dna-index
description: Rebuild knowledge base index
user_invocable: true
---

# /dna-index — Rebuild Index

Scan all MD files in the knowledge repo and regenerate `.teamdna/index.md`.

## Steps

1. Read `~/.teamdna/config` to get `repo_path`
2. Locate the `dna-index.mjs` script in the TeamDNA install directory
3. Run `node <teamdna-dir>/scripts/dna-index.mjs <repo_path>`
4. Report result to user
