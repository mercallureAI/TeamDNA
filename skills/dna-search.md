---
name: dna-search
description: Search team knowledge base by keyword
user_invocable: true
---

# /dna-search — Search Team Knowledge Base

Search the shared knowledge base by keyword matching against the index.

## Steps

1. Read `~/.teamdna/config` to get `repo_path`
2. Run `git -C <repo_path> pull` to sync latest
3. Read `<repo_path>/.teamdna/index.md`
4. Match user keywords against title, tags, and summary columns
5. If single match: read and return the full MD file content
6. If multiple matches: list all with title + summary, let user choose
7. If no match: inform user and suggest broadening keywords
