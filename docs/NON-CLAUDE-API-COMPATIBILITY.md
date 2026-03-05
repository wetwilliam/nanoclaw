# Non-Claude API Compatibility — Observations & Strategy

Recorded after debugging session on 2026-03-05 with NVIDIA NIM proxy (kimi-k2).

---

## Problem Summary

When routing through a non-Claude API endpoint (OpenRouter, NVIDIA NIM, local proxy),
the Claude Agent SDK accumulates **thinking / redacted_thinking blocks** in the session
transcript. These blocks are Claude-specific content types. Most third-party endpoints
reject them with a `422 Unprocessable Entity` error once they appear in the conversation
history being replayed to the API.

The rejection body (~268K chars) was returned as the agent's result text, and the
Telegram router split it into ~22 messages before any guard existed.

---

## Root Cause Chain

```
proxy returns thinking blocks in response
        ↓
SDK stores them in session transcript (.jsonl)
        ↓
next turn: SDK replays full history → API sees thinking block at messages[N]["content"]
        ↓
422: "Input should be a valid string" (array content not supported)
        ↓
SDK treats 422 as result text → orchestrator sends raw error body to Telegram
        ↓
268K chars → Telegram splits into ~22 messages (flood)
```

### Why thinking blocks appear even with a non-Claude model

The proxy at `172.17.0.1:8082` ("free-claude-code redirect") appears to call an
actual Claude model behind the scenes and return its raw response including thinking
blocks, even when `CLAUDE_MODEL=moonshotai/kimi-k2` is set. The SDK faithfully stores
whatever the API returns into the session transcript.

### Session length threshold

The error tends to appear after the session grows long enough that thinking blocks land
at a message index the API has not previously seen (e.g. message 13 in session 1,
message 375 in session 2). Shorter sessions or fresh sessions work fine initially.

---

## Fixes Applied (2026-03-05)

### 1. Set CLAUDE_MODEL in .env
```
CLAUDE_MODEL=moonshotai/kimi-k2
```
- Prevents `isClaudeModel = true` (which was the default when unset)
- Enables the non-Claude fallback path in agent-runner (captures last assistant text
  when `result=null`)

### 2. Clear stale sessions manually
Sessions that accumulated thinking blocks were deleted from the DB:
```js
db.prepare('DELETE FROM sessions WHERE group_folder = ?').run('main');
db.prepare('DELETE FROM sessions WHERE group_folder = ?').run('channel');
```
Each group starts a fresh session on next message.

### 3. API error guard in orchestrator (`src/index.ts`)
In the streaming output callback, detect `API Error: 4xx` at the start of result text:
- Send a short user-facing notice (1 line) instead of the raw error
- Call `deleteSession(group.folder)` + `delete sessions[group.folder]`
- Set `outputSentToUser = true` and return early (no flood)

### 4. CLAUDE.md warning for vault git operations
Added a warning block to `groups/main/CLAUDE.md`:
> Do NOT run git operations from `/workspace/project/groups/main/...` (read-only).
> Always use `/workspace/group/notebooks-obsidian-vault/` (read-write).

---

## Remaining Risk

The guard in step 3 handles the symptom. The root cause (thinking blocks in session)
will recur — typically after 20–60 turns depending on how often the proxy includes
thinking in responses. Each time it hits, the guard now:
1. Sends one clean error message instead of flooding
2. Auto-resets the session so the next user message works immediately

### Long-term improvement options

| Option | Effort | Effect |
|--------|--------|--------|
| Configure proxy to disable extended thinking | Low (proxy config) | Eliminates root cause |
| Strip thinking/redacted_thinking blocks from session transcript before each API call | Medium (agent-runner) | Eliminates root cause without proxy changes |
| Auto-rotate session every N turns (e.g. 50) | Low | Prevents accumulation, adds compaction overhead |
| Detect thinking blocks in session on startup and pre-clear | Low | One-time cleanup on restart |

### Recommended next step

Strip thinking blocks in agent-runner before replaying history. The SDK passes the
full session transcript as context. A pre-processing step that removes any content
blocks with `type: "thinking"` or `type: "redacted_thinking"` from the messages array
would make the session replay safe for any endpoint, without needing proxy changes or
session rotation.

---

## Quick Diagnostic Commands

```bash
# Count thinking blocks in a session transcript
grep -c "thinking" /home/ubuntu/nanoclaw/data/sessions/main/.claude/projects/-workspace-group/<session-id>.jsonl

# Check current active sessions
node -e "
const db = require('./node_modules/better-sqlite3')('./store/messages.db');
console.log(db.prepare('SELECT * FROM sessions').all());
"

# Clear a session to force fresh start
node -e "
const db = require('./node_modules/better-sqlite3')('./store/messages.db');
db.prepare('DELETE FROM sessions WHERE group_folder = ?').run('main');
"

# Tail live logs
tail -f logs/nanoclaw.log | grep -E "API error|session|output"
```
