---
name: tavily
description: AI-optimized web search via Tavily API. Returns concise, relevant results for AI agents.
homepage: https://tavily.com
---

# Tavily Search

AI-optimized web search using Tavily API. Designed for AI agents - returns clean, relevant content.

## Search

```bash
node /home/node/.claude/skills/tavily-search/scripts/search.mjs "query"
node /home/node/.claude/skills/tavily-search/scripts/search.mjs "query" -n 10
node /home/node/.claude/skills/tavily-search/scripts/search.mjs "query" --deep
node /home/node/.claude/skills/tavily-search/scripts/search.mjs "query" --topic news
```

## Options

- `-n <count>`: Number of results (default: 5, max: 20)
- `--deep`: Use advanced search for deeper research (slower, more comprehensive)
- `--topic <topic>`: Search topic - `general` (default) or `news`
- `--days <n>`: For news topic, limit to last n days

## Extract content from URL

```bash
node /home/node/.claude/skills/tavily-search/scripts/extract.mjs "https://example.com/article"
```

Notes:
- Tavily is optimized for AI - returns clean, relevant snippets
- Use `--deep` for complex research questions
- Use `--topic news` for current events
