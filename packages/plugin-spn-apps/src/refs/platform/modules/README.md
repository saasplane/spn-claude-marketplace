<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/03-platform/02-modules/README.md",
      "seen": "6892e5ab"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/02-modules/",
      "seen": "89445bb7"
    }
  ]
}
-->

# Platform Modules — The Standard Library a Platform Composes, Not Rebuilds

What a platform module is, the seven that ship, what adopting one commits the platform to, and what a developer gets by adopting instead of building the same thing again.

Check this before you write a country, currency or language list, compose a message by hand, store a file, or build a comment thread, a tag system or a scheduler from scratch. The answer is almost always that one of these seven already has it, and building it again is not a shortcut — it is a second, worse copy that nothing keeps in step with the first.

## What a module is

A platform module is a piece of the standard library every SaaS Plane platform composes rather than rebuilds. Reference data, translation, notifications, documents, entity patterns, scheduled work and the audit trail are not features a product sells. They are the same handful of problems every product hits on its way to selling something else, solved once so nobody solves them badly on their own schedule.

A module ships as a published package, versioned like any other dependency, not as a service a team stands up and operates for itself. The platform depends on it and composes it into its own service; it does not fork it.

The seven are numbered in dependency order in the foundation's own construct chapter, and that order is not incidental. Reference Data depends on nothing else in the set, and every later module names which of the earlier ones it reads. That is what keeps a shared base catalog safe to read from anywhere: nothing that reads it can ever become something it depends on, so there is never a cycle to break.

## The seven that ship

| Module | Depends on, within the set | What it is |
| --- | --- | --- |
| Reference Data | nothing else in the set | the base catalog of countries, currencies, languages and labels, plus the registry of which record types exist and which cross-cutting patterns each one accepts |
| Translation | Reference Data | a layer over the base catalog — a label the platform translates once for everybody, and a record's own attributes the owning organization translates for itself |
| Notifications | Tenancy, Identity (outside the set) | one catalog of actions a module fires by name, configured per organization, delivered through a vendor seam, and answered by a delivery record for every send |
| Documents | Data and Trust, Tenancy (outside the set) | a file's record kept apart from its bytes, uploaded through a lifecycle that survives an interrupted transfer, and derived into variants that are generated rather than uploaded |
| Entities | Reference Data, Documents | the patterns almost every record needs — custom fields, tags, metadata, comments, attachments, activity history, per-record sharing — attached to any record by its type and its identifier |
| Jobs | Tenancy (outside the set) | scheduled work the platform fires on its own, delivered to one or more destinations in order, each with its own retry policy and its own recorded outcome |
| Audit Log | Data and Trust (outside the set) | the append-only trail that proves what happened, written only through a queue seam and never editable once written |

Tenancy, Identity, Data and Trust and Surfaces are platform core, not part of this set — named here only because a module reads one of them. This ref does not restate what they are.

## What adopting one commits the platform to

Adopting a module is not free of obligation. You inherit each one's rule the moment the platform depends on its package, and here is the cost if you write code that routes around it instead of following it.

| Module | Adopting it commits the platform to | What breaks if it is routed around |
| --- | --- | --- |
| Reference Data | reading the base catalog instead of keeping a second country, currency or language list | the second copy is correct the day it is written and silently wrong the day the catalog is corrected, and nothing reports the drift |
| Translation | letting the organization that owns a record translate its own attributes, and replacing a translated map whole rather than merging into it | a partial write leaves one record showing text assembled from two different states of the truth, with nothing on the row saying so |
| Notifications | triggering a catalog action by name instead of composing a message at the call site, and reaching every channel through the vendor seam | a rebrand becomes a code change, and a vendor swap means finding every place that called the old SDK directly |
| Documents | registering a file's record before its bytes exist, never mutating it once written, and never reclassifying its access class | an interrupted upload leaves nothing to resume or clean up, and a mutated record silently repoints every reference that was checked against the old bytes |
| Entities | declaring what a record type accepts once, in the entity-type registry, rather than building the opt-in per pattern | the question "does this type accept a tag" gets a different answer everywhere it is asked, and the answers drift apart |
| Jobs | putting a destination's retry policy on the destination, not the schedule, and recording a run with a per-destination outcome for every firing | a schedule that silently stopped firing looks identical to one whose work produced nothing |
| Audit Log | passing the actor and the organization explicitly on every write, even where no session exists behind the event, and writing only through the queue seam | the trail is missing exactly the events it exists to prove — a failed sign-in, a denied request, a scheduled task with nobody behind it |

