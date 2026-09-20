<!-- spn:doc
{
  "id": "cap-spn-infra-skills",
  "title": "Skills — spn-infra/skills/",
  "lenses": ["INFRA", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "The four estate verb skills — declare, plan-review, module-author, release — realizing the infra command group's layer model for a SaaS Plane estate repository."
}
-->

# Skills — spn-infra/skills/

`For: DevOps / SRE · Architect` · `Status: 🔮 PLANNING`

| Folder | Loaded when the ask is about |
| --- | --- |
| `declare/` | a change to what the estate IS — an environment, an app grant row, a module row, a region, a schema, a size, a hosting or a deploy trigger — done as a manifest edit |
| `plan-review/` | reviewing an `infra <layer> plan [--cloud]` output before any `--approve` — what a plan must name, what it must never contain |
| `module-author/` | authoring an estate module end to end — scaffold, renderings, the path locator, proving, releasing, the pin flip |
| `release/` | publishing an estate package — bumping `spinfrapkg.json`'s version, running the release verb, publishing to the org's registry pair or staging locally |

**Does not do.** None of these runs a cloud mutation directly — each names the `infra` verb that does, and the estate-caution rule that cloud mutation runs only through the CLI's own doors stays this plugin's, restated rather than bypassed.
