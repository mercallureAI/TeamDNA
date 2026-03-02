---
name: dna-init
description: Initialize TeamDNA knowledge repository for first-time setup
user-invokable: true
---

# /dna-init — Initialize TeamDNA

Guide user through first-time TeamDNA setup: clone knowledge repo and write config.

## Steps

1. Ask user for their team's knowledge repository URL
   - Example: `https://github.com/your-team/knowledge-repo.git`

2. Ask if they want a custom clone path (optional)
   - Default: `~/teamdna-repo`
   - Custom: any absolute path

3. Run initialization script:
   ```bash
   node <teamdna-dir>/scripts/dna-init.mjs <repo-url> [clone-path]
   ```

4. Explain what happened:
   - Knowledge repo cloned/pulled to specified path
   - Config written to `~/.teamdna/config`
   - Skills available as `/teamdna:dna-search`, `/teamdna:dna-push`, etc.

5. Suggest next steps:
   - Try `/teamdna:dna-search <keyword>` to search knowledge base
   - Use `/teamdna:dna-push` to share new knowledge
   - Run `/teamdna:dna-pull` to sync latest updates

## Error Handling

If script fails:
- Check Git is installed: `git --version`
- Verify repo URL is accessible
- Ensure write permissions for clone path