## What each module requires, not just what it costs to skip

The table above compresses each module to one commitment. Here is what actually backs it, so you can check a change against the real rule rather than the one-line summary.

**Reference Data**
- Read countries, currencies, languages and base labels from the catalog. Do not declare a second copy anywhere, even a small one.
- A currency's symbol position and a language's reading direction are properties of the value, not of a screen. Do not hard-code either into a layout.
- The entity-type registry is open — any module may register a type, naming itself as owner. The capability set a type may opt into is closed. Do not invent a new capability name to describe what a type accepts.
- Reference Data depends on nothing else in the standard library, and nothing in the standard library may become a dependency of it. Do not add one, even a small one — it removes the bottom of every other module's dependency chain.

**Translation**
- A label is translated once, for the whole platform. A record's own attributes are translated by the organization that owns the record. Do not let an organization edit a platform label, and do not hold entity translations centrally.
- A write to an entity translation replaces the attribute map whole. Do not merge a partial write into an existing map.
- A translation carries who wrote it and when, so a reviewer can tell what is new since they last read.
- Name a translation's language with a code from the base catalog. Do not type one by hand.

**Notifications**
- Trigger a catalog action by name. Do not compose a message at the call site.
- A configuration is drafted, then published, and only the published version renders. Do not let a draft take effect.
- A locked action serves the platform's own wording to everybody, and that is the owning module's decision — independent of whether an organization's type is enabled for customization at all. Do not reword a locked action because customization happens to be on.
- Reach every channel through the vendor seam. Do not call a vendor's own library.
- Record a send through its delivery events — queued, sent, delivered, failed, bounced. Do not record only that it was sent.
- A suppressed recipient is refused, not weighed as a preference. Do not write to a suppressed address for any reason on the list.

**Documents**
- Register a file's record before its bytes exist, and let its lifecycle state say how far the transfer got.
- The record is immutable once written; content that should differ is a different file. Do not mutate a file record in place.
- Sensitivity and access class are different questions, both stated on the record. Do not derive one from the other.
- Every object key leads with `public/` or `private/`, stamped at creation and never changed. Do not reclassify a file, compose a key yourself, or let a key name a bucket.
- Generate variants from the original; do not accept an uploaded one. Carry each variant's own processing state.
- Reach the configured store through the seam. Do not name a storage vendor at a call site.

**Entities**
- What a record type accepts is declared once, in the Reference Data registry. Do not re-declare the opt-in per pattern.
- Keep a field or tag definition separate from the values written against it, so either can be renamed without touching every record that carries one.
- An attachment links to a file; it does not hold bytes. Leave the bytes to Documents.
- Activity is a closed vocabulary and a product feature. Do not read it as the audit trail, and do not show the trail as activity — they answer different questions for different readers.
- A record grant is a named relation to one record, not a general permission. Do not model sharing as something that widens what somebody may do everywhere.

**Jobs**
- Model one-time and recurring schedules as one shape with different fields filled. Do not build them as two systems.
- Let a schedule deliver to more than one destination, in the schedule's own order.
- Put the retry policy on the destination, not the schedule. Do not apply one retry policy to a reliable destination and a flaky one alike.
- Record every firing as a run, with each destination's outcome recorded separately. Do not collapse a partial firing into one status.
- Keep `FAILED` and `TIMEOUT` separate. Do not collapse a destination that answered badly with one that never answered.

**Audit Log**
- Carry the actor and the organization on the append command explicitly. Do not derive them from an authorization context, because the events that matter most have none.
- Never edit or delete a written record.
- Carry category, severity and result, each from a closed vocabulary, so the trail can be searched rather than only archived.
- Keep `DENIED`, `FAILURE` and `ERROR` separate. Do not collapse a refusal, an unsuccessful attempt and a platform break into one result.
- Carry retention on the record itself. Do not compute it at read time.
- Write only through the queue seam. Do not call the trail directly from a module just to record a side effect.

## What a module leaves open to extend, and what is not open at all

Every module leaves exactly one door open for you to extend it through, and it is never the closed vocabulary.

**You may:**
- register a new entity type in the Reference Data registry, naming the owning module, and opt it into the closed set of cross-cutting patterns
- add a new catalog action to Notifications, and decide whether the owning module locks its wording against organization override
- declare custom field definitions and tag definitions for a record type once that type has opted in, through Entities
- schedule jobs against their own destinations and retry policies, through Jobs
- configure which vendor provider a channel or a store uses, per organization — that is estate configuration, never code

