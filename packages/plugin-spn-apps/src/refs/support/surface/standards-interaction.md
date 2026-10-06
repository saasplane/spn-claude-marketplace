<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/02-standards-interaction.md",
      "seen": "8896986b"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/02-standards-interaction/",
      "seen": "a8a14c73"
    }
  ]
}
-->

# Interaction — How a Task Runs on Every Page

Source of truth: the foundation's Interaction construct (`docs/02-constructs/02-support/03-surface/02-standards-interaction.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/02-standards-interaction/`).

Interaction is the second of thirteen Surface constructs, after the first standard of this folder.

Read this before you build a page that runs a task, or before you review one. Its unit is the pattern. A pattern names no product feature; a behavior row says what a person can do, and a pattern says how doing it runs the same everywhere.

## Terms

| Term | What it means |
| --- | --- |
| Task intent | what a person wants to do, in one verb, such as Find or Act |
| Pattern | the one way a task of a given intent runs on every page, stated in six parts |
| Task state | where a task stands: idle, working, done, failed, empty or denied |
| Feedback | what a person sees in each task state |
| Interruption | a task that takes over the page for a moment |
| Recovery | what happens when a task fails, and the way back |

## The six parts of a pattern — 🔮

Every pattern is stated in the same six parts, in this order: **Intent** (what the person wants, in one verb), **Blocks** (which blocks of the design system carry it), **Task states** (which of the task states it passes through), **Feedback** (what the person sees in each state), **Recovery** (what happens on failure, and the way back), **Input** (keyboard, pointer and touch, for each kind of surface). The six parts are what make a pattern checkable: a reviewer holds a page against each part in turn, and each part has one answer. A pattern with a part missing leaves that part to the page, and the next page answers it differently.

## The task states — 🔮

A task state says where a task stands. There are six, and a task is in exactly one.

| Task state | The task |
| --- | --- |
| Idle | has not started |
| Working | has started, and has not answered |
| Done | has answered, and it worked |
| Failed | has answered, and it did not work |
| Empty | has answered, and there is nothing to show |
| Denied | is refused, because the person has no permission |

A block drawn from data, such as a table or a list, shows every one of the six. An action, such as a button, shows working, and then done or failed.

**A task state is not a control state.** A task state belongs to one pattern (idle · working · done · failed · empty · denied); a control state belongs to one block (rest · hover · focus · pressed · disabled · error · selected), stated in `architecture-names.md`. A table that draws its rows well and shows nothing when its data fails has every control state and is missing a task state.

## Every action answers — 🔮

Every action answers the person: working, and then done or failed. Silence is never an answer. So an action shows that it is working as soon as it starts, then that it is done or that it failed. Feedback is drawn by blocks of the design system, never by a page's own picture — working, done and failed look the same on every page of every app.

A failed state says what went wrong, and gives the way back to where the person was. An interruption follows the same rule: it says why it interrupts, it answers, and it returns the person and their focus to the place they left, raised through one seam so every interruption inherits one behavior for focus, for leaving and for stacking. A denied state is presentation only — it tells the person they are refused, and protects nothing; the refusal itself is the server's. The design library draws the denied state of a block that can refuse a person, and the rule that decides it stays in words.

## Input, by kind of surface — 🔮

A pattern states its input once for each kind of surface, because the kinds differ in how a person points and types: the web states the keys that carry it and what the pointer does; native states what touch does. Hover needs a pointer, so a pattern states it for the web alone. Nothing a person needs is reachable by hover only — a touch screen has no hover and a keyboard has none either. What input a pattern states adds to what every surface owes a person (`standards-core.md`), and never replaces it.

## Boundary

This ref states what every pattern is made of: its six parts, the task states a block passes through, and how a pattern states its input. It stops at the pattern itself. It does not say which patterns exist — that is `standards-patterns.md`, which lists one pattern per intent in these same six parts. It does not say what a page is or what a level owns — that is `standards-core.md`. It does not say what a block, a prop or a shown state is named — a control state is a different thing from a task state, and both belong to `architecture-names.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.151` | every pattern is stated in six parts, and every action answers: working, and then done or failed |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
