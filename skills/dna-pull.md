---
name: dna-pull
description: Pull latest team knowledge base
user_invocable: true
---

# /dna-pull — Pull Latest Knowledge Base

Read `~/.teamdna/config` to get `repo_path`, then execute `git pull` in that directory.

## Steps

1. Read config file at `~/.teamdna/config` (Linux/Mac) or `%USERPROFILE%\.teamdna\config` (Windows)
2. Parse `repo_path=<path>` to get the local repo path
3. Run `git -C <repo_path> pull`
4. Report the result to user
