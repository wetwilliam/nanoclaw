---
name: send-file
description: Send a file (PDF, Word, Excel, PowerPoint, image, or any format) to the user via the chat channel. Use whenever the user asks you to send, share, export, or deliver a file.
---

# Sending Files to the User

Write a JSON IPC message to deliver a file from your workspace to the user's chat.

## Quick start

```bash
# Always read the chatJid from the file — never hardcode it
CHAT_JID=$(cat /workspace/ipc/chat_jid)

echo "{
  \"type\": \"file\",
  \"chatJid\": \"$CHAT_JID\",
  \"filePath\": \"/workspace/group/output/report.pdf\",
  \"caption\": \"Here is your report\"
}" > /workspace/ipc/messages/file_$(date +%s%3N).json
```

## How it works

1. Save the file anywhere under `/workspace/group/` (the only persistent, writable area)
2. Read the correct chat JID from `/workspace/ipc/chat_jid` (authoritative — never guess it)
3. Write a JSON file to `/workspace/ipc/messages/<unique-name>.json`
4. The host picks it up within ~1 second and delivers it to the user

## IPC message format

```json
{
  "type": "file",
  "chatJid": "<value from /workspace/ipc/chat_jid>",
  "filePath": "/workspace/group/<path-to-file>",
  "caption": "Optional caption shown with the file"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `type` | yes | Must be `"file"` |
| `chatJid` | yes | Read from `/workspace/ipc/chat_jid` — **never hardcode** |
| `filePath` | yes | Must start with `/workspace/group/` |
| `caption` | no | Short description shown under the file |

## Supported formats

| Type | Extensions | Delivered as |
|------|-----------|--------------|
| Images | jpg, jpeg, png, gif, webp | Photo (with thumbnail) |
| Documents | pdf, docx, xlsx, pptx, csv, zip, txt, and all others | Document (downloadable) |

## Full example: generate and send a PDF

```bash
# 1. Generate the file
mkdir -p /workspace/group/output
# ... write the file ...

# 2. Read the authoritative chat JID
CHAT_JID=$(cat /workspace/ipc/chat_jid)

# 3. Send it
echo "{
  \"type\": \"file\",
  \"chatJid\": \"$CHAT_JID\",
  \"filePath\": \"/workspace/group/output/report.pdf\",
  \"caption\": \"Monthly report\"
}" > /workspace/ipc/messages/file_$(date +%s%3N).json
```

## Notes

- **Always** use `$(cat /workspace/ipc/chat_jid)` for the chatJid — never hardcode a JID or user ID
- The file must exist at `filePath` when the IPC message is picked up (~1 second)
- Files are sent once and not deleted — clean up `/workspace/group/output/` if needed
- Only files under `/workspace/group/` are allowed; paths outside are blocked for security
- Use `mcp__nanoclaw__send_message` to notify the user before starting long file generation
