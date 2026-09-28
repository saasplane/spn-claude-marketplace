<!-- spn:doc
{
  "id": "spn-claude-marketplace-why",
  "title": "Why This Repository Exists",
  "lenses": ["LEAD", "ARCHITECT", "SERVER_DEV", "WEB_DEV", "QA", "INFRA", "TRUST", "PARTNER"],
  "status": "DONE",
  "summary": "The argument for a marketplace beside the book — a rule a session cannot load reaches nobody, a partner is granted no book at all, and a standard enforced by review is one somebody has to remember.",
  "keywords": ["why", "marketplace", "delivery", "plugins", "restatement", "partner", "drift"]
}
-->

# Why This Repository Exists

`For: Engineering leader · Architect · Backend developer · Web developer · Quality engineer · DevOps / SRE · DevSecOps / Security · Partner / integrator` · `Status: ✅ DONE`

SaaS Plane writes its rules down. They live in the foundation book, one chapter per subject, argued at length. And your agent session never opens that book. It reads what a runtime loaded for it when the window started. So a rule that lives only in a chapter reaches nobody at all, however well the chapter is written.

This repository closes that gap: the book is where a rule is written, and this repository is how the rule reaches your session. It carries the same rules as **instruments a runtime loads** — hooks, skills, reference cards, lenses and agent briefs — so the standard arrives in the session rather than waiting in a document.

## The problem it ends

Without a delivery channel, a standard is a thing people remember. That costs you wherever memory is doing the work, and the bills arrive together.

| You pay | Because | It shows up as |
| --- | --- | --- |
| **drift, per repository** | every team re-derives the same rule from the same chapter, in their own words | two repositories doing the same thing differently, and no check able to see it |
| **review burden** | the only thing holding the line is a person noticing in a pull request | the same comment written a hundred times, and the hundred-and-first missed |
| **a partner with no channel** | somebody building on your platform holds no grant to the book | they guess, and the guess is discovered by the first thing that breaks |

The third one is the sharpest. A partner is outside the team that owns the platform. They hold their own repository and the packages they installed, and that is all. A rule you keep in a private book is a rule you have decided they will never follow.

## What a marketplace changes

An instrument is loaded by a runtime on your own machine. That is the whole reason this repository is public while the book is not — you can reach it without anybody granting you anything. Installing it puts real files into your session, and from that moment the standard is something your agent holds rather than something you remember.

Several things move at once when that happens:

- **A rule fires where the work is.** A hook runs at the moment a write would land, so a defect is answered before it is a file on disk rather than after it is a line in a diff.
- **A skill carries its own steps.** A skill is loaded when the work matches it, so the procedure arrives with the task instead of being looked up.
- **A standard travels to people you never meet.** Publishing here is pushing the repository, and a partner installs the result the same way you do.

## Why it authors no rule of its own

A rule true of every repository belongs to the book, and a second copy of it here would be a second source. Two sources drift, and the one that drifts is always the copy — so every file here that carries a rule names the chapter it restates, and a checker compares the two.

That leaves something real for this repository to own, and it is not the rules. It is the **machinery**: the code that reads a rule, the events it runs on, the shape each instrument takes, and the path by which the set reaches a workspace. The book says what is true. This repository is how that becomes something a session can act on.

What you actually get when you install it is the next page: [What you get](02-what.md).

---

<!-- book-nav -->
📖 ← [purpose](README.md) · ↑ [purpose](README.md) · [what](02-what.md) →
