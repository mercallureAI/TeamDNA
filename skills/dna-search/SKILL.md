---
name: dna-search
description: Search team knowledge base with semantic understanding
user-invokable: true
---

# /dna-search — Semantic Search Team Knowledge Base

Uses a two-stage search strategy: keyword pre-filtering + Claude semantic understanding, providing relevance scores and matching reasons.

## Search Strategy

**Phase 1: Keyword Pre-filtering**
- Quickly match titles, tags, and scenarios from the index
- Decide next steps based on result count:
  - 0 results: Show no results message
  - 1 result: Return directly
  - 2-30 results: Proceed to Phase 2
  - >30 results: Prompt to narrow down

**Phase 2: Semantic Analysis**
- Read full content of candidate entries
- Use Claude to understand user intent
- Evaluate relevance of each entry (1-10 score)
- Provide matching reasons and sort results

## Implementation Steps

### Phase 1: Keyword Pre-filtering

**1. Read Configuration**

```bash
cat ~/.teamdna/config
```

Parse the `repo_path` field. If config doesn't exist, invoke the `/teamdna:dna-init` skill to initialize configuration.

**2. Sync Knowledge Base**

```bash
git -C <repo_path> pull
```

If it fails, prompt user to check network or repository status.

**3. Read Index**

```bash
cat <repo_path>/.teamdna/index.md
```

If index doesn't exist, invoke the `/teamdna:dna-index` skill to rebuild the index.

**4. Keyword Matching**

Use `grep` to search for user keywords in the index (case-insensitive):

```bash
grep -i "<keyword>" <repo_path>/.teamdna/index.md
```

Count matching lines and branch based on result count:

- **0 results**: Jump to "No Results Handling"
- **1 result**: Jump to "Single Result Handling"
- **2-30 results**: Continue to Phase 2
- **>30 results**: Prompt user: "Found more than 30 results, please use more specific keywords to narrow down."

### Phase 2: Semantic Analysis (2-30 candidates)

**1. Extract Candidate Entry Paths**

Extract file paths (first column) from matching index lines.

**2. Read Full Content of Candidate Entries**

For each candidate path, read the complete Markdown file:

```bash
cat <repo_path>/<entry_path>
```

**3. Build Semantic Analysis Prompt**

Combine user query and all candidate entry contents into the following prompt, send to Claude:

```
User Query: {user_query}

Below are {N} candidate knowledge entries. Please evaluate the relevance of each entry to the user query.

---
Candidate Entry 1:
Path: {path1}
Content:
{content1}

---
Candidate Entry 2:
Path: {path2}
Content:
{content2}

---
(Continue for up to 30 entries)

---

Please return evaluation results in the following format (sorted by relevance from high to low):

[Score X/10] {Entry Title}
Matching Reason: {reason within 20 words}
Path: {path}

Requirements:
1. Score range 1-10 (10 is most relevant)
2. Matching reason should be concise and precise, within 20 words
3. Only return entries with score ≥ 5
4. Sort by score in descending order
5. If all entries score < 5, return "No highly relevant entries"
```

**4. Parse Claude's Response**

Extract score, title, reason, and path, sort by score.

**5. Display Results**

```
Found {N} relevant entries:

[Score 9/10] {Title}
  Matching Reason: {reason}
  Path: {path}

[Score 7/10] {Title}
  Matching Reason: {reason}
  Path: {path}
```

If user wants to view full content of an entry, read and display the corresponding file.

### Special Case Handling

**Single Result Handling (1 match)**

Directly read and return the full content of the entry:

```bash
cat <repo_path>/<entry_path>
```

Display format:

```
Found 1 matching entry:

{Full Markdown Content}

Path: {path}
```

**No Results Handling (0 matches)**

```
No matching knowledge entries found.

Suggestions:
1. Try using more general keywords
2. Check if spelling is correct
3. Invoke the `/teamdna:dna-pull` skill to sync latest knowledge base
4. Browse index file to see all available entries:
   cat <repo_path>/.teamdna/index.md
```

## Error Handling

