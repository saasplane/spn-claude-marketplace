<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/01-kinds.md", "seen": "98cf44d1" }
  ]
}
-->
# Kinds — what this stack realizes, and what it derives

**Source of truth:** the foundation's `10-providers/ts/01-kinds.md`. Read this as the restatement; that chapter governs.

**This stack joins at the server, the web and the universal runtime.** That is its coverage, and kinds exist only for the runtimes a stack covers. A kind you find here that the model does not hold is a defect rather than an extension.

**Declare one fact about a node — its kind — and derive the rest.** The runtime, the workspace folder, the tsconfig base, what it publishes, its structure profile and its test tiers all follow from it. Scaffolding, structure validation and capability extraction read one profile table, so they cannot disagree about what a kind means.

**Read the kind model itself in [`../../shape.md`](../../shape.md).** This ref carries only what TypeScript adds to it.

## The registry

| Kind | Runtime | Folder | Name grammar | Publishes | Barrel |
| --- | --- | --- | --- | --- | --- |
| `TOOLCHAIN` | universal | `packages/` | `toolchain-ts` — one per stack | files, consumed by path | none |
| `SUPPORT_UNIVERSAL` | universal | `packages/` | `support{-usecase}-ts` | a library | generated |
| `SUPPORT_SERVER` | server | `packages/` | `support-server{-usecase}-ts` | a library | generated |
| `SUPPORT_WEB` | web | `packages/` | `support-web{-usecase}-ts` | a library | generated |
| `MODULE_SERVER` | server | `packages/` | `module-server-{mod}-ts` | a library | generated |
| `MODULE_WEB` | web | `packages/` | `module-web-{mod}-ts` | a library | generated |
| `APP_SERVER` | server | `apps/` | `service-{usecase}-ts` | nothing — deploys as an image | none; `src/index.ts` boots it |
| `APP_WEB` | web | `apps/` | `web-{usecase}-ts` | nothing — deploys as an image | none; `src/index.tsx` boots it |
| `APP_UTILITY` | server | `apps/` | `utility{-usecase}-ts` | a library and a binary — installed, never deployed | none; `src/index.ts` is the executable |
| `CLIENT_API` | universal | `packages/` | `client-{usecase}-api-ts` | a library | hand-written over `src/generated/` |

**The family leads the name, and the runtime follows it.** Standing on a folder name you know the kind before opening anything, and the sort order groups the family rather than the use case.

**A superseded spelling is an unknown value, never a mapped one.** `SUPPORT_NODE`, `CLI` and `API_CLIENT` fail validation exactly as any unrecognized value does.

**A repository root is not a kind.** It declares its world in `sprepo.json` and is named `{usecase}-ts`. A root has no runtime, no source folder, no publish shape and no barrel.

**Never type the `-ts` suffix.** It is realization, appended by tooling, and a code arriving with it is rejected with the reason rather than quietly trimmed.

## What the manifest carries

```json
// spkind.json — the single declaration, at the node's root
{ "kind": "MODULE_SERVER", "config": { "mtype": "MODULE_SERVER", "code": "IAM" } }
```

- **Write `config` as `null` where a kind adds nothing** — `TOOLCHAIN`, every `SUPPORT_*` kind and `CLIENT_API`. Never an empty object.
- **A module kind carries its mnemonic; an app kind carries its app code.** Declare nothing else, because nothing else is underivable — not the runtime, the folder, the publish shape, the barrel, the tiers or the stack.
- **The manifest replaces any `saasplane` key in `package.json`.** Two places declaring one fact will drift, and a module living inside an app has no package file at all.
- **Name and folder are checked against the declaration, never used to infer it.** A `MODULE_SERVER` named `service-…`, or sitting in `apps/`, is a visible defect.

## What a kind decides beyond the tree

**`app/` publishes `app/entities/` and `app/utils/` and nothing else**, at every kind carrying module layers. Entities travel so a repository can express a declared cross-schema join; utils travel because a pure function exposes no interior. A leading underscore marks privacy at every level in every kind.

