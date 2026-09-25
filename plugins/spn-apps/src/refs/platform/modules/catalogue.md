<!-- spn:restates
{
  "commands": [
    { "path": "spn-claude-marketplace/plugins/spn-apps/src/scripts/tools/module-catalogue.ts", "seen": "0da18274" }
  ]
}
-->
<!-- spn:generated module-catalogue — do not edit inside these markers; `module-catalogue.ts` writes it -->
# The published modules

**This table is generated from the platform repository's own manifests**, and it moves every release. What a module *is* — the contract chain, what you may consume and what you may not reach — is [`modules.md`](modules.md) beside this file. **9 module(s) are published.**

**A module is one subject and as many packages as it has runtimes**, so the rows are by code. A module with a server package and a web package is one module.

| Code | Module | Runtimes |
| --- | --- | --- |
| `CMP` | Compliance & Audit | `MODULE_SERVER` · `MODULE_WEB` |
| `DOC` | Document Storage | `MODULE_SERVER` · `MODULE_WEB` |
| `ENT` | Entity Common Patterns | `MODULE_SERVER` · `MODULE_WEB` |
| `IAM` | Identity & Access Management | `MODULE_SERVER` · `MODULE_WEB` |
| `JOB` | Job Scheduling | `MODULE_SERVER` · `MODULE_WEB` |
| `LNG` | Language & Translation | `MODULE_SERVER` · `MODULE_WEB` |
| `MDM` | Master Data Management | `MODULE_SERVER` · `MODULE_WEB` |
| `NTF` | Notification Delivery | `MODULE_SERVER` · `MODULE_WEB` |
| `ORG` | Organizations | `MODULE_SERVER` · `MODULE_WEB` |

**A code is the module's name everywhere** — in a manifest, in a package folder, and in the estate's own coordinates. Nothing derives a second spelling from it.

<!-- /spn:generated -->
