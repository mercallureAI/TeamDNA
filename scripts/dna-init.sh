#!/bin/bash
# dna-init.sh — Initialize TeamDNA: clone repo, write config, install skills
set -e

REPO_URL="$1"
if [ -z "$REPO_URL" ]; then
  echo "Usage: dna-init.sh <repo-url> [clone-path]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CLONE_DIR="${2:-$HOME/teamdna-repo}"
CONFIG_DIR="$HOME/.teamdna"
SKILLS_DIR="$HOME/.claude/skills"

# 1. Clone repo
if [ -d "$CLONE_DIR" ]; then
  echo "[dna-init] Repo already exists at $CLONE_DIR, pulling latest..."
  git -C "$CLONE_DIR" pull
else
  echo "[dna-init] Cloning $REPO_URL to $CLONE_DIR..."
  git clone "$REPO_URL" "$CLONE_DIR"
fi

# 2. Write config
mkdir -p "$CONFIG_DIR"
echo "repo_path=$CLONE_DIR" > "$CONFIG_DIR/config"
echo "[dna-init] Config written to $CONFIG_DIR/config"

# 3. Install skills
mkdir -p "$SKILLS_DIR"
cp "$SCRIPT_DIR/skills/"*.md "$SKILLS_DIR/"
echo "[dna-init] Skills installed to $SKILLS_DIR"

echo "[dna-init] Done! Use /dna-search, /dna-push, /dna-pull, /dna-index in Claude Code."
