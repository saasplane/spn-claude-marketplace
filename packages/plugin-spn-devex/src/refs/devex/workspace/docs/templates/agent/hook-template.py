# RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md § Restatement discipline · docs/04-capabilities/02-support/01-apps/07-comments/README.md § The check, and what each finding costs
#      This file carries rules it does not own. The chapter above is the source of truth.
#      A rule change is edited there first, then here, in the same change. Never add a rule here.
#      restate-drift.ts reports this copy when its source moves.

#!/usr/bin/env python3
"""{{hook-name}} — {{what it checks, in one sentence}}.

Event: {{PreToolUse | PostToolUse | SessionStart | Stop}} · Tools: {{Edit, Write, Bash}} · Files: {{the pattern it reads}}
Grades: BLOCK (refused, no override) · RULE (refused; the message names the rule and the fix) · SOFT (reported, not refused)
Known-bad test: `python3 {{hook-name}}.py --test` runs the check against a sample it must refuse and one it must pass;
a hook that has not failed on its known-bad input is not trusted. Copied from hook-template.py.
"""
import json, re, sys

RULE = "{{RD.X.NNN}} — {{the rule, in one line}}"

def check(text: str, path: str) -> list[dict]:
    """Return findings as {grade, line, message}; never edit the file."""
    findings = []
    for n, line in enumerate(text.split("\n"), 1):
        if re.search(r"{{pattern}}", line):
            findings.append({"grade": "RULE", "line": n, "message": f"{RULE}: {{what to change}}"})
    return findings

def main() -> int:
    payload = json.load(sys.stdin)                      # the tool input the harness hands a hook
    path = payload.get("tool_input", {}).get("file_path", "")
    text = payload.get("tool_input", {}).get("content") or payload.get("tool_input", {}).get("new_string") or ""
    if not re.search(r"{{file pattern}}", path):
        return 0
    findings = check(text, path)
    for f in findings:
        print(f"[{f['grade']}] {path}:{f['line']} {f['message']}", file=sys.stderr)
    return 2 if any(f["grade"] in ("BLOCK", "RULE") for f in findings) else 0

if __name__ == "__main__":
    if "--test" in sys.argv:
        bad = "{{a line the check must refuse}}"; good = "{{a line it must pass}}"
        assert check(bad, "x") and not check(good, "x"), "known-bad test failed"
        print("known-bad test passed"); sys.exit(0)
    sys.exit(main())
