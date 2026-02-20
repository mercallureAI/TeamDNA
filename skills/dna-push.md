---
name: dna-push
description: Share experience to team knowledge base
user_invocable: true
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
# [标题]

- **作者**: [ask user]
- **日期**: [today YYYY-MM-DD]
- **标签**: [comma separated]
- **场景**: [one line description]

## 问题/背景

[user input]

## 解决方案

[user input]

## 注意事项

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
8. After successful push, rebuild index by running the dna-index script (auto-select .sh or .bat based on OS) in the repo directory, then commit and push the updated index
