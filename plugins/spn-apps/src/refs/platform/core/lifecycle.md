<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/03-platform/01-core/05-lifecycle.md", "seen": "4369bac3" },
    { "path": "spn-foundation/docs/04-capabilities/03-platform/01-core/05-lifecycle/", "seen": "91ca4e32" }
  ]
}
-->

# Lifecycle

What the platform already gives you: self-serve onboarding with no person required, a tenancy model where reshaping a real customer is an ordinary write, and a governed principal — the operating agent — for acting inside a running platform without a person watching. Do not build a manual onboarding queue, a bespoke merge script that hand-copies rows between organizations, or a service account with ambient access for your own automation — read this before you reach for any of them.

## Onboarding is self-serve by design

A platform whose first step needs a person has a ceiling set by hiring rather than by demand. So build onboarding as a product capability an organization completes itself, the same way you build every other capability on the standard library — never as a queue a human clears by hand.

An arrival that finds somebody the platform already knows is an **outcome**, not a refusal:

```ts
export enum RegistrationOutcomeType {
  CREATED = 'CREATED',                // the organization did not exist, and now does
  EXISTING_FOUND = 'EXISTING_FOUND',  // the platform already knew this arrival, and says so rather than refusing
}
```

Treat `EXISTING_FOUND` as a step in the flow, carried as a state the way a sign-in carries its own — MUST NOT answer a known arrival with a refusal. A platform that does sends somebody back to a form that cannot help them, and leaves the caller guessing whether it met a duplicate or hit a fault. `EXISTING_FOUND` is the member worth building deliberately for: it is easy to wire `CREATED` and skip the found-case entirely, and that is exactly the gap that turns an ordinary re-arrival into a support ticket.

What varies between the create-an-organization and resolve-or-refuse flows is which organization type is created, whose child it is, and whether the person names it — the identity ref carries the stored decision (`OrgSignupModeType`) that says whether a given surface may create one at all. Read that ref before you wire a signup form; the two constructs share this one boundary and disagree nowhere.

## Reshaping is routine, not an exception

Merges, splits and renames happen to real customers, and you build for that rather than treating it as a one-off migration project. An organization's **identity** — never its place in the tree — is what every other construct in this book references, which is why its position can change underneath without anything else needing to be rewritten. That is the payoff of the tenancy rule carried in the Tenancy ref: nothing is keyed to a node's position.

The one thing reshaping cannot make cheap is a promise already made about records. A data policy stays with the tier that made it — retention has no agreed direction, so a merge would produce a promise neither organization made. Read the Data and Trust ref before you write a merge that touches retention or privacy settings.

Reshaping and export are promises this construct makes and, as of this writing, no shipped command yet keeps — onboarding has its own commands and outcomes; a merge, a split and an export do not. If you are asked to build one, you are building new ground rather than wiring an existing capability, and you should say so rather than search for a command that is not there.

Compression changes who performs a step, never whether the guarantee behind it exists. A self-serve signup and a sales-assisted onboarding both end at the same onboarding commands and the same readiness rules — do not build a second, "assisted" onboarding path that skips a check the self-serve path enforces; route both through the same capability and let the difference be who clicks the button.

## Leaving is a supported path

A customer can get its data out and stop paying without asking anybody — build that deliberately, because an export capability that only gets attention once a customer already wants to leave is usually not ready when they need it. Building it deliberately is what keeps the platform a product instead of a trap.

## The operating agent is a principal, and everything follows from that

An **operating agent** acts *inside* a running platform — it answers somebody, executes an instruction, works a channel. This is a different thing entirely from the agent reading this ref to build a platform: that is a devex instrument, and the operating agent is a principal that acts inside the finished product. Keep the two apart when you read "agent" elsewhere in this file.

The operating agent sits on top of the platform's public contracts and never beside them. Every action it takes executes a contract service — the same method an API controller executes for a screen — so it has no private surface, no direct storage access, and no path around a module's contract. Do not give your own automation a private path into storage or a bypass around the contract layer; route it through the same services a screen would call, exactly as the operating agent does.

It acts in one of two modes, and both pass the identical authorization gate:

| Mode | Acts as | Bounded by |
| --- | --- | --- |
| delegated | a real person, inside that person's own session context | that person's own roles — nobody can delegate what they do not hold |
| system | the organization's own machine principal, or a dedicated one | that principal's own granted roles |

Delegated mode is for the conversational surface of everyday work — "get me this data", "do this for me". System mode is for background operation with nobody watching. In both, a sensitive action still demands a fresh proof, and every action still lands on the immutable trail, attributed to whichever principal actually ran it. **A permission nobody granted it is one it cannot use** — do not build a path around that for the sake of convenience.

In both modes, three guarantees hold, and you should expect any operating-agent work to keep all three rather than relax one for convenience:

| Guarantee | What it means |
| --- | --- |
| step-up still gates sensitive actions | an action marked sensitive asks for fresh confirmation before the agent proceeds; in system mode that is a human-approval hold, and an idempotent command is what makes a held one safe to execute later |
| every action lands on the immutable audit trail | attributed to the acting principal, in the organization where it ran — the same attribution test the tenancy model states, unchanged for a person, the system, or an agent |
| tool visibility is permission-scoped per session | an agent session lists only the tools its principal may call; a delegated session lists the intersection with the user's own grants |

**Derive the tool catalog from the contract surface; never author one by hand.** An operating agent's whole view of the platform comes from the same contract surface every other consumer already reaches — a module's own comments describe its tools, and a module's own permissions gate them. Composing a new module into a platform contributes its tools automatically, with nothing agent-specific built inside it. If you write a hand-authored catalog, you have written a second description of the surface, and the second description is the one that stops matching the surface the moment somebody changes the first.

No module suite carries the operating agent yet on the foundation this ref restates — it is planned to arrive as ordinary platform modules, keeping the same shape as every other module: contract, implementation, entries, migrations, independently removable. If asked to build agentic exposure ahead of that module suite, treat it as new ground, and keep it behind the same contract-service and authorization gate every other consumer passes through.

## What this replaces

| If you are about to build | Stop — the platform already has it |
| --- | --- |
| a manual "someone approves this signup" queue | self-serve onboarding, with `RegistrationOutcomeType` carrying the known-arrival case as a state |
| a script that copies rows from one organization to another on a merge | nothing yet ships this — say so, rather than hand-rolling a migration against live tenancy data |
| a service account with a standing API key and broad access, for your own automation | a machine principal, acting under its own granted roles through the ordinary authorization gate |
| a bespoke tool list you maintain for an agent integration | the derived tool catalog — read from the same contract surface, never hand-authored |

## Left out

The seven-stage client lifecycle (lead, solution design, pilot, implementation, go-live, adoption, renewal) from the capability chapter is left out. It describes how a SaaS Plane organization runs its own sales and delivery motion — a go-to-market process, not a construct a partner's code integrates against — and restating it here would carry a sales playbook into a technical reference. The planned OAG module suite's internal shape (Agents · Operational units · Conversations) is left out beyond naming it as planned; nothing there is built yet for an integrator to call.
