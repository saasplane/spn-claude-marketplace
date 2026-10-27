<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/04-flow-patterns.md",
      "seen": "e427edef"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-patterns/02-web/04-flow-patterns.md",
      "seen": "c9e36661"
    }
  ]
}
-->

# Flow Patterns — One Path to Each Outcome

Source of truth: the foundation's flow patterns chapter (`docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/04-flow-patterns.md`) and the web's part of it (`docs/04-capabilities/02-support/01-surface/03-standards-patterns/02-web/04-flow-patterns.md`), chapters of the Patterns construct.

Flow patterns are the last of the four groups of surface patterns. The task patterns say how one task runs and the app patterns how a screen of an app is arranged (`standards-patterns.md`); the site patterns say how a section of a site's page is shaped (`site-patterns.md`). A flow pattern orders them into a path. Flow patterns hold on every kind of app.

Read this before you design a page that is a step of a path, such as signing up, signing in or making a record, and before you review such a path. A person rarely comes for one page. Every page on a path can follow its pattern and the path can still break: a step that ends at the wrong site, a wait drawn four ways, a screen that says done where the next page would have said it. So you design a page as a step of a path a person already knows, and you review a path by naming the flow it should have followed.

## Terms

| Term | What it means |
| --- | --- |
| Flow pattern | a path across pages to one outcome, built from the app and site patterns that exist |
| Step | a page, or a step inside a page, that follows an app pattern, a site pattern or, where it is one task on a page, a task pattern |
| Outcome | what a person has at the end of the flow, such as being signed in at the place they asked for |

## A flow pattern and the patterns it is built from — 🔮

A flow pattern is a path across pages to one outcome (`RD.SUPPORT.SURFACE.360`). Each step of it follows an app pattern or a site pattern, and each task on that step follows its task pattern. A flow is built from the patterns that exist, as an app pattern is built from the units that exist.

- **A flow MUST be built from the patterns that exist, and MUST add no unit and no page shape of its own** (`RD.SUPPORT.SURFACE.360`). A step that no pattern holds is a page arranged from nothing, and the next flow then copies it.
- **A flow MUST name its outcome, the kinds of person it is for, its steps by the pattern each follows, where it starts and ends, and what a person sees in each task state** (`RD.SUPPORT.SURFACE.360`). A path that names only its happy steps leaves its waits and its failures to each page.
- **Each flow opens with its For line** (`RD.SUPPORT.SURFACE.332`): the kinds of person it is for, and how it runs differently for one. A flow can carry a person from one kind to another: a Visitor who signs up is a Team or Everyday users at the Home the flow ends at. The kinds are stated in `standards-core.md`, under *Who an app is for*.

An arrow, →, leads from one step to the next. The task states are Interaction's (`standards-interaction.md`), and a flow names no state of its own. **Where a flow is an entry in steps, one group of fields at a time in one panel, `DSStepper` shows where the person stands.** Its steps are data, and its task states are the steps' own: `IDLE`, `WORKING`, `DONE` and `FAILED` (`RD.SUPPORT.SURFACE.309`).

## The flow patterns, by name — 🔮

Ten flow patterns are named (`RD.SUPPORT.SURFACE.360`), in the order a person meets them: from a site to the app, then in, then inside it.

| Flow pattern | The outcome | For |
| --- | --- | --- |
| From a site to the app | a visitor reaches the sign-up or the sign-in of the app the site is about, and never a dead end | Visitor · Learner |
| Sign up | a visitor becomes a member with a place of their own, signed in at its Home | Visitor, who becomes a Team or Everyday users |
| Sign in | a person with an account is in, at the place they asked for, for the site they came from | Team · Everyday users |
| Get back in | a person who cannot prove who they are sets a new password and signs in to the same site | Team · Everyday users |
| Accept an invitation | a person a member invited is in the inviting organization, at its Home | Team |
| First run | a new member's empty place shows them the first thing to do, and they do it | Team · Everyday users |
| Open one and come back | a person reads a record found in a list, and returns to the list where they left it | Team · Everyday users |
| Make or change one | a record is made or changed, and the person is back where they started, told that it worked | Team · Everyday users |
| Set up a way in, and prove it | a way of signing in is set up and shown to work before anyone relies on it | Team · Everyday users |
| Leave or switch | a person who is signed in leaves, or moves to another organization or app, and knows where they are | Team · Everyday users |

