<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "The agent loads what the work needs",
      "seen": "8afe8c0e"
    }
  ]
}
-->

# The work map

One row for each kind of work: which skill covers it, which references to read first, where in the repositories the answer to *what already exists* is, and what past corrections taught the row. A skill that already covers a task keeps it, and the row only points. A reference is named by plugin and path (`apps providers/ts/02-naming.md`, `devex workspace/docs/doc-sets.md`) and resolved when it is needed.

**The work map restates the agent chapter's section "The agent loads what the work needs".** The hook reads it when a skill opens, a file of a known kind is written, or a commit or pull request starts, and tells the row once for each kind of work in a window. It never refuses. `spn-devex precedent find "<subject>" --work <kind> --code` searches what is already decided, written or built. When the developer corrects a proposal for something the book, the code or a saved review already answered, `spn-devex workstream correction write` logs it and names the row to amend, and the row's Learned column gets one line.

**A card, a suggestion or a proposal in chat carries one short block.** The card row says it once: each option's code, a few lines for each option, and a Today block only where real code exists and an option changes it, at most about 15 lines in all, only what differs, elided with `...`, with real names and a name not yet defined marked as proposed. Plugin mechanics show as a journey and an outcome, never as code. A diagram follows the figure row.

**A public page states the site's hierarchy and the use case before it proposes an address.** The job-portal, careers-site, ecommerce, marketplace, content-site and directory rows each point at their section of the public chapter in the web app seat.

| Work | Seen when | Skill | Read first | Look in | Learned |
| --- | --- | --- | --- | --- | --- |
| server-contract | skill:spn-apps:implement · write:**/contract/states/*.ts · layer:server-contract | spn-apps:implement | apps providers/ts/02-naming.md · module/README.md · providers/ts/05-code.md | support-contract-ts src/contract/states/global for shared types first; a sibling module's contract/states for the same noun | a boolean reads yes or no, isActive, never a status enum for on and off; an address is SPAddress or SPAddressRegion; a fee that is a percent or an amount is a base plus mtype |
| server-app | write:**/app/services/*.ts · write:**/app/repositories/*.ts · layer:server-app | spn-apps:implement | apps providers/ts/06-service.md · providers/ts/07-data.md | a sibling module's app/services and repositories | — |
| server-entry | write:**/entry/api/*.ts · write:**/entry/queue/*.ts · layer:server-entry | spn-apps:implement | apps module/README.md · providers/ts/09-errors.md | a sibling module's entry/api and entry/queue | — |
| server-data | write:**/migrations/*.ts · write:**/config/*.ts · layer:server-data | spn-apps:implement | apps providers/ts/07-data.md · providers/ts/10-configuration.md | the IAM and MDM migrations and states/migration.ts | — |
| web-module | write:**/entry/ui/**/*.tsx · layer:web-module | spn-apps:implement | apps providers/ts/08-web.md · module/README.md | a sibling web module's entry/ui | — |
| page-design | skill:spn-surface:design · layer:surface | spn-surface:design | surface support/surface/README.md · architecture-names.md · standards-patterns.md | the design system's symbol index for props | — |
| surface-library | — | spn-surface:design | surface delivery-library.md · delivery-showcase.md | the Figma library files | — |
| estate | layer:estate | spn-infra:implement | infra blueprints.md · packages.md · modules.md | the spn-infra and spn-support-infra manifests | — |
| tests | — | spn-devex:test | apps tests.md · providers/ts/13-tests.md | the sibling module's test tree | — |
| preview | skill:spn-devex:ideate · write:**/notes/N*/preview.html · write:**/notes/N*/plan.md | spn-devex:ideate | devex workspace/docs/doc-sets.md · workspace/docs/blocks.md | the pinned code of every construct drawn | every code block carries a Reads line |
| figure | — | artifact-diagramming | devex workspace/docs/blocks.md | a page of the same kind that already carries one | — |
| card | — | spn-devex:ideate | devex workspace/docs/decision-cards.md · agent/lenses.md | every workstream's answered cards and the decisions register | a card or a suggestion about code shows each option as a few lines of code, only what differs |
| doc-page | — | — | devex workspace/docs/doc-sets.md · workspace/docs/blocks.md | the sibling pages of the same set | — |
| book-change | — | spn-devex:develop | devex workspace/workstream.md | the chapter and the ref that restates it | — |
| commit-pr | command:git commit · command:gh pr create | spn-devex:scm | devex function/scm.md | git log of the repository for its message form | — |
| release | skill:spn-apps:release | spn-apps:release | devex function/deliver.md | the repository's last release commit | — |
| workstream | — | spn-devex:execute | devex workspace/workstream.md · workspace/docs/templates/workstream/order-template.md | the workstream's own closed questions | — |
| plugin-change | write:**/packages/plugin-*/src/** | — | devex agent/plugins.md · agent/skills.md | the plugin's own tests and the sibling seat | — |
| public-page | — | spn-surface:design | apps app.md · module/README.md | the public site app's own routes and the nearest built public page | state the site's hierarchy and the use case before the address |
| job-portal | — | spn-surface:design | apps app.md · module/README.md | the hiring module's public reads and the portal's routes | state the site's hierarchy and the use case before the address |
| careers-site | — | spn-surface:design | apps app.md · module/README.md | the careers app's routes and the company's own host | state the site's hierarchy and the use case before the address |
| ecommerce | — | spn-surface:design | apps app.md · module/README.md | the nearest listing and product reads | — |
| marketplace | — | spn-surface:design | apps app.md · module/README.md | the nearest listing and seller reads | — |
| content-site | — | spn-surface:design | apps app.md · module/README.md | the nearest content or help pages | — |
| directory | — | spn-surface:design | apps app.md · module/README.md | the nearest listing and region pages | — |
