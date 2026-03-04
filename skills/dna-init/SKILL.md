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
- `clone-path` — Custom clone location (default: platform-specific, see below)

**Default locations (XDG-compliant on Linux):**
- Linux: `$XDG_DATA_HOME/teamdna` (typically `~/.local/share/teamdna`)
- macOS/Windows: `~/.teamdna/repo`

**Quoting rule:** If `clone-path` contains spaces, wrap it in double quotes (e.g., `"/path/with spaces/teamdna"`).

**Examples:**
- `/teamdna:dna-init` — Interactive mode (prompts for inputs)
- `/teamdna:dna-init https://github.com/team/repo.git` — Direct with repo URL
- `/teamdna:dna-init https://github.com/team/repo.git ~/custom-path` — Direct with custom path
- `/teamdna:dna-init https://github.com/team/repo.git "/Users/name/My Projects/teamdna"` — Path with spaces (quoted)

## Steps

1. **Parse arguments** (if provided):
   - Parse arguments using shell-style tokenization: respect double-quoted strings to allow spaces in paths (e.g., `"My Projects/teamdna"`)
   - First argument = repo URL
   - Second argument = clone path (optional; must be quoted if it contains spaces)
   - Validate repo URL format (should contain `.git` or be a valid Git URL)

2. **If arguments missing, ask interactively**:
   - Ask user for their team's knowledge repository URL
     - Example: `https://github.com/your-team/knowledge-repo.git`
   - Ask if they want a custom clone path (optional)
     - Default (Linux): `$XDG_DATA_HOME/teamdna` (typically `~/.local/share/teamdna`)
     - Default (macOS/Windows): `~/.teamdna/repo`
     - Custom: any absolute path

3. **Run initialization script**:
   ```bash
   node <teamdna-dir>/scripts/dna-init.mjs <repo-url> [clone-path]
   ```

4. **Explain what happened**:
   - Knowledge repo cloned/pulled to specified path
   - Config written to platform-specific location:
     - Linux: `$XDG_CONFIG_HOME/teamdna/config` (typically `~/.config/teamdna/config`)
     - macOS/Windows: `~/.teamdna/config`
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