### From a site to the app

**For** Visitor · Learner, on a docs site that has no app. For a Visitor, both doors stand on the first screen, and on a phone the call stays in the bar; for a Learner, a docs page ends on where to go next, never on a closing call.

| Part | The flow states |
| --- | --- |
| Outcome | A visitor on a site reaches the sign-up or the sign-in of the app the site is about, or a person to talk to, and never a dead end |
| Steps | A site's page, by the site patterns → its doors: *Sign in* in the bar (Move), and the call to sign up as the page's one `SOLID` primary, in the Hero and the Closing call → where the platform offers more than one way to join, a page to choose what to join as, by Doors, each door saying whether it is open → the app's own Sign up or Sign in |
| Starts | Any page of a site, from a link or a search |
| Ends | The sign-up or the sign-in of the app the site is about. A site over several apps ends at the sign-in's front door, which ends at the workspace the person chooses. A site with no app ends on its own call: a demo, the docs, or a contact page |
| Task states | A site's page draws none of its own. A page that reads whether each door is open shows its shape while it reads, and a failure with Try again |

### Sign up

**For** Visitor, who becomes a Team or Everyday users here. The page is read by a Visitor, so it takes the Visitor's lines and asks only what the app's own kind needs; the Home it ends at takes the kind the app is for. For Everyday users, the fewest fields: a name, an email and a password or a provider, no organization's fields, nothing asked before value, and the providers first. For a Team, the organization's name and its web address, checked as it is typed. For a Visitor, one ask, and no account before value.

| Part | The flow states |
| --- | --- |
| Outcome | A visitor becomes a member with a place of their own, such as a workspace or an account, and is signed in at its Home |
| Steps | Where there is more than one way to join, the site's page to choose → **the sign-up page**, one of the pages beside a sign-in (`standards-patterns.md`), its steps in place: the person's details (Enter) → a code that proves the address → where the address already holds a place, a question, make another or sign in (Choose) → the new place's Home, which is First run. With a provider in place of the details: the provider's own pages, then a step *Finish setting up* in the sign-in's panel |
| Starts | A site's call to sign up; the sign-in's second content, *New here? Create an account*; the sign-up page's own address |
| Ends | The new place's Home, signed in, with the welcome said once. Where the sign-in cannot finish by itself, such as when a second step is wanted, the site's own sign-in with the address filled |
| Task states | While the site is read, the panel in the shape of itself, then the main action's own working state. A failure is an alert in the step that keeps every field but the password. A site that takes no sign-ups is refused: it says so and offers *Sign in*. A site that could not be read is a failure with Try again, never a refusal. Done is the Home's welcome, not a screen |
| Second content | *Already have an account? Sign in*, on every step |

The sign-up page is an entry in steps. `DSStepper` shows where the person stands, each step after the first has its own way back to the one before, and the values are kept until the last.

### Sign in

**For** Team · Everyday users; where one sign-in serves both, it takes the less forgiving, Everyday users. For Everyday users, the providers and a code by email lead; for a Team, company sign-on stands as an equal.

| Part | The flow states |
| --- | --- |
| Outcome | A person with an account is in, at the place they asked for, for the site they came from |
| Steps | The sign-in page, one panel whose step changes in place: who you are → how you prove it, by a password, a code, a passkey, a provider or company sign-on → a second step, where the policy asks → which organization, where the person belongs to several (Choose) → the place asked for. With no site named, it opens at the sign-in's front door: who you are, a code to prove it, then the workspace to sign in to (Choose), then the steps of that site |
| Starts | Any page of an app with no session; a site's *Sign in*; signing out |
| Ends | The place the person asked for, or the app's Home where they asked for none. In a frame or a window of its own, the window says it may close |
| Task states | While the site is read, the panel in the shape of itself; then the main action's own working state. A page that only passes the person on draws one line. A failure is an alert in the step, with what was typed kept, drawn as an alert and never as a plain line. A refusal is one step that says why and who to ask, and offers another account. Done is not drawn: the person arrives. A provider's or a company's return page is a wait, and on a failure it is the sign-in's panel with its alert and the way back to the same site's sign-in |
| Proved again | When a session must be proved again in the middle of a task, the sign-in comes to the page as an interruption, a dialog, and the page and its work stay under it. The refused call is sent again once |

