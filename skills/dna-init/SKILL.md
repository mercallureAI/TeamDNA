---
name: dna-init
description: Initialize TeamDNA knowledge repository for first-time setup
user-invokable: true
---

# /dna-init — Initialize TeamDNA

Guide user through first-time TeamDNA setup: clone knowledge repo and write config.

## Usage

```text
/teamdna:dna-init [repo-url] [clone-path]
```

**Arguments (optional):**
- `repo-url` — Team knowledge repository URL (e.g., `https://github.com/your-team/knowledge-repo.git`)
- `clone-path` — Custom clone location (default: `~/teamdna-repo`)

**Examples:**
- `/teamdna:dna-init` — Interactive mode (prompts for inputs)
- `/teamdna:dna-init https://github.com/team/repo.git` — Direct with repo URL
- `/teamdna:dna-init https://github.com/team/repo.git ~/custom-path` — Direct with custom path

## Steps

1. **Parse arguments** (if provided):
   - Split arguments by whitespace
   - First argument = repo URL
   - Second argument = clone path (optional)
   - Validate repo URL format (should contain `.git` or be a valid Git URL)

2. **If arguments missing, ask interactively**:
   - Ask user for their team's knowledge repository URL
     - Example: `https://github.com/your-team/knowledge-repo.git`
   - Ask if they want a custom clone path (optional)
     - Default: `~/teamdna-repo`
     - Custom: any absolute path

3. **Run initialization script**:
   ```bash
   node <teamdna-dir>/scripts/dna-init.mjs <repo-url> [clone-path]
   ```

4. **Explain what happened**:
   - Knowledge repo cloned/pulled to specified path
   - Config written to `~/.teamdna/config`
   - Skills available as `/teamdna:dna-search`, `/teamdna:dna-push`, etc.

5. **Suggest next steps**:
   - Try `/teamdna:dna-search <keyword>` to search knowledge base
   - Use `/teamdna:dna-push` to share new knowledge
   - Run `/teamdna:dna-pull` to sync latest updates

## Error Handling

If script fails:
- Check Git is installed: `git --version`
- Verify repo URL is accessible
- Ensure write permissions for clone path