- **Missing Config**: Invoke the `/teamdna:dna-init` skill to initialize configuration
- **Missing Index**: Invoke the `/teamdna:dna-index` skill to rebuild the index
- **Git Sync Failed**: Prompt to check network or repository status
- **File Read Failed**: Prompt that file may have been deleted, suggest rebuilding index

## Notes

1. Phase 2 reads multiple complete files, be mindful of token consumption
2. Semantic analysis depends on Claude's understanding ability, results may vary by context
3. Maintain zero-dependency design, only use Node.js built-in modules and shell commands
4. Use absolute paths for all paths to avoid relative path issues

## Phase 3: Intelligent Combination Analysis (Evolution Algorithm)

**Trigger Condition:** When Phase 1 or Phase 2 returns 2 or more entries, automatically analyze combinations.

**1. Calculate Affinity Scores**

For each pair of entries in the search results, calculate affinity:

```javascript
// Affinity calculation logic (conceptual, implemented in prompt)
function calculateAffinity(entry1, entry2) {
  const sharedTags = entry1.tags.filter(t => entry2.tags.includes(t));
  let affinity = sharedTags.length * 2;  // Tag weight

  // Type complementarity bonus
  if ((entry1.type === 'pitfalls' && entry2.type === 'solutions') ||
      (entry1.type === 'solutions' && entry2.type === 'pitfalls')) {
    if (sharedTags.length > 0) affinity += 1;
  }

  return { affinity, sharedTags };
}
```

**Implementation:**
- Extract tags from each entry's frontmatter (`**标签**:` field)
- Extract type from file path (pitfalls/solutions/standards)
- Calculate affinity for all pairs: n*(n-1)/2 combinations
- Filter combinations where affinity ≥ 3 (THRESHOLD)

**2. Skip if No High-Affinity Combinations**

If no combinations meet the threshold (affinity < 3), skip Phase 3 entirely and return search results as-is.

**3. Sort and Limit Combinations**

- Sort combinations by affinity score (descending)
- Keep top 3 combinations maximum to avoid information overload

**4. Generate Combined Insights with Claude**

For each high-affinity combination, read the full content of both entries and generate a combined insight using Claude.

**Prompt Template:**

```
You are a knowledge combination expert. Here are the following knowledge entries:

Entry 1 (Type: {type1}):
Title: {title1}
Tags: {tags1}
Content:
{content1}

---

Entry 2 (Type: {type2}):
Title: {title2}
Tags: {tags2}
Content:
{content2}

---

Shared Tags: {sharedTags}
Affinity Score: {affinity}

Please analyze the relationship between these entries and generate a combined knowledge insight. Requirements:

1. Identify combination type:
   - Complementary (Pitfall + Solution): Complete problem-solution guide
   - Aggregation (same type entries): Comprehensive best practices
   - Cross-domain Transfer (different domains, similar patterns): Pattern transfer suggestions

2. Generate concise title (max 20 words)

3. Extract and fuse core information (200-300 words)

4. Output format:
   Combination Type: [type]
   Title: [title]
   Content: [fused content]
```

**5. Display Combined Insights**

After displaying search results, add a separator and show combined insights with artistic DNA crossover visualization:

