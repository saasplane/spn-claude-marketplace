<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/01-devex/04-workspace/03-repos.md", "seen": "b916cef1" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/03-repos/01-repos.md", "seen": "2e790690" }
  ]
}
-->

# Repositories — What One Declares, and What Each World Grants

What a repository declares about itself, which manifests carry identity, how a package reference resolves, and what shape each world's root carries. Apply this in any stack and in any repository. Source of truth: the foundation's `02-constructs/01-devex/04-workspace/03-repos.md` and `04-capabilities/01-devex/04-workspace/03-repos/01-repos.md`. Where this restatement and those disagree, the sources win and this file is regenerated.

## One declaration decides everything that follows

**A repository carries one manifest at its root, `sprepo.json`, and that manifest names its world.** The world is not a label for humans to read — it decides which kinds of node may exist below the root, which command families work inside it, and which rules you apply to a file you open there. The same command can be correct in one world and refused by name in another.

```ts
export enum SPRepoType {
  FOUNDATION = 'FOUNDATION',  // states the standards — the book and the providers, no runtime
  APPS = 'APPS',              // realizes them — its nodes declare a kind, and `apps` commands act
  INFRA = 'INFRA',            // provisions for them — its nodes declare an estate type
  GENERAL = 'GENERAL',        // no nodes and one docs tree; `apps` and `infra` refuse it by name
}

export interface SPRepo {
  type: SPRepoType;             // the world, and the whole of what a tool dispatches on
  name: CDTString;              // what a person calls this repository — declared, never taken
                                 //   from the folder a checkout happens to sit in
  config: SPRepoConfig | null;  // the claims; null in every world but APPS
}
```

**Each world is defined by what it grants, never by what it withholds.** A world defined by what it lacks cannot tell two repositories apart when both lack the same thing for different reasons — it is an absent decision wearing a value's clothes. Defining a world by its grants gives every command a by-name answer instead of a fallback.

**The declared `name` is a fact of its own, never the checkout's folder name.** A checkout can be renamed, cloned twice, or nested under a path nobody chose, so read the declared name — it is the readable half of every place a document says where it came from.

## The worlds, and what each one grants

| World | What it is | What its nodes declare |
| --- | --- | --- |
| `FOUNDATION` | **states** the standards — the book, and the providers that realize it | nothing; the root itself is the corpus |
| `APPS` | **realizes** them as one repository holding a stack's projects | an apps node manifest, naming one of the declared kinds |
| `INFRA` | **provisions** for the stacks — an estate, or the shared material behind one | an estate node manifest, naming one of the estate types |
| `GENERAL` | grants **no nodes and one docs tree**; it answers to no stack | nothing beneath it declares a kind |

**A general repository is the one worth reading twice.** The `apps` and `infra` command families refuse it by name rather than failing through to a default. What you manage there is the docs tree and the repository's own files. Its source may be laid out any way at all, and it may carry no conventional source or test folder — the documentation still mirrors whatever the source **is**, and the face declares where that root is rather than assuming one.

## Why a general repository is a value, not a missing file

**Before this value existed, a repository with no manifest was handled by each reader's own catch.** The orientation printed "no claim," the documentation generator defaulted to "not the foundation," the status command said "no law." That is one fact restated once per reader, and a stale restatement describes a repository wrongly.

**Absence cannot tell two things apart.** A repository nobody has declared yet and a repository deliberately holding nothing but documents read identically from outside.

**Absence is still the right signal in exactly one place: access control.** A repository you were not given is genuinely not there. It is the wrong signal for a repository sitting in your workspace with an opinion about itself — with a value it could have declared, forgetting to declare is a finding again.

## Three manifests carry identity, each read by exactly one system

| File sits at | Answers | Read by |
| --- | --- | --- |
| every repository root, alone (`sprepo.json`) | which world this repository is, and its claims | the rulebook dispatch, an agent's descent, and which commands exist here |
| an apps node's root (`spkind.json`) | what this node **is** in the apps domain | the kind system, and nothing else |
| an estate node's root (`spestate.json`) | what this node **is** in the estate domain | the estate, and nothing else |

**No system reads another system's file.** That is what lets a new domain arrive as one world value plus its own manifest family, with nothing existing touched. **Roots are never nodes** — a repository root carries its own manifest and nothing else that identifies it, and every node beneath it self-declares. You never find a second repository manifest further down.

**The packaging manifest, `spinfrapkg.json`, is not a fourth identity file.** It shares the family's naming and is easy to mistake for one. The release and reference-resolution machinery reads it, nothing else does, and it never decides what a node **is** — it says what an artifact publishes. The one word it shares with the others is `version`: inside a package reference it is what a pin resolves to; inside the packaging manifest it is the artifact's own number. Same word, same fact, wherever you meet it.

**The file's own name says which system owns its values.** No value inside any of these files carries a system prefix, because you already know which system a value belongs to from the file it sits in.