### Get back in

**For** Team · Everyday users. For Everyday users, a code by email first, and an expired link explained in everyday words.

| Part | The flow states |
| --- | --- |
| Outcome | A person who cannot prove who they are sets a new password and signs in to the same site |
| Steps | The sign-in's *Reset password* → in the same panel, one of the pages beside a sign-in: who you are → how to reach you → the code and the new password (Enter). Or, from the email, the reset page, in the sign-in's panel, with the new password → the same site's sign-in, the handle filled and one line: *Your password was updated.* |
| Starts | The sign-in's *Reset password*; the link in an email |
| Ends | The sign-in of the site the person came from, with the note. Never the front door |
| Task states | A failure in the step. A link already used or expired says so, with the way to ask for a new one. Done is the note on the sign-in, not a screen of its own |

### Accept an invitation

**For** Team. The page names who invited the person, and to which organization.

| Part | The flow states |
| --- | --- |
| Outcome | A person a member invited is in the inviting organization, signed in, at its Home |
| Steps | The link in the email → the invitation page, one of the pages beside a sign-in: who invited them, to what → where the address is new, their name and a password, as Sign up's details (Enter); where it is known, their sign-in → the inviting site's Home, signed in, with the welcome, which is First run |
| Starts | The emailed link |
| Ends | The inviting site's Home. Where the sign-in cannot finish there, the inviting site's own sign-in with the handle filled |
| Task states | While the invitation is read, the panel in the shape of itself. A failure is an alert that keeps the fields. An invitation that expired or was already accepted is refused: it says so and offers the same site's sign-in. An incomplete link is a failure. Done is the Home's welcome |

Sending an invitation is no flow of its own: it is an entry over the list of invitations, and the first step of First run for a Team.

### First run

**For** Team, the owner of a new organization or a person just invited · Everyday users, on their account's first visit. For Everyday users, a greeting and one card with the one next thing, never a row of zero counts; for a Team, the counts appear once there is something to count, and the invitation card while the person is alone.

| Part | The flow states |
| --- | --- |
| Outcome | A new member's empty place shows them the first thing to do, and they do it |
| Steps | The Home, An overview: the welcome, once, and while the place holds nothing, one card that names the first step with its action, in place of a row of counts (`RD.SUPPORT.SURFACE.365`) → the first step's entry, An entry over the page, such as *Invite members* as a sheet over the list of invitations → that list, by Find in a list, with the first record in it and a message. Every list opened for the first time draws its empty state, with the action that makes its first record |
| Starts | The end of Sign up or Accept an invitation |
| Ends | The first record made, on its list |
| Task states | Each count of the overview loads and fails by itself, with Try again. Each list's empty state. A count the person may not see is not drawn |
| A later visit | The first step's card shows on every visit until the place holds what it asks for |

### Open one and come back

**For** Team · Everyday users. For Everyday users, the record is read before it is changed, and its one or two actions are their own.

| Part | The flow states |
| --- | --- |
| Outcome | A person reads a record found in a list, and returns to the list where they left it |
| Steps | Find in a list → the record: its own page, by A record and its setup, A record and what belongs to it or A record and its steps, or its look beside the list, a drawer at a desktop and a screen of its own on a phone → back to the list, with its search, its filters and its page kept |
| Starts | A row of a list; a link to a record |
| Ends | The record, then the list as it was |
| Task states | The record draws Read's states in its own place: its shape while it loads, not found, a failure with Try again, and a refusal. A spinner that never ends is a finding |

### Make or change one

**For** Team · Everyday users. For a Team, a medium entry in a sheet, with the page beside it; for Everyday users, only a small entry over the page, and a medium one is an entry that is a page in steps, with `DSStepper`.

