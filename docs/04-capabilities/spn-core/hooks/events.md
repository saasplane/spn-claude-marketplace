<!-- spn:doc
{
  "id": "cap-spn-core-hooks-events",
  "title": "Events — spn-core/hooks/events/",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "The four scripts wired in spn-core's hooks.json, one per runtime moment the Claude Code harness calls into: SessionStart, PreToolUse, PostToolUse, Stop."
}
-->

# Events — spn-core/hooks/events/

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

Every file here is wired to exactly one moment in `hooks.json`, and never called any other way. Each reads the payload the harness hands it, does its own work, and — only where the moment allows a refusal — returns a decision that can stop the call it was fired for.

| File | Fires on | Provides | Proven by |
| --- | --- | --- | --- |
| `orientation.ts` | `SessionStart` | prints the workspace's own orientation — the members read from their own manifests, each one's law and plugin set, every workstream and its state | `hooks/tests/t-orientation.mjs` |
| `pretooluse.ts` | `PreToolUse` (`Read\|Write\|Edit\|Bash\|Grep\|Glob\|NotebookRead`) | the one dispatcher for every check in `checks/` — runs each in one process, keeps the first `deny`, joins every `note` | `hooks/tests/t-pretooluse.mjs` |
| `closed.ts` | `PostToolUse` (`Bash`) | the line a workstream earns when its own `mv` into `closed/` lands, counted from the split plan's own rows | `hooks/tests/t-closed.mjs` |
| `stop.ts` | `Stop` | warns — never refuses — when a turn ends leaving an arc runnable, a `HELD` arc naming no live card, or a handover missing a field | `hooks/tests/t-stop.mjs` |

**Does not do.** No file here enforces a rule directly against the call it fires on except through `pretooluse.ts`'s own dispatch — `closed.ts` and `stop.ts` fire after the fact and can only speak, and `orientation.ts` runs before any tool call exists to judge.