```markdown
---

## 🧬 GENETIC CROSSOVER: KNOWLEDGE EVOLUTION

```
                                         Entry 1              Entry 2
                                             │                    │
                                             │                    │
                                             ▼                    ▼
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⢠⣄⠀⠀⠀⠀⣿⣷⣦
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣦⠘⢶⣄⠀⠙⠳⣤⣀⠀⣿⣿⡇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣄⠀⠉⠛⠦⣄⡀⠉⢱⡿⣹⠁
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢀⠀⣿⣿⡗⠦⣄⠀⠀⢉⣴⣟⡴⠃⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣤⢶⡚⣿⣯⣭⣽⣯⣽⣿⡇⣷⠲⣾⣒⣿⡯⠟⠋⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠻⣍⡼⠿⣯⠉⠈⠛⢦⡈⠛⢦⣿⣸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡏⣰⠞⢿⣄⠀⠈⠳⣄⠀⠀⠙⠶⡄⢸⡇⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡿⢠⡏⠀⠀⠙⢷⣄⠀⠈⠳⣄⠀⠀⠘⢺⡇⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⣇⢸⠻⣦⡀⠀⠀⠈⠳⣄⠀⠈⠳⣄⠀⣼⠁⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣼⡆⠈⠛⣦⡀⠀⠀⠈⠑⢤⡀⠈⢳⠟⣸⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⠹⡷⣄⡀⠀⠙⠶⣄⡀⠀⠀⢙⠶⠋⣠⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡄⢧⠈⠛⢦⣀⠀⣀⣩⡷⠞⣁⣤⠾⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⡤⠶⢶⣚⣉⣹⣿⣿⡇⢸⣖⣲⡶⣟⣯⣯⣶⠷⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⢾⣿⣁⣠⠴⠞⠛⢻⣍⠀⠀⠀⣧⣸⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡾⠁⣿⠞⠹⣦⡀⠀⠀⠀⠈⠳⣄⠀⣿⣸⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡏⢹⣾⡁⠀⠀⠈⠻⣦⡀⠀⠀⠀⠈⠳⡿⢹⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡿⢀⡟⠀⠹⢦⡀⠀⠀⠀⠙⢦⡀⠀⠀⠀⣿⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢺⢧⡼⠀⠀⠀⠀⠙⠷⣄⠀⠀⠀⠙⢦⡀⢀⡿⣸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠈⡟⠷⣤⡀⠀⠀⠀⠈⠙⢦⣀⠀⠀⠙⡾⢠⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⣇⠀⠀⠙⠢⣄⠀⠀⠀⠀⠈⣳⣤⠞⣡⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⣼⣷⣿⣿⣿⣿⣿⣛⣛⣛⣻⣻⣋⣡⠾⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⣠⡤⠞⣿⣿⣷⡟⢻⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣠⣶⣟⣡⠶⠋⠁⠀⠈⠳⣼⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢀⡼⣻⡿⠋⠻⢦⣀⠀⠀⠀⠀⠈⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣾⣻⠋⠀⠀⠀⠀⠈⠛⠦⣄⡀⣰⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⣿⡿⠦⢤⣘⣢⠄⠀⠀⠀⠈⠙⣿⣳⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⣿⠂⠀⠀⠈⠉⠓⠒⠂⠀⠀⠀⠈⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠈⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
        ╔═══════════════╗⠀⠀⠀⠀⠀⠀
        ║   CROSSOVER   ║⠀⠀⠀⠀⠀⠀
        ║       ✂       ║⠀⠀⠀⠀⠀⠀
        ╚═══════╤═══════╝
                │
        ╔═══════▼══════╗
        ║   EVOLVED    ║
        ║    INSIGHT   ║
        ╚══════════════╝
```

    ════════════════════════════════════════════
     Affinity: {affinity}/10 | Tags: {sharedTags}
    ════════════════════════════════════════════

## 💡 Intelligent Combination Insights

The system found the following highly related knowledge entries and generated dynamic combination analysis for you:

### Combination 1: [Claude-generated title]
**Combination Type:** [Complementary/Aggregation/Cross-domain Transfer]
**Participating Entries:**
- 📄 [Entry 1 Title] ({path1})
- 📄 [Entry 2 Title] ({path2})
**Shared Tags:** {sharedTags}
**Affinity Score:** {affinity}

**Combined Content:**
[Claude-generated fused content]

---

### Combination 2: [If there's a second combination]
[Same structure]

---

### Combination 3: [If there's a third combination]
[Same structure]
```

## Implementation Notes

1. **Tag Extraction:** Parse `**标签**:` field from entry frontmatter using regex
2. **Type Extraction:** Extract from file path (first directory: pitfalls/solutions/standards)
3. **Affinity Threshold:** Start with 3, can be adjusted based on usage
4. **Performance:** Only analyze entries already in search results (max 30)
5. **Error Handling:** If Claude generation fails, silently skip that combination
6. **No Persistence:** Generated insights are displayed only, never saved to files
