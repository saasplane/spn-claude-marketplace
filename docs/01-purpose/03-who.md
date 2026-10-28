<!-- spn:doc
{
  "id": "spn-claude-marketplace-who",
  "title": "Who It's For",
  "lenses": ["LEAD", "ARCHITECT", "SERVER_DEV", "WEB_DEV", "QA", "INFRA", "TRUST", "PARTNER"],
  "status": "DONE",
  "summary": "The developers who meet these plugins through their agent, the CLI that installs and syncs them as a machine consumer, the builder who authors them here, and who this repository is not for.",
  "keywords": ["who", "audience", "developer", "spnutils", "builder", "partner", "consumer"]
}
-->

# Who It's For

`For: Engineering leader · Architect · Backend developer · Web developer · Quality engineer · DevOps / SRE · DevSecOps / Security · Partner / integrator` · `Status: ✅ DONE`

Two kinds of reader consume this repository, and only one of them is a person. **Developers meet these plugins through their agent.** And **`spnutils` reads the marketplace as a machine** — it is the CLI that decides which plugins a repository loads, installs them, and keeps the installed copies matching the source. Both consumers are served by the same files, and neither is an afterthought of the other.

## The developer working in a SaaS Plane workspace

You do not read this repository to use it. You install it, and then it is simply how your agent behaves.

That is the shape of the relationship, and it changes what the audience means here. A hook you never invoke answers a write you were about to make. A skill you never open loads because the work matched it. A lens you have not heard of argues a review at a gate. So the thing you notice is not a document — it is that your session already knows your standards.

Every engineering function meets them, because the standards are not a developer's alone. Each behaviour row in [03-behaviors](../03-behaviors/README.md) names the person who does the behaviour. Those people are defined once in [personas](../03-behaviors/personas.md), and they come from the lens register rather than from this repository's imagination.

| You are | What reaches you | Where you meet it |
| --- | --- | --- |
| a **backend or web developer** | the skills, the write-time guards, the orientation a window opens with | on nearly every turn |
| an **architect** | the review panel, the lenses, the plan and ideate skills, the document checks | at a design gate, and when a boundary moves |
| a **quality engineer** | the test skill, the tier ladder it derives, and the rows a run writes back | when you decide what proves something |
| a **DevOps or SRE engineer** | the estate skills, the manifest and naming cards, the guard over an estate write | when you declare or bring up an estate |
| a **security engineer** | the refusals — secrets, account identifiers, estate mutation — and the fact that each one is a decision rather than a crash | when you assure what the tooling allows |
| an **engineering leader** | the release discipline, and the review that is convened rather than remembered | when you want to know which bytes ran |

### Builder or partner — the same plugins, a different checkout

What you hold depends on where you stand — beside the book or outside it — and that is the only difference between the two that matters here.

- A **builder** holds this repository beside the book, as a folder in their own workspace. Their agent installs from that folder, so an edit here is something they can install and feel in the next window.
- A **partner** holds neither. They build on a platform from outside the team that owns it, and they install from the published repository over the network. They report a standard that is wrong rather than editing one, because the copy they hold is replaced by the next install.

A partner is not a reduced audience. Every instrument in the set reaches them, which is exactly why a reference card restates a chapter instead of linking to one — the link would resolve for a builder and dead-end for everybody else.

## `spnutils`, which installs and syncs the set

The second consumer is a program, and it is the one with the closest reading of this repository.

`spnutils` manages plugin installation for a workspace. It registers the marketplace, derives from each repository's `sprepo.json` which plugins that repository loads, installs them, and then keeps them honest: it compares the installed copy against this checkout file by file, and reinstalls whatever differs. That comparison exists because a stale installed copy is invisible — a session missing a whole gate looks exactly like a session that has it.

So the things this repository keeps stable are the things that program reads:

| What it reads | Why it matters to a machine |
| --- | --- |
| `.claude-plugin/marketplace.json` | the list of what is shipped, and the folder each plugin lives in |
| each plugin's `plugin.json` | the name and the version, which is what the installed path is keyed by |
| the plugin folder itself | the tree the installed copy is compared against, entry for entry |

**The version in `plugin.json` cannot find a stale copy on its own.** It names what is published, not what you are editing, so it does not move while you edit, and an edited plugin and its installed copy can carry the same version. So the file-by-file comparison decides a reinstall, not the version. That is the whole reason the sync compares trees instead of trusting a version.

## The builder who works in it

Somebody authors all of this, and that person works here rather than anywhere else. They hold this checkout beside the foundation book, which makes them the only reader able to run the drift checker — the one program that reads across both trees at once. They also carry a habit nobody else has to: every file here that states a rule names the chapter it restates, and the stamp it carries is re-read before a release.

## Who it is not for

- **Not for somebody looking for the standards themselves.** The full argument is the foundation book. What is here is as much of it as a session needs, restated.
- **Not for a team that wants to run SaaS Plane code.** Nothing here is imported or deployed. The packages and modules arrive through granted registries.
- **Not for a repository outside a SaaS Plane workspace.** The plugins assume the manifests, the folder shapes and the vocabulary the rest of the estate declares.

If you install it and your next window simply knows more than your last one, you are the reader this was written for.

---

<!-- book-nav -->
📖 ← [what](02-what.md) · ↑ [purpose](README.md) · [constructs](../02-constructs/README.md) →
