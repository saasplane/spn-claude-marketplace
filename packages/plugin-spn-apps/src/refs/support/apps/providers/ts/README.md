<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/README.md",
      "seen": "5d929e20"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/02-contract.md",
      "seen": "52833ff6"
    }
  ]
}
-->
# The TypeScript stack — the reference realization

**Source of truth:** the foundation's `10-providers/ts/README.md` and the stack contract in `10-providers/02-contract.md`. Read this as the restatement; those chapters govern.

**TypeScript is the stack the rest of the model was proved against.** The Support repository carries the backbone packages and the `spnutils` CLI. The Platform repository carries the platform modules. The book's apps standards say what is true of a node in any language, and this folder says what that means here — the real folder names, the real generators, the real test runners.

**A stack may add context and may never add a rule.** Where a ref here and the stack-agnostic standard disagree, the standard wins and this file is rewritten. No stack invents, renames or re-scopes a closed value such as a kind, a symbol role or a test tier.

## The entries, and the question each answers

**Every stack folder holds the same entries under the same names.** A stack with no capability for one writes the file anyway and says what to do instead, so the folder listing is the coverage rather than a table beside it.

| Ref | The question it answers |
| --- | --- |
| [`01-kinds.md`](01-kinds.md) | which kinds and runtimes this stack realizes, and what it declares in a manifest |
| [`02-naming.md`](02-naming.md) | every layer a name lives in — file, code, contract, package, JSON, SQL |
| [`03-structure.md`](03-structure.md) | the folders a repository, a project and a `src/` interior have |
| [`04-lifecycle.md`](04-lifecycle.md) | the shared commands, realized as nx targets driven by pnpm |
| [`05-code.md`](05-code.md) | ordinary code — the patterns a reviewer expects in any file |
| [`06-service.md`](06-service.md) | the canonical service: authorization, transactions, cache, queues, audit |
| [`07-data.md`](07-data.md) | persistence — entities, tenant scoping, indexes and migrations |
| [`08-web.md`](08-web.md) | the canonical component, hook and screen |
| [`09-errors.md`](09-errors.md) | how an error is raised, and how a log is written |
| [`10-configuration.md`](10-configuration.md) | how configuration and environment are read |
| [`11-generation.md`](11-generation.md) | what is generated, and which command regenerates it |
| [`12-toolchain.md`](12-toolchain.md) | what builds, links and lints it |
| [`13-tests.md`](13-tests.md) | which runner per tier, and where a case lives |
| [`14-libraries.md`](14-libraries.md) | the published packages a node may depend on — the list, generated |
| [`15-conformance.md`](15-conformance.md) | what this stack must prove, and where the response lives |

**`14-libraries.md` is the one entry that differs from the book's.** The book states the rule for how a stack distributes libraries; this folder carries the list a partner installs. The ref says so at its top.

## Where to start

**Find the node's kind first**, because everything else derives from it — the runtime, the folders, what it publishes, the tiers it owes and the commands it answers. Read `01-kinds.md`, then the entry that matches the layer you are about to touch.
