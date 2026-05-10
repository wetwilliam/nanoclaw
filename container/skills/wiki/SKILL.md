---
name: wiki
description: Personal knowledge wiki maintainer. Ingest sources, answer queries, and run lint passes on the wiki knowledge base.
---

# Wiki Skill

This is the schema layer for the personal knowledge wiki. It defines the structure, conventions, and workflows for maintaining the wiki.

## Directory Layout

```
/workspace/group/
  wiki/           ← LLM-owned markdown knowledge base
    index.md      ← content catalog (read first on every query)
    log.md        ← append-only activity log
    ...           ← topic pages, entity pages, concept pages
  sources/        ← immutable raw sources (never modify these)
    ...           ← articles, PDFs, images, clippings
```

---

## Operations

### INGEST — Adding a new source

When the user drops a source (URL, file, image), process it fully before moving on.

**Step by step:**

1. **Obtain full content**
   - URL (webpage): Use `agent-browser` or `curl` to fetch the full page text, not just a summary. Prefer curl for clean text:
     ```bash
     curl -sL "<url>" -o sources/<slug>.html
     ```
     For pages requiring JavaScript, use `agent-browser open <url>` then extract content.
   - URL (PDF): Download directly:
     ```bash
     curl -sLo sources/<slug>.pdf "<url>"
     ```
   - File already in sources/: Read it directly.
   - Image: View it and extract all text, data, and concepts visible.

2. **Read and discuss takeaways**
   - Summarize the key ideas to the user.
   - Identify: main thesis, key entities (people, orgs, tools, concepts), notable facts, contradictions with existing wiki content.

3. **Update wiki pages** — touch all relevant pages:
   - **Summary page** for this source: `wiki/sources/<slug>.md`
     - Title, date ingested, original URL/filename, 2-3 paragraph summary, key entities/concepts with links, notable quotes or data points.
   - **Entity pages**: One page per significant person, organization, tool, or product. Create if missing; update if exists.
   - **Concept pages**: One page per major idea or theme. Create if missing; update if exists.
   - **Cross-references**: Link this source to related existing pages; link related pages back to it.
   - **Index** (`wiki/index.md`): Add new pages; update summaries for changed pages.
   - **Log** (`wiki/log.md`): Append entry: `## [YYYY-MM-DD] ingest | <source title>`

4. **Confirm** to the user: what pages were created/updated, what connections were made.

**CRITICAL — one source at a time:** If the user provides multiple files or points to a folder, process them strictly one at a time. Fully finish one source (all steps above) before starting the next. Do NOT batch-read all sources first — this produces shallow, generic pages instead of deep integration.

---

### QUERY — Answering questions

1. Read `wiki/index.md` to locate relevant pages.
2. Read those pages and cross-linked pages as needed.
3. Synthesize a clear answer with citations (link to wiki pages).
4. If the answer is substantial and reusable, offer to save it as a new wiki page (e.g., `wiki/explorations/<topic>.md`) and add to index + log.

---

### LINT — Health check

Run periodically to keep the wiki healthy. Check for:

- **Contradictions**: Claims in one page that conflict with another.
- **Orphan pages**: Pages with no inbound links (not referenced anywhere).
- **Stale content**: Claims that may have been superseded by newer sources.
- **Missing cross-references**: Entities or concepts mentioned in multiple pages but not linked.
- **Concept gaps**: Important topics that appear repeatedly but lack a dedicated page.
- **Index gaps**: Pages that exist but aren't in `wiki/index.md`.

Report findings clearly. Offer to fix issues. Log the lint pass:
```
## [YYYY-MM-DD] lint | <brief summary of findings>
```

---

## Page Conventions

- **Filenames**: lowercase, hyphens, descriptive (e.g., `transformer-architecture.md`, `andrej-karpathy.md`)
- **Frontmatter** (optional but useful for index queries):
  ```yaml
  ---
  type: concept | entity | source-summary | exploration
  tags: [ai, language-models]
  sources: 3
  updated: 2026-04-06
  ---
  ```
- **Links**: Use relative markdown links `[Page](../entities/name.md)`
- **Headings**: H1 for page title, H2 for sections
- Sources go in `sources/` — wiki pages go in `wiki/`

---

## Source Handling Notes

- **Images**: View directly; extract all visible text, data, charts. Note what you see and why it matters.
- **PDFs**: Read full text. If `pdftotext` is available: `pdftotext sources/file.pdf -`
- **Large sources**: Process in sections. Don't summarize at a surface level — the value is in the detail.
