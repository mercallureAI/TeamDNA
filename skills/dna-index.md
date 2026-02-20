---
name: dna-index
description: Rebuild knowledge base index
user_invocable: true
---

# /dna-index — Rebuild Index

Scan all MD files in the knowledge repo and regenerate `.teamdna/index.md`.

## Steps

1. Read `~/.teamdna/config` to get `repo_path`
2. Detect OS: if Windows use `dna-index.bat`, otherwise use `dna-index.sh`
3. Locate the script in the TeamDNA install directory (same directory as the skills source)
4. Run the index script with `repo_path` as argument
5. Report result to user
