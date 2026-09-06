---
name: provision
description: How infrastructure appears for development - the layer order, what each layer owns, what is read from the declarations, and which operations are destructive. Use when bringing up or tearing down a local stack, registering an app, or diagnosing why something will not start. Stack-agnostic; driven by the repo's own manifests and pins.
---

# provision — layers, in order, from the declarations

**Nothing about a local stack is hardcoded by the caller.** Ports, hosts, schemas, and modules are read from the declarations the repo pins. That is what makes the same verbs correct in every repo, and it is why a command that assumes a port is a bug even when it happens to work.

## The layers come up in order

| Layer | Scope | Owns, locally |
| --- | --- | --- |
| **organization** | once per machine | the machine's trust bootstrap — the local certificate authority, its one trust prompt, the shared ingress |
| **platform** | once per platform | the platform's container group — the shared data and messaging engines the declaration names, and each installed module's local rendering |
| **environment** | — | **cloud only.** The machine is one environment, so no local form exists and targeting it locally is refused by name |
| **app** | per service or web app | schemas, per-schema roles, a local certificate, a hosts entry, an ingress vhost — read from the app's `spkind.json` and env against the pinned platform |

The layers are nouns — each has `plan`, `up`, `down`, and `status`; the app has `up` and `down`. Bring them up in order; a lower layer that is missing is the usual reason a higher one will not start — locally `up` converges the prerequisites below it in place. The app layer registers an app against the platform stack — it runs no containers of its own.

## A hosted vendor is a module, not a lifecycle of its own

**There is no vendor verb.** A vendor you *run* is a module (`infra-module-{code}`, named by purpose, never by product) whose local rendering is a container in the platform layer's group. It appears because the platform declaration carries its row, comes up with the platform layer, and its footprint leaves when the row does. A vendor reached over the network is application configuration behind a support seam — the estate never sees it.

## Destructive operations

**A `--clean` teardown wipes the state that layer holds, and a local stack is frequently shared with other work on the same machine.** So:

- It runs **only on an explicit instruction**, never as an inferred step toward something else.
- It runs against a **named target**. If the request did not name one, ask — this app, this platform, or all — rather than choosing.
- It runs **after** the code is known good. Regenerate and build to green first; resetting onto broken code wastes the whole cycle and produces a failure that says nothing.

## Diagnosing

Work down the layers, not across the symptoms:

1. Is the layer below up, and does its own status verb report healthy?
2. Does the declaration actually carry what you expect — the port, the schema, the host?
3. Is the value it needs set at all — a provider credential or a module fact in the machine seat, `~/.spnenv`? Test that the key is **set**, and never print or expand it (`refs/cross-repo.md` § The machine seat).
4. Was the app layer ever registered for this app?
5. Is something already holding the port — a stale watch process or a previous run?
6. Only then look at the application's own logs.

Most failures that look like application errors are a layer that is not up or an app that was never registered.

## The lines that hold

- **Read the manifest; never assume a value.** Two repos on the same platform do not share ports, hosts, or schema names.
- **Certificates and hosts are provisioned, not hand-edited.** A hand-added host entry survives until it silently disagrees with the generated one.
- **Provisioning starts things; it does not prove them.** Report what is up and on which hosts, then hand to the verify skill for health checks. Do not claim a stack works because it started.
- **Leave the machine as you found it** unless told otherwise — stop what you started, and never leave a debug-mode service running for someone else to discover.

## Lenses

Wear `refs/lenses/infra.md` throughout — a resource that is not declared in a manifest, or a name typed by hand, is the finding to raise before anything comes up.

