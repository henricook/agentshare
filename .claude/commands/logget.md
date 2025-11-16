---
description: Copy the current Claude Code session .jsonl file to the project directory
---

Please copy the current session's .jsonl file to the current working directory using the following bash command:

```bash
PROJECT_DIR=$(pwd | sed "s|/|-|g" | sed "s|^|-|")
LATEST=$(ls -t ~/.claude/projects/${PROJECT_DIR}/*.jsonl 2>/dev/null | head -1)

if [ -n "$LATEST" ]; then
  FILENAME=$(basename "$LATEST")
  cp "$LATEST" "./$FILENAME"
  echo "✅ Session log copied to: ./$FILENAME"
  echo ""
  echo "You can now upload this file to Agent Share at http://localhost:8721"
else
  echo "❌ Error: No session file found for project ${PROJECT_DIR}"
fi
```
