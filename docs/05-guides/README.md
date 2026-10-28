<!-- spn:doc
{
  "id": "spn-claude-marketplace-guides",
  "title": "Guides — spn-claude-marketplace",
  "lenses": ["SERVER_DEV"],
  "status": "DONE",
  "summary": "The guides seat of spn-claude-marketplace — the tasks somebody performs against these plugins: putting them into a workspace, and running the suites that prove them."
}
-->

# Guides — spn-claude-marketplace

`For: Backend developer` · `Status: ✅ DONE`

**How** — this seat answers how to use what was realized.

Task-shaped procedures somebody follows: install, mount, configure, run. A guide carries no id and nothing tests it.

| Guide | The task |
| --- | --- |
| [01-install-the-plugins](01-install-the-plugins.md) | put the plugin set into a workspace, from a directory or from git, and prove which bytes a session is running |
| [02-run-the-hooks-tests](02-run-the-hooks-tests.md) | run the plugins' own suites over the source, and read the behaviour cells a run is allowed to write |

**A guide is named for the task, never for a plugin or a folder.** What a thing *is* belongs to [constructs](../02-constructs/README.md), and what it ships belongs to [capabilities](../04-capabilities/README.md).