| Part | The flow states |
| --- | --- |
| Outcome | A record is made or changed, and the person is back where they started, told that it worked |
| Steps | A list or a record → the entry, opened by its size, as step 4 of the app patterns says: An entry over the page for a small or a medium form, An entry that is a page for a large one → on save, a new record with a page of its own opens that page, one made in a sheet over a list returns to the list, and a change returns to where it was opened from, which the entry is given when it opens |
| Starts | A list's main action, an empty state's action, *Edit* on a record, or an action on another page that names where to return |
| Ends | As the steps say, with a message (Hear back) |
| Task states | Enter's states: a refused field says why beside it, and a failed save is an alert in the entry that keeps everything typed, never a toast alone. An entry that changes a record shows its shape while the record is read |

### Set up a way in, and prove it

**For** Team, for an organization's providers and directories · Team and Everyday users, for their own second step. For a Team, the provider's console to open and the return address to copy; for Everyday users, an authenticator app or a code by text, in everyday words.

| Part | The flow states |
| --- | --- |
| Outcome | A way of signing in, such as a second step, a passkey, a provider or a company's directory, is set up and shown to work before anyone relies on it |
| Steps | The setup page, A record and its setup or Set up by kind → its entry, An entry over the page, or An entry that is a page for a directory's many settings → in the entry, a proof: a code from the new method, or for a provider or a directory a test sign-in in a window that signs nobody in → in the entry, a secret shown once, such as recovery codes, with one action that says it was kept, *Finish* → the setup page, the method marked on, and a message |
| Starts | The setup page's *Add*; a sign-in that demands a second step, where every step stands in the sign-in's panel |
| Ends | The setup page; from a sign-in, where the sign-in ends |
| Task states | A failed proof says what to fix. A method set up and not proved stays on its list marked unverified, with *Verify* |

### Leave or switch

**For** Team · Everyday users. The switcher stands only for a person in two or more organizations, which Everyday users rarely are.

| Part | The flow states |
| --- | --- |
| Outcome | A person who is signed in leaves, or moves to another organization or app, and knows where they are |
| Steps | The user menu or the organization switcher (Move) → signing out: the same site's sign-in; switching: the other organization's Home, its name in the shell; where one sign-in serves several apps, to the identity app's own pages: those pages, with a way back to the app the person came from |
| Starts | The user menu, the switcher, or a link to the identity app |
| Ends | As the steps say |
| Task states | Signing out asks nothing, because nothing is lost. A switch shows working on the row pressed; a failure says so and leaves the person where they were, and a switch that needs a second step says so |

## What holds across every flow — 🔮

Each rule below is one the task or app patterns already state for one page, stated here for the join between two pages. So none needs a unit.

- **A flow ends where the person can carry on, for the site they came from** (`RD.SUPPORT.SURFACE.361`). It never drops a site it was given, and never ends at a front door when a site was named.
- **One task is drawn one way** (`RD.SUPPORT.SURFACE.361`). A step that reads shows its own shape, the main action shows its own working state, and a page that only passes the person on draws one line.
- **Done is said by the place the flow arrives at, in one line, once** (`RD.SUPPORT.SURFACE.361`). A screen that says done stands only where nothing follows, such as a window that may now close.
- **Every step MUST draw every task state its task can reach** (`RD.SUPPORT.SURFACE.361`). A read that cannot finish is a failure with Try again, never a spinner that stays, an empty state or a refusal.
- **Signing in and signing up are one door with two rooms** (`RD.SUPPORT.SURFACE.361`). Each panel's second content offers the other, where the site takes sign-ups.
- **The first arrival after joining is greeted once, in every app the flow can end in** (`RD.SUPPORT.SURFACE.361`). A person who joined through one app and lands in another is greeted there too.

## On the web: Back, a reload, a link and a closed tab — 🔮

In a browser a person can leave any page of a flow by the browser's Back, reload it, send it as a link, or close its tab. An entry over the page is an address (`standards-patterns.md`, *On the web*), and a flow takes that rule as it is.

