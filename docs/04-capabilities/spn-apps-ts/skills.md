<!-- spn:doc
{
  "id": "cap-spn-apps-ts-skills",
  "title": "Skills — spn-apps-ts/skills/",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The five TS-stack verb skills — new, implement, review, run, verify — realizing the apps command group's build steps for a SaaS Plane TypeScript repository."
}
-->

# Skills — spn-apps-ts/skills/

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

Planning is deliberately not one of these five: `plan` stays in `spn-core` because the verb is stack-agnostic, and this plugin only supplies the layer its `refs/plan.md` names for the `APPS · TS` combination.

| Folder | Loaded when the ask is about |
| --- | --- |
| `new/` | scaffolding a workspace root, a project of a supported kind, or an app-owned module |
| `implement/` | building, adding, changing or fixing a feature — classifies the requirement and sequences the golden-path steps in `steps/`: contract, service, entry, ui, test, docs |
| `review/` | reviewing a change against the TS standards, or the contract-compatibility gate `implement` closes with |
| `run/` | starting the platform locally, or running its test suites |
| `verify/` | proving work is sound — conformance gates and tests, health checks on a running app, or a destructive clean-reset-and-verify |

**Does not do.** None of these five skills states a rule of its own that is not already in a `providers/apps/ts/` chapter or a check in this plugin's own `hooks/` — a skill sequences steps; a check enforces the pattern the step describes.
