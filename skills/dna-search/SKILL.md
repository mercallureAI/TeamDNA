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

Parse the `repo_path` field. If config doesn't exist, prompt user to run `/teamdna:dna-init`.

**2. Sync Knowledge Base**

```bash
git -C <repo_path> pull
```

If it fails, prompt user to check network or repository status.

**3. Read Index**

```bash
cat <repo_path>/.teamdna/index.md
```

If index doesn't exist, prompt user to run `/teamdna:dna-index`.

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
3. Use `/teamdna:dna-pull` to sync latest knowledge base
4. Browse index file to see all available entries:
   cat <repo_path>/.teamdna/index.md
```

## Error Handling

- **Missing Config**: Prompt to run `/teamdna:dna-init`
- **Missing Index**: Prompt to run `/teamdna:dna-index`
- **Git Sync Failed**: Prompt to check network or repository status
- **File Read Failed**: Prompt that file may have been deleted, suggest rebuilding index

## Notes

1. Phase 2 reads multiple complete files, be mindful of token consumption
2. Semantic analysis depends on Claude's understanding ability, results may vary by context
3. Maintain zero-dependency design, only use Node.js built-in modules and shell commands
4. Use absolute paths for all paths to avoid relative path issues
