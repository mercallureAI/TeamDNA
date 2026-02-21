#!/usr/bin/env node
// dna-index.mjs — Scan MD files and generate .teamdna/index.md
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const REPO_DIR = process.argv[2] || '.';
const INDEX_FILE = join(REPO_DIR, '.teamdna', 'index.md');

mkdirSync(join(REPO_DIR, '.teamdna'), { recursive: true });

function findMdFiles(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findMdFiles(full));
    else if (entry.name.endsWith('.md')) results.push(full);
  }
  return results.sort();
}

const rows = [];
for (const dir of ['pitfalls', 'standards', 'solutions']) {
  for (const file of findMdFiles(join(REPO_DIR, dir))) {
    const lines = readFileSync(file, 'utf-8').split(/\r?\n/);
    const titleLine = lines.find(l => l.startsWith('# '));
    const title = titleLine ? titleLine.slice(2).trim() : basename(file, '.md');
    const tagsLine = lines.find(l => /^- \*\*标签\*\*:/.test(l));
    const tags = tagsLine ? tagsLine.replace(/^- \*\*标签\*\*:\s*/, '') : '-';
    const sceneLine = lines.find(l => /^- \*\*场景\*\*:/.test(l));
    const scene = sceneLine ? sceneLine.replace(/^- \*\*场景\*\*:\s*/, '') : '-';
    const relpath = relative(REPO_DIR, file).replace(/\\/g, '/');
    rows.push(`| ${title} | ${tags} | ${relpath} | ${scene} |`);
  }
}

const output = ['| 标题 | 标签 | 路径 | 摘要 |', '|------|------|------|------|', ...rows, ''].join('\n');
writeFileSync(INDEX_FILE, output, 'utf-8');
console.log(`[dna-index] Index rebuilt: ${INDEX_FILE}`);
