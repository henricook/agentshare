---
description: Export and upload the current Claude Code session to Agent Share service
---

Please upload the current session to Agent Share using the following bash command:

```bash
PROJECT_DIR=$(pwd | sed "s|/|-|g" | sed "s|^|-|")
LATEST=$(ls -t ~/.claude/projects/${PROJECT_DIR}/*.jsonl 2>/dev/null | head -1)
URL="${AGENT_SHARE_URL:-http://localhost:8721}"

if [ -n "$LATEST" ]; then
  echo "Uploading session to Agent Share..."
  RESPONSE=$(curl -s -F "file=@${LATEST}" "${URL}/api/upload")

  if echo "$RESPONSE" | grep -q "\"success\":true"; then
    SHARE_URL=$(echo "$RESPONSE" | grep -o "\"url\":\"[^\"]*\"" | cut -d'"' -f4)
    echo ""
    echo "✅ Session uploaded successfully!"
    echo ""
    echo "Shareable link: $SHARE_URL"
    echo ""
  else
    ERROR=$(echo "$RESPONSE" | grep -o "\"error\":\"[^\"]*\"" | cut -d'"' -f4)
    echo "❌ Upload failed: ${ERROR:-Unknown error}"
  fi
else
  echo "❌ Error: No session file found for project ${PROJECT_DIR}"
fi
```

**Configuration:**
- Set `AGENT_SHARE_URL` environment variable to use a different Agent Share instance
- Default: `http://localhost:8721`
