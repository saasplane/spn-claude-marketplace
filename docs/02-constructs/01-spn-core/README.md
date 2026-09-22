<!-- spn:doc
{
  "id": "spn-claude-marketplace-constructs-spn-core",
  "title": "spn-core — The Stack-Agnostic Domain",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "summary": "The model behind the plugin every SaaS Plane repository loads — the folder that delivers it, the code the runtime calls, the commands run by name, the page production, and the skills, restatements, viewpoints and personas a session reads."
}
-->

# spn-core — The Stack-Agnostic Domain

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

The model for the plugin every repository loads, whatever world it declares. One file per construct, in an order where nothing appears before something it depends on.

Read the first two before anything else. The plugin is the container, and the hook is the shape every piece of running code here takes. Everything below them is one kind of thing that container can hold.

<!-- spn:generated domain — do not edit inside these markers; `docs.ts face` writes it -->
**The stack-agnostic plugin, and the one every repository loads.** It holds what is true of every plugin: what an instrument of each of the five kinds is, the events a hook may run on, the grades it may return, and how the set a workspace loads is derived from that workspace's own claim.

| Construct | What it is |
| --- | --- |
| [The Plugin — Delivery Unit of the Marketplace](01-plugin-set.md) | The folder that carries a standard from this repository into a running session — its manifest, its entry in the marketplace list, the installed copy a session actually reads, and the version field that says which bytes those are. |
| [The Hook — Code the Runtime Calls on Your Behalf](02-hook-set.md) | Code a plugin wires to a moment the runtime reaches — the file that declares the wiring, the payload it is handed, the verdict it returns rather than prints, and the exit code that is always zero. |
| [Loop Events — The Moments a Session Offers a Hook](03-loop-events.md) | The named moments in a session a plugin can wire code to — the window opening, a call about to run, a shell command that finished, a turn about to end — and why only one of them may refuse anything. |
| [The Check — One Rule, Asked on Every Call](04-checks.md) | One rule a script can decide about a single call — the fast path that says whether it could have an opinion, the smallest slice it reads to answer, the chapter it names instead of restating, and the line between refusing a call and only speaking about it. |
| [The Tool — A Command Run by Its Own Path](05-tools.md) | Code a plugin ships that nothing wires — invoked by a person, a skill or another tool, answering with graded findings and an exit code, and degrading to silence wherever the input it needs is absent. |
| [The Page — Produced From a Seat File, Never Typed](06-pages.md) | The HTML a reader opens, produced from the markdown an author writes — the block vocabulary that markdown is written in, the drawer that measures every figure from its own text, the checker that treats a connector as a claim, and the comparison that catches a hand edit. |
| [The Skill — A Verb's Steps, Loaded on Match](07-skill-set.md) | A named unit of work a session can be asked for — a folder, a description matched against the work at hand, the instructions loaded once it matches, and the rule that a skill carries steps and never a rule of its own. |
| [The Ref — A Chapter, Restated and Stamped](08-ref-set.md) | A markdown restatement of one or more chapters, carrying a hash of the exact text it last read, so a chapter that moves is reported rather than quietly outrun — and the three ways a restatement can fail to be comparable at all. |
| [The Lens — One Reviewing Viewpoint, Written Down](09-lenses.md) | One engineering function's judgment stated as a file — what it checks, the one condition it may block on, everything below that which it can only advise, and why the same values also name the audience a document declares. |
| [The Agent — A Persona a Session Can Convene](10-agent-set.md) | A named persona a session can call mid-turn — the frontmatter that decides when it answers, the authority its own file grants it, the difference between a fixed voice and one parameterized by a viewpoint, and where the permission to write actually comes from. |
<!-- /spn:generated -->