## What an apps repository claims, and what it is coupled to

Only an apps repository carries claims. Every other world writes its configuration as `null`, because there is nothing there for a claim to be about.

```jsonc
// an apps repository that deploys
{ "type": "APPS", "name": "Platform",
  "config": { "mtype": "APPS", "stack": "TS",
    "infra": { "organization": { "package": "@spn/infra-organization",  "version": "1.2.0" },
               "platform":     { "package": "@spn/infra-platform-dmo", "version": "0.3.0" } } } }

// an apps repository that only builds — the organization coupling is never optional
{ "type": "APPS", "name": "Support",
  "config": { "mtype": "APPS", "stack": "TS",
    "infra": { "organization": { "package": "@spn/infra-organization", "version": "1.2.0" },
               "platform": null } } }

// the estate repositories and the foundation
{ "type": "INFRA",      "name": "Estate",     "config": null }
{ "type": "FOUNDATION", "name": "Foundation", "config": null }
```

Two different things sit in that configuration, and confusing them is the common mistake. The **stack claim** says which language ecosystem this repository builds in, and the organization's own declaration is what grants it. The **couplings** are package references. The organization reference is always required, because the stack's grant and the registry wiring both resolve through it. The platform reference is a coupling and **never a grant** — naming a platform gains no right to deploy. Writing it as `null` states exactly that nothing here deploys.

**There is no demand file.** Nowhere in a code repository do you write what the estate must give you, because a grant belongs where it is reviewed. The join a deployable node depends on is three-sided: the node claims its code, the repository claims its platform, and the estate row grants the pair.

## One grammar for every package reference

```ts
export interface SPRepoPackageRef {
  package: CDTString;          // starting with `@` means published; anything else is a path
  version: CDTString | null;   // the semantic version when published, null for a path
}
```

The locator carries the whole meaning. A name beginning with the scope marker is **published**, and `version` is a required version number. Anything else is a **path** to a node in a sibling checkout, and `version` is ignored and written `null`. There is no prefix distinguishing the two, because the shape already says which it is.

**Every reference is verified when it resolves**, path or published alike — the role must match the manifest it resolves to, and a platform must name this repository in its own list. A path reference works only where the sibling checkout exists, which is every machine in the standard workspace layout, and deliberately not a pipeline. The day a pipeline needs the pin is the day it gets published.

You change a pin by editing this one file, and the one-line difference is the whole review.

## The shape a root carries, per world

| World | Its root carries |
| --- | --- |
| `FOUNDATION` | the book, authored by hand, and the providers tree with one folder per domain and one per instance beneath it; **no source** |
| `APPS` | the deployable projects, everything else a node may be, the repository's own operations, the journeys that cross projects, and one docs tree — plus the stack's workspace manifest, lockfile and build graph |
| `INFRA` | self-declaring estate nodes, the repository's own operations, and one docs tree; **no workspace manifest, no lockfile, no build graph** |
| `GENERAL` | one docs tree, its manifest, and whatever shape its own work takes |

**Every root shares exactly two things: the manifest and the docs tree.** Nothing else has to agree, because nothing else is shared work — an apps root builds and ships, an estate root provisions, a foundation root publishes, and a general root does whatever it is for.

**Two absences are deliberate.** An apps root carries no estate file anywhere, because the estate is its own repository and is reached only through the reference in the manifest. An estate root carries no workspace manifest, lockfile or build graph, because nothing in it is a language package — each node declares itself instead of joining a shared toolchain root.

**A general root has no canonical folder set at all**, and that follows from its own grant: it declares no nodes, so nothing derives a layout from a kind. What does not vary is the pair — the declaration at the root, and the one docs tree beside it.

**An estate repository's package count is bounded by a rule, not by taste**: at most one organization resolution package per repository, one platform package per platform, and the organization's own modules beside them.

## Documentation follows the same dispatch

A root's documentation seats derive from its world, and a node's from its own manifest — the same dispatch this file has described throughout, applied to one more consumer. A repository that declared one world and carries another's shape is a repository whose declaration nobody is reading.

## What breaks if you skip this

| If you… | Then |
| --- | --- |
| write a config claim in a `FOUNDATION`, `INFRA` or `GENERAL` repository | there is nothing for the claim to be about — write `null` instead |
| infer a repository's world from what you find inside it | you have replaced a declared fact with a guess, and the guess disagrees with the next reader's guess |
| add a second `sprepo.json` beneath the root | roots are never nodes — no system expects to find one there, and nothing reads it |
| write a "demand" file naming what the estate must grant | there is no such file — a grant belongs where it is reviewed, in the estate's own row |
| use a path package reference in a pipeline | it resolves only where the sibling checkout exists, which a pipeline does not have |
| run an `apps` or `infra` command against a `GENERAL` repository | it refuses by name — that repository grants no nodes for the command to act on |
| carry a value from one identity manifest into another | each is read by exactly one system, and a value the wrong system reads means nothing there |
