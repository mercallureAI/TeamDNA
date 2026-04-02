#!/usr/bin/env node
// dna-graph.mjs — Generate knowledge graph from index
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readConfig } from "./paths.mjs";

// Constants
const AFFINITY_TAG_WEIGHT = 2; // Weight multiplier for shared tags
const AFFINITY_TYPE_BONUS = 1; // Bonus for pitfall-solution relationships
const THRESHOLD_SMALL = 2; // Affinity threshold for small graphs
const THRESHOLD_LARGE = 3; // Affinity threshold for large graphs
const LARGE_GRAPH_SIZE = 20; // Size threshold to switch to stricter filtering
const MAX_LABEL_LENGTH = 30; // Maximum characters in node labels
const MAX_EDGE_TAGS = 2; // Maximum tags to display on edges
const VALID_TYPES = ['pitfalls', 'solutions', 'standards']; // Valid entry types

// Read config
const config = readConfig();
if (!config) {
  console.error('Error: TeamDNA not initialized. Run /teamdna:dna-init first.');
  process.exit(1);
}

const repoPath = config.repoPath;

const INDEX_FILE = join(repoPath, '.teamdna', 'index.md');

console.log('[dna-graph] Config loaded:', repoPath);

// Check index exists
if (!existsSync(INDEX_FILE)) {
  console.error('Error: Index not found. Run /teamdna:dna-index first.');
  process.exit(1);
}

// Parse index
let indexContent;
try {
  indexContent = readFileSync(INDEX_FILE, 'utf-8');
} catch (err) {
  console.error(`Error: Cannot read index file: ${err.message}`);
  process.exit(1);
}

const lines = indexContent.split('\n').slice(2); // Skip header rows

const entries = [];
for (const line of lines) {
  if (!line.trim() || !line.startsWith('|')) continue;

  const parts = line.split('|').map(p => p.trim()).filter(Boolean);
  if (parts.length < 4) continue;

  const [title, tagsStr, path, scenario] = parts;
  const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

  // Extract type from path (pitfalls/standards/solutions)
  const type = path.includes('/') ? path.split('/')[0] : 'unknown';
  if (!VALID_TYPES.includes(type)) {
    console.warn(`Warning: Unknown entry type "${type}" for ${title}`);
  }

  entries.push({ title, tags, path, type });
}

console.log(`[dna-graph] Loaded ${entries.length} entries`);

// Check minimum entries
if (entries.length < 2) {
  console.error('Error: Insufficient entries in knowledge base, cannot generate relationship graph (at least 2 entries required)');
  console.error('Tip: Use /teamdna:dna-push to add more knowledge entries');
  process.exit(1);
}

// Calculate relationships
function calculateAffinity(entry1, entry2) {
  const sharedTags = entry1.tags.filter(t => entry2.tags.includes(t));
  let affinity = sharedTags.length * AFFINITY_TAG_WEIGHT;

  // Type relationship bonus
  if ((entry1.type === 'pitfalls' && entry2.type === 'solutions') ||
      (entry1.type === 'solutions' && entry2.type === 'pitfalls')) {
    if (sharedTags.length > 0) affinity += AFFINITY_TYPE_BONUS;
  }

  return { affinity, sharedTags };
}

// Build relationship graph
const relationships = [];
for (let i = 0; i < entries.length; i++) {
  for (let j = i + 1; j < entries.length; j++) {
    const { affinity, sharedTags } = calculateAffinity(entries[i], entries[j]);

    // Filter by threshold
    const threshold = entries.length > LARGE_GRAPH_SIZE ? THRESHOLD_LARGE : THRESHOLD_SMALL;
    if (affinity >= threshold) {
      relationships.push({
        from: i,
        to: j,
        affinity,
        sharedTags
      });
    }
  }
}

console.log(`[dna-graph] Found ${relationships.length} relationships`);

// Check if any relationships found
if (relationships.length === 0) {
  console.error('No relationships found between entries.');
  console.error('Suggestion: Add more tags to entries to establish knowledge connections.');
  console.error('\nCurrent entries:');
  entries.forEach(e => {
    console.error(`  - ${e.title} [${e.tags.join(', ')}]`);
  });
  process.exit(1);
}

// Generate node ID from path
function nodeId(path) {
  return 'N' + createHash('md5').update(path).digest('hex').slice(0, 8);
}

// Calculate statistics
const typeCount = {
  pitfalls: entries.filter(e => e.type === 'pitfalls').length,
  solutions: entries.filter(e => e.type === 'solutions').length,
  standards: entries.filter(e => e.type === 'standards').length
};

console.log(`Knowledge Graph (${entries.length} entries, ${relationships.length} relationships)\n`);

// Generate ASCII graph
function renderAsciiGraph() {
  const output = [];

  // Type symbols
  const typeSymbol = {
    pitfalls: '🔴',
    solutions: '🟢',
    standards: '🔵'
  };

  // Build adjacency list
  const adjacency = new Map();
  for (let i = 0; i < entries.length; i++) {
    adjacency.set(i, []);
  }

  for (const rel of relationships) {
    adjacency.get(rel.from).push({ to: rel.to, tags: rel.sharedTags });
    adjacency.get(rel.to).push({ to: rel.from, tags: rel.sharedTags });
  }

  // Render each entry with its connections
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const symbol = typeSymbol[entry.type] || '⚪';
    const connections = adjacency.get(i);

    // Entry header
    output.push(`${symbol} ${entry.title}`);
    output.push(`   Tags: ${entry.tags.join(', ')}`);

    // Show connections
    if (connections.length > 0) {
      for (let j = 0; j < connections.length; j++) {
        const conn = connections[j];
        const target = entries[conn.to];
        const targetSymbol = typeSymbol[target.type] || '⚪';
        const isLast = j === connections.length - 1;
        const prefix = isLast ? '   └─' : '   ├─';
        const tags = conn.tags.slice(0, MAX_EDGE_TAGS).join(', ');

        output.push(`${prefix}[${tags}]─> ${targetSymbol} ${target.title}`);
      }
    }

    output.push(''); // Empty line between entries
  }

  return output.join('\n');
}

console.log(renderAsciiGraph());

console.log(`Legend:`);
console.log(`🔴 Pitfalls - ${typeCount.pitfalls} entries`);
console.log(`🟢 Solutions - ${typeCount.solutions} entries`);
console.log(`🔵 Standards - ${typeCount.standards} entries`);