**A `MODULE_WEB` puts its surface under `entry/ui/`.** Only `SUPPORT_WEB` carries `ui/` at the source root, because there the UI is the published surface rather than a module's adapter to it.

**Every publishable kind emits a symbol index at build except `CLIENT_API` and `TOOLCHAIN`.** A generated client's types already are its index, and a toolchain publishes files consumed by path rather than an importable surface.

## Versioning

**Versions are lockstep inside a repository and independent across repositories.** Every publishable project releases at one version, and the source carries none of it.

- Keep a **placeholder version** in `package.json`; the real number is stamped at publish.
- Use the **workspace protocol** for internal dependencies, rewritten to the stamped version on publish.
- A consuming repository **pins** the published version rather than tracking a range.

So a release touches no manifest in git, and what the repository holds is the code rather than the code plus a number.

## Which seams a kind may name

**Never name a seam from outside your own dependency set** — a checker can see that defect. The permitted set is the dependency graph read back rather than a policy somebody maintains.

| Kind | Seams its pseudologic may name |
| --- | --- |
| `TOOLCHAIN` · `SUPPORT_UNIVERSAL` · `CLIENT_API` | none |
| `SUPPORT_SERVER` · `SUPPORT_WEB` | the universal support family |
| `MODULE_SERVER` | the universal and server support families, plus the platform's shared kernel |
| `MODULE_WEB` | the universal and web support families, plus the platform's UI kernel and the service's generated client |
| `APP_SERVER` · `APP_WEB` | every support package of its runtime, plus the modules it composes |
| `APP_UTILITY` | the universal and server support families |

**What a seam entry owes the consumer that names it**: the guarantee it makes, where it is placed, and what it takes from context. Then what it explicitly does not do, the phrase a consumer should use for it, and the test that proves it.

## Scaffolding

**`spnutils apps scaffold <target>` accepts every kind above, plus the targets that are not kinds.** `app-module` writes a module folder inside an application, which still carries its own `spkind.json`. `repo` mints the workspace root itself.

**`apps scaffold` and `apps validate` read one profile.** Scaffold writes the tree a kind prescribes; validate reads it back through the same selector and takes none of scaffold's values. A check you add to the profile reaches both commands at once.

**A template file carries the suffix `.tmpl` and is written out without it.** A dotfile template carries the prefix `dot-` and is written out as `.`, because npm strips a literal `.gitignore` from a published tarball. Both spellings belong to this stack.

**You add a template when you add the kind it scaffolds, never before.** Coverage decides which templates a stack owns, so a stack joining with no web runtime needs none for the web kinds.

## What each kind contributes to the repository's docs

**A node carries a `README.md` and no docs tree.** The repository has one, and this is what a kind writes into it.

| Kind | Constructs | Behaviours | Capabilities |
| --- | --- | --- | --- |
| `TOOLCHAIN` | one construct: the paved road | what a developer never has to decide | one mirror per published configuration group |
| `SUPPORT_*` | one construct per seam — its guarantee and its refusals | rows for a developer, an operator and a partner | one mirror per source folder that earns one |
| `MODULE_SERVER` · `MODULE_WEB` | the domain's constructs, never one per contract state | area files for that domain | mirrors under the domain's server or web half, plus `data-model.md` and `schema.sql` where it owns storage |
| `APP_SERVER` · `APP_WEB` | nothing of its own | the rows for arriving, leaving and getting lost | one mirror naming what it mounts |
| `APP_UTILITY` | one construct per command group | rows for whoever types the command | mirrors of `contract/`, `app/` and `entry/` |
| `CLIENT_API` | nothing | nothing | nothing — a generated surface is documented by the service that generates it |

**A node `README.md` reads the same in every kind**: about twenty-five lines saying what this node is, with links into the seats it realizes, and none of the book's house words.

## Proof

**Run `spnutils apps validate`.** It walks every project and reports where one disagrees with what its own kind requires. It does not audit configuration files, because those are realization and the standard governs folders.
