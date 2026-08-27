#!/usr/bin/env bash
# PreToolUse guard for approach documents. The checks live in doc-check.py so the same
# implementation serves the hook (one file) and the workspace sweep (a tree).
exec python3 "$(dirname "$0")/doc-check.py" --stdin
