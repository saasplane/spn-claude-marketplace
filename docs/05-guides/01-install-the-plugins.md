<!-- spn:doc
{
  "id": "spn-claude-marketplace-install-the-plugins",
  "title": "Install the Plugins — And Prove They Loaded",
  "lenses": ["SERVER_DEV", "WEB_DEV", "ARCHITECT", "INFRA"],
  "status": "DONE",
  "summary": "Putting the plugin set into a workspace from a directory or from git, the refresh that actually replaces the installed bytes, and the checks that tell you which version a session is really running.",
  "keywords": ["install", "plugins", "marketplace", "agent-sync", "scope", "cache", "refresh", "verify"]
}
-->

# Install the Plugins — And Prove They Loaded

`For: Backend developer · Web developer · Architect · DevOps / SRE` · `Status: ✅ DONE`

By the end of this you have the plugins your repository declares, installed, current with their source, and proven. The proving is the part worth your attention. **A session that carries no plugin looks exactly like a session that carries all of them** — no error, no warning, nothing. So the last section here is not a formality.

Everything below is a terminal command. Run the `claude plugin` ones **from the workspace root**, because the install is recorded against the directory you ran it in.

## Step 1 — know which source you are installing from

A marketplace is either a folder on your machine or a repository you fetch, and which one you have decides almost everything that follows.

| Source | You are a | What installs |
| --- | --- | --- |
| a **directory** on this machine | builder | the checkout beside its siblings — your own edits |
| a **git repository** | partner | the published marketplace, fetched over the network |

Read it rather than assuming it:

```bash
spnutils workspace status
```

The first line names the source. A builder's workspace prints `directory:` and a path; a partner's prints a repository. The same line reports the permission floor beside it.

You can ask the `claude` CLI the same question, and it answers from its own register:

```bash
claude plugin marketplace list
```

## Step 2 — register the marketplace, once

A marketplace is registered before any plugin in it can be installed. **`spnutils workspace init` does this for you** as part of minting a workspace, writing the entry into the workspace's `.claude/settings.local.json`. That is the path to prefer, because it also writes the permission tiers and the plugin union in the same pass.

Registering by hand is the same act, one level lower:

```bash
# from a directory on this machine
claude plugin marketplace add /opt/work/saasplane/code/spn-claude-marketplace

# or from the published repository
claude plugin marketplace add <org>/spn-claude-marketplace
```

`--scope` takes `user`, `project` or `local`, and defaults to `user`. A workspace that is one of several on your machine wants `project`, so the registration travels with the folder rather than with your account.

Before you register a directory you are authoring, you can check that its manifest is well formed:

```bash
claude plugin validate /opt/work/saasplane/code/spn-claude-marketplace
```

## Step 3 — install what the repository declares

**Prefer the CLI command.** It reads `sprepo.json`, derives which plugins that repository loads, installs them, writes the managed instruction block and the generated rules, and reinstalls any plugin that has drifted from its source:

```bash
spnutils repo agent-sync          # this repository
spnutils workspace agent-sync     # every member of the workspace, in one call
```

A repository already installed and matching its source costs one comparison and no install, so running it again is cheap and safe.

### Doing it by hand

Where you want the underlying act — a hook edit you want live in the next window, say — it is an uninstall followed by an install, per plugin:

```bash
claude plugin uninstall spn-core@saasplane --scope project
claude plugin install   spn-core@saasplane --scope project
```

**Sequentially, never in parallel.** The plugins share one installed-plugins register and one settings file, and concurrent installs race over both.

## The traps

Every one of these has cost somebody a day, so they are worth reading before you need them.

| The trap | What actually happens | What you do |
| --- | --- | --- |
| **Declaring is not loading** | `enabledPlugins` in `.claude/settings.json` names what a repository wants. Nothing reads that name and fetches it. Until an install runs, the repository's sessions carry no plugin at all | run the install; a settings file alone never loads anything |
| **Cached is not loaded** | the cache holds every version ever installed, keyed by version, and most of those directories are live for nobody. A directory being present proves nothing | read the live path from the CLI, never from the cache listing |
| **Installed is not enabled** | a plugin can sit installed in the cache and be switched off. `claude plugin list` prints a status per entry, and `claude plugin enable` and `disable` move it | check the status line, not the presence of the folder |
| **`claude plugin update` cannot refresh** | it is version-gated. At the same version it reports that you are already on the latest and copies nothing. An in-place edit to a directory-source plugin moves no bytes | uninstall, then install, at the same version |
| **The scope defaults to `user`** | an uninstall without `--scope project` reports success against a scope holding nothing, and the project install it was meant to clear is still there | pass `--scope project` to the uninstall as well as the install |
| **The cache path carries a version** | the installed path ends in the version, and an uninstalled version can survive beside the live one carrying an orphan marker | never type a cache path with a version in it; ask the CLI which directory is live |

**One edit is live without any of this.** A change to a **hook script** is read on its next run. A skill, an agent brief, a reference file or a change to `hooks.json` waits for an install and a fresh window — so batch those edits and install once, rather than installing after each one.

## Step 4 — prove it loaded

The checks below run in increasing strength — what is declared, what is installed, and whether the installed copy is current.

**What is installed for this directory, at which version, enabled or not:**

```bash
claude plugin list
```

For a precise answer, take the JSON and filter it by the directory you care about — the human listing shows every project on the machine at once:

```bash
claude plugin list --json | node -e \
  'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
     for (const p of JSON.parse(s)) if (p.projectPath === process.argv[1])
       console.log(p.id, p.version, p.enabled ? "enabled" : "disabled", p.installPath);
   })' /opt/work/saasplane/code/spn-claude-marketplace
```

For this repository that prints one line, because it declares `GENERAL` and loads the core plugin alone:

```
spn-core@saasplane 0.7.3 enabled /Users/…/.claude/plugins/cache/saasplane/spn-core/0.7.3
```

**What that installed copy actually contains** — the inventory a session will read, and what it costs in context:

```bash
claude plugin details spn-core@saasplane
```

**Whether the installed copy matches its source.** This is the check that catches the failure nothing else reports. Ask the CLI for the live directory, then compare it against the checkout — so no version is ever typed:

```bash
REPO=/opt/work/saasplane/code/spn-claude-marketplace
LIVE=$(claude plugin list --json | node -e \
  'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
     for (const p of JSON.parse(s))
       if (p.projectPath === process.argv[1] && p.id === process.argv[2]) console.log(p.installPath);
   })' "$REPO" spn-core@saasplane)

diff -rq "$LIVE/" "$REPO/plugins/spn-core/" | grep -v "__pycache__\|\.DS_Store\|\.in_use"
```

Silence means the installed bytes are the bytes you are reading. Any output means the session is running something older than your working tree, and `spnutils repo agent-sync` is what reconciles it.

`__pycache__`, `.DS_Store`, `.git` and `.in_use` are excluded because each exists in one copy for a reason of its own. `.in_use` is the awkward one: the CLI writes it into the installed copy, so a comparison that reads it reports drift on every single run.

## Step 5 — take a fresh window

The order is load-bearing, and reversing it costs you a second reload:

1. every edit you intend to make;
2. the install, once;
3. `spnutils repo agent-sync` or `spnutils workspace agent-sync`, which re-mint the generated rules, the managed instruction block and the permission tiers;
4. one fresh window.

All three of the things step 3 writes are read when a session starts. A window opened before it loads the previous generation, and a half-reloaded session is one where you cannot tell which surface answered you.

---

<!-- book-nav -->
📖 ← [guides](README.md) · ↑ [guides](README.md) · [run the hooks tests](02-run-the-hooks-tests.md) →