**Do not extend a closed enum.** Not one of these is yours to grow: `EntityCapabilityType`, `NotificationChannelType`, `DocVariantType`, `DocFileAccessClassType`, `JobScheduleDestinationType`, `AuditLogCategoryType`, `AuditLogSeverityType`, `AuditLogResultType`, `NtfBlacklistReasonType`. `EntActivityActionType` ships an explicit `OTHER` value for exactly this reason — reach for it rather than inventing a verb. Each of these vocabularies is declared once and read everywhere; add a private value to one and you have made a cross-cutting pattern need a special case, and the next module that touches it needs two.

## How you consume one

A module ships as a service package and, for these seven, usually a matching web package carrying the administration and authoring screens for the data it owns. Reference Data, for example, publishes a server package and a web package under the same three-letter code its own node uses inside the platform repository; the other six follow the same shape, one code per module.

Depend on the server package and compose it into the platform's own service the way you compose any module server contract: compiled against its published contract, with the implementation absent — never reach into another module's internals to read what its contract does not publish.

Adopt in the order the dependency chain implies. Reference Data has nothing to wait on, so bring it in first if nothing else exists yet. Entities is not useful until Reference Data and Documents are both wired, because it reads the entity-type registry from one and attaches files through the other. Notifications, Documents, Jobs and Audit Log each need Tenancy — and Notifications needs Identity too — so none of the seven stands in for platform core; they sit on top of it.

When the module you are wiring needs a vendor — an email provider, an SMS gateway, a storage bucket — never call that vendor's SDK directly. Reach the seam the estate configures per organization instead. Adopting Notifications or Documents gets you the code path; it does not get you a vendor already wired. A send or an upload still needs a provider configured before it will do anything, so check for one rather than assuming it exists.

Do not write out the published package list here, and do not trust one you find written down anywhere else as current. Ask for the module catalogue command instead — it names which of the twenty-plus `@saasplane/module-*` packages exist today and at what version. A list copied into a ref moves with every release and is wrong by the next one.

## What adopting saves against building it again

Whether to adopt one of these seven or build the same capability again is the developer's decision, not yours. What you owe the developer is the cost of each choice, named plainly enough to put in front of them before you write code, not discovered after you have shipped it.

If a developer asks you to build reference data, translation, notifications, documents, entity patterns, scheduled work or an audit trail from scratch, tell them first that every product needs all seven regardless of whether the platform adopts them. Declining to adopt means you will be building each one again, once per team, usually worse, and inheriting the specific failure modes the capability chapters already name rather than hypothetical ones: a second country list that drifts silently from the corrected one; a message composed at the call site that turns a rebrand into a code change; a mutated file record that quietly repoints every reference checked against the old bytes; an audit record with no actor, because it was derived from a session that never existed for the one event that mattered most.

None of this is speculative. If you have never heard of `@saasplane/module-server-cmp-ts` — the audit trail's own package — you will write an audit log that derives its actor from the request context, and it will be right for every event except the ones the trail exists to prove. The same is true of its six siblings. Naming what already exists, before the developer asks you to build it, is the whole reason this ref is here.

## What this does not cover

This page covers the seven standard-library modules — Reference Data, Translation, Notifications, Documents, Entities, Jobs and Audit Log. It does not cover platform core: Tenancy, Identity, Surfaces, or Data and Trust, each named above only where a module reads one of them — you will meet those as their own ref. It does not cover the module server contract's own shape — the read ladder, the service interface, the closed set of method families — ask for that ref when the question is how a contract is built rather than which module to adopt. And it does not enumerate packages or versions; ask for the module catalogue command.

## Which modules ship

**This folder is the list.** One ref per module, named for the construct the book states — so nothing is generated here and nothing can fall out of step with what exists.

| | |
| --- | --- |
| [`reference-data.md`](reference-data.md) | one shared list, and one place to fix it |
| [`translation.md`](translation.md) | labels belong to the platform; content belongs to an organization |
| [`notifications.md`](notifications.md) | composed once, delivered through a seam |
| [`documents.md`](documents.md) | a key is derived, and its first segment is the access class |
| [`entities.md`](entities.md) | the patterns every record type can opt into |
| [`jobs.md`](jobs.md) | a schedule is not an entry |
| [`audit-log.md`](audit-log.md) | a record is never edited |

**For which are installed in a given platform, and at which version, ask the CLI.** That answer moves, and a document that carries it is a document that is wrong between releases.
