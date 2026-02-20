#!/bin/bash
# dna-index.sh — Scan MD files and generate .teamdna/index.md
set -e

REPO_DIR="${1:-.}"
INDEX_FILE="$REPO_DIR/.teamdna/index.md"

mkdir -p "$REPO_DIR/.teamdna"

# Write table header
echo "| 标题 | 标签 | 路径 | 摘要 |" > "$INDEX_FILE"
echo "|------|------|------|------|" >> "$INDEX_FILE"

# Scan all MD files in content directories
for dir in pitfalls standards solutions; do
  find "$REPO_DIR/$dir" -name "*.md" -type f 2>/dev/null | sort | while read -r file; do
    relpath="${file#$REPO_DIR/}"
    title=$(head -5 "$file" | grep "^# " | head -1 | sed 's/^# //')
    tags=$(grep "^\- \*\*标签\*\*:" "$file" | head -1 | sed 's/.*标签\*\*: *//')
    scene=$(grep "^\- \*\*场景\*\*:" "$file" | head -1 | sed 's/.*场景\*\*: *//')
    [ -z "$title" ] && title=$(basename "$file" .md)
    [ -z "$tags" ] && tags="-"
    [ -z "$scene" ] && scene="-"
    echo "| $title | $tags | $relpath | $scene |" >> "$INDEX_FILE"
  done
done

echo "[dna-index] Index rebuilt: $INDEX_FILE"
