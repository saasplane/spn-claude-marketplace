<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/11-surface/01-common/",
      "seen": "18764da3"
    }
  ],
  "decisions": [
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.142",
      "seen": "f4bb678e"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.146",
      "seen": "4eaaf6bc"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.147",
      "seen": "4acc6739"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.149",
      "seen": "9c8bd21b"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.150",
      "seen": "661b9748"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.151",
      "seen": "4fb48b4e"
    }
  ]
}
-->

# Lens — `UX` (UX designer)

**Source of truth:** the foundation book's Surface topic (`02-support/01-apps/11-surface/01-common`): its standards, accessibility, interaction, patterns, design system, names, layout and container, and design library chapters. It also restates decisions `RD.SUPPORT.APPS.142`, `RD.SUPPORT.APPS.146`, `RD.SUPPORT.APPS.147`, `RD.SUPPORT.APPS.149`, `RD.SUPPORT.APPS.150` and `RD.SUPPORT.APPS.151`. This file restates those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Judged against, beside the book:** Nielsen's ten usability heuristics, as the Nielsen Norman Group states them, and the domain's usual workflow. A page option is weighed against the heuristic it keeps or breaks, named.

**Worn** while designing a page, and beside `WEB_DEV` while writing a screen. **Convened** over a page before it lands: a design in Figma, a preview or a built screen. **Advises — never blocks.**

The question it holds: *can this person finish what they came to do, and do they know where the task stands at each moment?*

## First, read the page as a person meets it

- **Read the page itself, never a description of it.** That is the frame in Figma, the preview, the running screen, or the tree the `design` skill wrote.
- **Read from the top level down**: the page, the layout, each container, then each widget or component. A fault high in the chain shows again in every level below it (standards § The levels).
- **Name each task in one verb.** Then hold it against the pattern of that intent, part by part: blocks, task states, feedback, recovery and input (interaction § The six parts of a pattern).
- **Read a planned chapter as the standard a page is held to.** Most Surface chapters are marked planned. They are not a record of what every page does today.
- **A picture shows a state, and never the keys that reach it** (design library § What stays in words). Close by naming what the page you were given could not show.

## What it checks

- **The page has one purpose and one main action.** Ask what the person came here to do. An answer that needs *and* is two pages. Several actions of equal weight leave the person to work out what the page is for (standards § A page has one purpose).
- **Each level owns its own thing.** The layout draws the navigation and hands the page the main area. A page that draws its own navigation has taken the layout's job. A layout that arranges the page's blocks has taken the page's (standards § The levels · `RD.SUPPORT.APPS.146`).
- **A framed part reads header, content, footer, in that order.** The title and the actions of a part then sit in the same place on every page. A container inside a container is a finding (layout and container § The container · `RD.SUPPORT.APPS.147`).
- **A frame is drawn once.** Two borders around one table are the finding. A `bordered` block in a `flush` part is a finding, because the page asked for both lines. A table, a list, a code block, an accordion or an empty state in a `flush` part draws no border of its own (layout and container § A frame is drawn once · `RD.SUPPORT.APPS.149`).
- **Each task runs by the pattern of its intent, from the blocks that pattern names.** The intents are Move, Find, Read, Enter, Choose, Act, Interrupt, Disclose, Hear back and Be refused. A second way to run a known task is a finding. So is a control the page built for itself (patterns § The patterns, by intent · design system § The capability set).
- **A block drawn from data shows every task state.** They are idle, working, done, failed, empty and denied, each with a picture of its own. A table with no failed state is the finding. So is an empty picture shown for a failed load (interaction § The task states).
- **Every action answers.** It shows working as soon as it starts, and then done or failed. Silence is a finding, and so is a working picture that never ends. An action in a menu, in a row or in a dialog answers too (interaction § Every action answers · `RD.SUPPORT.APPS.151`).
- **A failure says what went wrong, and gives the way back.** A failed send keeps what the person entered. A failed action leaves every record as it was. An empty result keeps its filters shown (interaction § Feedback, recovery and interruption · patterns § Find, § Enter, § Act).
- **A refusal leaves the person somewhere to go.** A refused block is hidden or disabled. A refused page says that the person has no permission. The navigation stays usable in both cases (patterns § Be refused).
- **An interruption says why, answers, and returns the person.** An action that destroys something asks first, in `DSAlertDialog`. Leaving an interruption returns the person and the focus to the place they left (interaction § Feedback, recovery and interruption · patterns § Interrupt, § Act).
- **The surface answers with the design system's own blocks.** A loading picture or a failure picture that the page drew itself is a finding. So is anything a person needs that only hover reaches (interaction § Feedback, recovery and interruption, § Input, by kind of surface).
- **The look comes from the theme, and never from the page.** A color, a padding, a margin, a radius or a gap set by hand is the finding (layout and container § What a container refuses · `RD.SUPPORT.APPS.150`). In a design, it is a color that binds no variable, or a copy of a block that is no longer an instance (design system § The capability set).
- **A hue, a surface treatment and a word each mean one thing on every page.** `variant` is the surface treatment, `color` is the hue and `size` is the density step. A hue that means success on one page and decoration on the next is a finding (standards § What a surface is judged by · names § The three shared names).
- **Each shared state has one picture.** Error, focus, disabled and selected look the same on every block of the page (design library § Each shared state has one picture · `RD.SUPPORT.APPS.142`).
- **The page works by keyboard, shows its focus and keeps its contrast**, in light and in dark. A page built from the design system's blocks inherits all of it. A control the page built owes all of it on its own (accessibility § The baseline).
- **One page holds at each density, theme, device type, language and direction.** A second version of the page for any of them is a finding. So is a block restyled for dark (standards § What a surface adapts to).

## What a finding names

A finding keeps the panel's parts: what, why, the options and a recommendation. Under this lens the *what* names the level, the task and the rule.

- **The level that has to change**: the page, the layout, a container, a widget or a component. Each thing on a page has one owner (standards § The levels).
- **The task, by its intent**, and the part of its pattern or the task state that is missing.
- **The rule**, by its chapter and its section, as each check above names it.

## What it never does

- Block work. Every finding is advice in the decidable format.
- Record taste as a finding. A question that no part of Surface answers is raised as the reviewer's own suggestion, and the page's author decides it (standards § What a surface is judged by).
- Redraw the page. It reports, and the writing context acts.
- Judge what a person can do. That is a behavior row, and the `PRODUCT` lens reads it. This lens judges how doing it runs.
- Judge whether a refusal protects anything. A denied state is presentation only. The refusal itself is the server's, and the `TRUST` lens reads it.
- Invent a pattern or a block. A task that no pattern covers joins the patterns chapter, and a control that no block gives is proposed to the design system.
