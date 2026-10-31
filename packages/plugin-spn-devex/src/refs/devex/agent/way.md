<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/01-purpose/04-way.md",
      "seen": "03e7f9b3"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/03-lenses.md",
      "section": "The ask router",
      "seen": "967a40ca"
    }
  ]
}
-->

# The SaaS Plane way, and the ask router

**Source of truth:** `01-purpose/04-way.md` and the ask router in `02-constructs/01-devex/02-agent/03-lenses.md`.

This index is in every window; a lens file is read only for the task that calls for it, at `refs/devex/agent/lenses/<lens>.md`.

## The way: how SaaS Plane decides

The way states no rule. Each principle points to chapters that do, and it tells you which way the book leans where no chapter has ruled yet. A lens names the principles it carries by number.

1. **Start from what the thing is for, and who it is for**, never from a block at hand or a neighbour's look.
2. **Structure before content, and the construct before the feature**: units, names and grouping first.
3. **The book first, then down**: book, register, repo docs, code, generated, release; a conflict is a register row.
4. **One home for each thing**: declared once and derived, or written by hand and checked against the code.
5. **Contracts first, and a seam wherever technology may move**: a port names no engine.
6. **Dependencies point one way**: what is built on top names nothing below it.
7. **The data decides**: what changes per customer is data read at runtime, never a code path.
8. **Names carry meaning, and a vocabulary is closed**: a set grows by a decision; an old spelling is unknown, not an alias.
9. **Simple beats clever, and deleting beats adding**: every layer, context, check and option is paid for forever.
10. **Fix everything, and keep nothing old**: a standard reaches every file; after release a break is a version and a migration.
11. **Prove it where it ships**: the published artifact and the run that names it, never the tool's word.
12. **Enterprise-ready by default**: security is structure from the first deploy, and evidence comes from working.
13. **Built for the partner who never sees the book**: plugins, CLI and packages explain themselves.
14. **Written for people**: plain words, no idioms, why before what, words that fit what the page is for.
15. **Know the cost before you spend it**: measure the cycle, read once, decide, write once.
16. **The developer decides, and the agent recommends**: a shape, a name, a contract key, a workstream or a publish is theirs.
17. **Take time to do it right**: think in proportion to the cost to undo and the spread; move fast on what is cheap to undo.

## The ask router: one owner for each kind of ask

Read which kind of ask the developer brought, then wear the owning lens, or convene it at a judgment gate. Where a choice shows signs of complexity, `refs/devex/agent/lenses.md` still brings the group of views.

- Is this the right thing to do now, against the goal? → `STRATEGY`
- Should we build this, now, and how big? → `LEAD`
- Is the paved road still the easiest way? → `LEAD`
- Where does this go, who owns it, and how do I name it? → `ARCHITECT`
- What order should the work run in, and what does each file need? → `ARCHITECT`
- How do I write this contract, service, queue or error? → `SERVER_DEV`
- Does this page meet web standards: accessible, fast, findable, shareable? → `WEB_DEV`
- How do I wire this screen to the service? → `WEB_DEV`
- How do I test this, and is it proven? → `QA`
- How does this run, deploy, scale and recover? → `INFRA`
- What should a person be able to do, and how do we know it worked? → `PRODUCT`
- Will a person finish what they came to do, and where does each thing go? → `UX`
- Does this look right, built as designed? Which unit, prop or token? → `UI`
- What should this page say, to whom, to win them? → `MARKETING`
- How do I word this: a doc, a label, an error, a page? → `VOICE`
- What does a deal need from this, and what will a buyer's review ask? → `SALES`
- Who pays for this, and what does each plan include? → `BUSINESS`
- Will a new user reach first value, and come back? → `GROWTH`
- How do we help a stuck customer without breaking their trust? → `SUPPORT`
- What does this cost to run, per tenant and per feature? → `FINANCE`
- Is this secure enough for an enterprise? → `TRUST`
- What should we measure, and which events does this emit? → `DATA`
- Is the agent in this product safe, evaluated and affordable? → `AI`
- Will this break someone who built on it? → `PARTNER`

A lens file's name is its value in lower case, with `_` as `-`: `SERVER_DEV` is `server-dev.md`.
