<!-- spn:doc
{
  "id": "agent-set",
  "variant": "construct",
  "parentId": "concept",
  "title": "The Agent — A Persona a Session Can Convene",
  "lenses": ["LEAD", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set"],
  "summary": "What an agent brief is — a name, a description that decides when it is convened, and the bound authority it carries once it runs, from a fixed persona to a lens picked at the moment of the call.",
  "keywords": ["agent", "persona", "lens", "convene", "subagent", "authority"]
}
-->

# The Agent — A Persona a Session Can Convene

`For: Engineering leader · Architect` · `Status: 🔮 PLANNING`

The context that wrote a change has already agreed with every reason it gave itself. An agent brief is how this repository gets a second, independent read without opening a second terminal: a persona with its own name, convened mid-session, carrying only the authority its own file grants it. This construct names what that file is made of.

## Terms — the words this construct needs

| Term | Contract term | What it means here |
| --- | --- | --- |
| an agent | `AgentBrief` | a markdown file under a plugin's `agents/`, naming a persona a session can convene by name |
| the trigger | `AgentDescription` | the `description` field in an agent's frontmatter — read to decide when this persona, rather than the session's own voice, should answer |
| a lens | `LensFile` | one of the eleven files under `refs/lenses/`, naming what one reviewing viewpoint may block and what it can only advise |

## Boundary — what it owns, and what it refuses

If the question is *who is speaking, and what were they told they may decide*, it belongs here. If the question is *what does the standard actually require*, that is a rule the agent's own file points at rather than restates.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the frontmatter an agent declares — its name, its trigger, and the tools and model it is bound to | inventing a rule with no chapter behind it — an agent that does states a suggestion, never a finding | `the foundation's 04-devex/10-delivery.md` |
| a fixed persona's own voice, and a parameterized reviewer's authority once handed a lens | writing code on the reviewed change — a reviewing agent reports; the writing context acts | [The Skill](../03-skills/skill-set.md) |

## Model — the shape, in one picture

A session names an agent; the agent reads its own file, and — where it reviews rather than advises — a lens file besides.
```dg
{ "kind": "map",
  "boxes": [
    { "id": "session", "label": "a session", "note": "convenes by name, mid-turn" },
    { "id": "brief", "label": "AgentBrief", "note": "name, description, optional model and tools" },
    { "id": "lens", "label": "a lens file", "note": "what this one viewpoint blocks vs. advises" },
    { "id": "report", "label": "a report", "note": "findings, never an edit, for a reviewing agent" }
  ],
  "links": [
    { "from": "session", "to": "brief", "label": "convenes" },
    { "from": "brief", "to": "lens", "label": "reads, when given one" },
    { "from": "brief", "to": "report", "label": "answers with" }
  ] }
```
Most agents are a fixed persona: the brief alone is their whole authority. A reviewing agent is parameterized instead — the brief carries none of the eleven lenses itself, and is handed one by name at the moment it is convened, so the same file reviews a change from any viewpoint the caller names.

## Parts — each piece, named once

### The frontmatter
`name` and `description`, the same two fields a skill declares, read the same way: the description is matched against the moment, not browsed by a person, and it decides whether this persona rather than the session's own voice takes the reply. Two more fields are optional — `model`, overriding which model runs the persona, and `tools`, narrowing which tools it may call; leaving `tools` out grants every tool the session itself has. *Where:* the first lines of `plugins/*/agents/*.md`

### A fixed persona
A brief with no lens argument is one voice, always: an engineering lead, a prose rewriter, a prose reviewer. Its whole authority is the words in its own file, read the same way on every convening. *Where:* `plugins/spn-core/agents/spn-engineer.md`, `spn-prose-rewriter.md`, `spn-prose-reviewer.md`

### A parameterized reviewer
One brief, `spn-panel`, takes a lens name as part of what it is convened over. It reads `refs/lenses/<lens>.md` before anything else, and that file — not the brief — states what this convening may block outright and what it may only advise. The same mechanism a skill uses to route by description routes here by an argument named at the call instead. *Where:* `plugins/spn-core/agents/spn-panel.md`, `plugins/spn-core/refs/lenses/`

## Relations — what it needs

| Needs | For |
| --- | --- |
| [The Plugin](../01-plugins/plugin-set.md) | the `agents/` folder an agent brief is delivered inside |
| [The Skill](../03-skills/skill-set.md) | the same name-plus-description matching rule an agent's frontmatter reuses |

## Binds — what holds it, and where it lives today

| Rule | What it decides | Weight |
| --- | --- | --- |
| `the foundation's 04-devex/10-delivery.md` § When an edit becomes behaviour | an agent brief needs a fresh window before a convening can read the edit | MUST |
| `RD.DEVEX.019` | every agent brief restates a chapter's persona or lens and adds no rule of its own | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-claude-marketplace | spn-core | the four agent briefs and the eleven lens files under `plugins/spn-core/` | planned |

## Proof — how you check it

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/docs.ts audit docs/02-constructs/05-agents/agent-set.md` | gate | the metadata block, the tag line and the outline hold the shape this construct names |

Try it: `node plugins/spn-core/hooks/tools/docs.ts audit docs/02-constructs/05-agents/agent-set.md`