- **A step that holds a proof from the server MUST be the page's state, kept in its tab across a reload and cleared when a new trip starts** (`RD.SUPPORT.SURFACE.362`). A code sent to a person is such a proof. A step before any proof falls back to the flow's first step, with what was typed kept and never a password. Every other step is an address.
- **The browser's Back MUST leave a flow's page, and a step's own way back MUST move inside it** (`RD.SUPPORT.SURFACE.362`). The way back inside the panel gives a person the step before, and the browser's Back still does what it does on every other page.

A step kept in the tab goes when the tab closes. So a closed tab costs a person what a step held, and never what an address holds.

| Flow | Back, a reload and a link | A closed tab |
| --- | --- | --- |
| From a site to the app | Plain addresses. Back from the app returns to the site's page, and a link a visitor shares opens the same page. A demo opens in a new tab | nothing is held in the tab: each page opens again from its address |
| Sign up | One address; the steps are the page's state. The step that holds a proof, the code sent, is kept in the tab across a reload. A step before any proof falls back to the details, with what was typed kept and never the password. Back leaves the page, and each step after the first has its own way back | the step held in the tab goes, and the sign-up opens again at the details |
| Sign in | One address; the steps are the page's state. A step that holds a proof is kept across a reload, and cleared when a new trip arrives. A step before any proof falls back to the first step, the handle kept. Back leaves the sign-in; every step after the first has its own way back, and the first has the way to sign up as its second content. For a Team, the keyboard reaches every step first. Proving it is you again is not an address: a reload drops it, and the act is tried again | the step held in the tab goes, and the sign-in opens again at its first step, for the place its address asks for |
| Get back in | The code's steps are the sign-in's state, as in Sign in. The emailed link keeps its proof in its address, so a reload shows the form until the server refuses it | the code's steps go; the emailed link opens the reset again until the server refuses it |
| Accept an invitation | The invitation is in the address, so a reload or a later visit works until it is used or expires | nothing is held in the tab: the emailed link opens it again |
| First run | The welcome is read once and taken off the address, so a reload shows nothing. The first step's entry is an address, as every entry is | nothing is held: the first step's card stands on every visit until the place holds what it asks for |
| Open one and come back | Each step is an address, so Back, a reload and a link land on the same record, and the way back and the browser's Back do the same | nothing is held: each step opens again from its address |
| Make or change one | Every entry is an address, and the entry's address names where a change returns to. What was typed is lost on a reload | what was typed goes, as on a reload; the entry opens again from its address |
| Set up a way in, and prove it | The entry is an address, as in Make or change one. A reload starts it again, and a secret not yet shown is made again | as a reload: the entry starts again, and a secret not yet shown is made again |
| Leave or switch | Signing out replaces the page, so Back does not return into the app | nothing is held: each place opens again from its address |

## What is not checked yet

- **No check reads a flow for its pattern.** A review names the flow and walks it from where it starts, in each task state, and on the web goes back, reloads, opens a link and closes the tab at each step.
- **A flow has no figure.** Each of its steps is drawn by the spec of the app pattern it follows, in `refs/support/surface/app-patterns/`, or of the site pattern, in `refs/support/surface/site-patterns/`.

## Boundary

This ref states the paths across pages to one outcome: each flow's steps by the pattern each follows, where it starts and ends, the task states a person sees, and what holds at the joins. It stops at the step. The shape of each step is its app pattern or its task pattern, in `standards-patterns.md`, or its site pattern, in `site-patterns.md`; the sign-in page and the pages beside it are stated there too. What a task state is belongs to `standards-interaction.md`, and `DSStepper`'s props to `architecture-components.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.SURFACE.360` | the ten flow patterns, each a path across pages to one outcome, built from the patterns that exist |
| `RD.SUPPORT.SURFACE.361` | every step of a flow draws every task state its task can reach; that a flow holds the rest at its joins is advice |
| `RD.SUPPORT.SURFACE.362` | on the web a step holding a proof from the server is the page's state, and every other step an address |
| `RD.SUPPORT.SURFACE.332` | every flow names the kinds of person it is for, with one line where it runs differently for one |

## Proof

No check reads a flow against these rules yet. A review applies them by walking each path from where it starts, in each task state.
