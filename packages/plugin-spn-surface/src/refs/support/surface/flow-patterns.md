<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/04-standards-patterns/01-common/02-flow-patterns.md",
      "seen": "ca966085"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/04-standards-patterns/02-web/02-flow-patterns.md",
      "seen": "e6eed69c"
    }
  ]
}
-->

# Flow Patterns — One Path to Each Outcome

Source of truth: the foundation's flow patterns chapter (`docs/04-capabilities/02-support/01-surface/04-standards-patterns/01-common/02-flow-patterns.md`) and the web's part of it (`docs/04-capabilities/02-support/01-surface/04-standards-patterns/02-web/02-flow-patterns.md`), chapters of the Patterns construct.

Flow patterns are the second of the two groups of surface patterns. The task patterns say how one task runs (`standards-patterns.md`); the app page kinds say how a screen of an app is arranged (`standards-patterns.md`); the site page kinds order the sections of a site's page and the container kinds shape each section (`site-patterns.md`). A flow pattern orders them into a path. Flow patterns hold on every surface category, and a flow may cross categories, as a sign-up flow runs from a MARKETING page into a PORTAL.

Read this before you design a page that is a step of a path, such as signing up, signing in or making a record, and before you review such a path. A person rarely comes for one page. Every page on a path can follow its pattern and the path can still break: a step that ends at the wrong site, a wait drawn four ways, a screen that says done where the next page would have said it. So you design a page as a step of a path a person already knows, and you review a path by naming the flow it should have followed.

## Terms

| Term | What it means |
| --- | --- |
| Flow pattern | a path across pages to one outcome, built from the page kinds that exist |
| Step | a page, or a step inside a page, that follows an app page kind, a site page kind or container kind or, where it is one task on a page, a task pattern |
| Outcome | what a person has at the end of the flow, such as being signed in at the place they asked for |

## A flow pattern and the patterns it is built from — 🔮

A flow pattern is a path across pages to one outcome (`RULE.SUPPORT.SURFACE.360` · MUST · skill:spn-surface/design). Each step of it follows an app page kind or a container kind, and each task on that step follows its task pattern. A flow is built from the patterns that exist, as an app page kind is built from the units that exist.

- **A flow MUST be built from the patterns that exist, and MUST add no unit and no page shape of its own** (`RULE.SUPPORT.SURFACE.360` · MUST · skill:spn-surface/design). A step that no pattern holds is a page arranged from nothing, and the next flow then copies it.
- **A flow MUST name its outcome, the persons it is for, its steps by the pattern each follows, where it starts and ends, and what a person sees in each task state** (`RULE.SUPPORT.SURFACE.360` · MUST · skill:spn-surface/design). A path that names only its happy steps leaves its waits and its failures to each page.
- **Each flow opens with its For line** (`RULE.SUPPORT.SURFACE.332` · MUST · skill:spn-surface/design): the persons it is for, and how it runs differently for one. A flow can carry a person from one person to another: a Visitor who signs up is a Team or an Individual at the Home the flow ends at. The persons are stated in `standards-core.md`, under *Who an app is for*.

An arrow, →, leads from one step to the next. The task states are Interaction's (`standards-interaction.md`), and a flow names no state of its own. **Where a flow is an entry in steps, one group of fields at a time in one panel, `DSStepper` shows where the person stands.** Its steps are data, and its task states are the steps' own: `IDLE`, `WORKING`, `DONE` and `FAILED` (`RULE.SUPPORT.SURFACE.309` · MUST · skill:spn-surface/design).

## The flow patterns, by name — 🔮

Fourteen flow patterns are named (`RULE.SUPPORT.SURFACE.360` · MUST · skill:spn-surface/design). They stand in the order a person meets them: down a site, a record found, kept and bought on a marketplace, from the site to the app, then in, then inside it.

| Flow pattern | The outcome | For |
| --- | --- | --- |
| Find your way down a site | a visitor goes from a site's home to the topic that answers them, and back up or across without being lost | Visitor · Seeker · Learner |
| Find one and choose it | a seeker finds the record that fits among many and takes its one action | Seeker |
| Keep one for later | a seeker keeps a record with one press and finds it again later, on this device or in their account | Seeker |
| Buy one | a seeker buys the records they chose, knows the order is placed, and knows where to follow it | Seeker, on a site that sells |
| From a site to the app | a visitor reaches the sign-up or the sign-in of the app the site is about, and never a dead end | Visitor · Seeker · Learner |
| Sign up | a visitor becomes a member with a place of their own, signed in at its Home | Visitor, who becomes a Team or an Individual |
| Sign in | a person with an account is in, at the place they asked for, for the site they came from | Team · Individual |
| Get back in | a person who cannot prove who they are sets a new password and signs in to the same site | Team · Individual |
| Accept an invitation | a person a member invited is in the inviting organization, at its Home | Team |
| First run | a new member's empty place shows them the first thing to do, and they do it | Team · Individual |
| Open one and come back | a person reads a record found in a list, and returns to the list where they left it | Team · Individual |
| Make or change one | a record is made or changed, and the person is back where they started, told that it worked | Team · Individual |
| Set up a way in, and prove it | a way of signing in is set up and shown to work before anyone relies on it | Team · Individual |
| Leave or switch | a person who is signed in leaves, or moves to another organization or app, and knows where they are | Team · Individual |

### Find your way down a site

**For** Visitor · Seeker · Learner. A Visitor arrives from a link or a search, usually on a group or a topic, not on the home, so every level can be the first and each tells where it stands; a Seeker arrives as often on a category or a list of results, from a search engine, and goes up and across the categories; a Learner reads one topic and moves on to the next, so a topic ends on where to go next.

| Part | The flow states |
| --- | --- |
| Outcome | A visitor goes from the site's home to the topic that answers them, and goes back up or across without being lost. A site holds three levels by default, a home, a group and a topic, and one group may hold many topics |
| Steps | Home, level 1: its Doors, case *Child section with parts*, one section for each group, name the group's claim, its parts as door rows, one onward action and a picture; a short group of three or so is a grid of door cards (*Door cards*) → a group's home, Group home, level 2: its doors, case *Child section with points*, one section for each topic, tell the topic's claim with two or three of its own points read, one onward action and a picture → a topic, the last level: it ends on *Next topic*, one action to the topic most often read next, and the closing call. Where a group's topics are many, its doors fall into named sets (*In named sets*) and the top bar's menu for the group lists the same sets |
| Across and back up | The top bar stands on every page: each group is a menu that lists its topics, and the group the reader is under is marked selected, so a reader on a topic sees which group they are in and reaches any sibling or other group in one press (Footer repeats the same groups in columns). A group's home is one press up from any of its topics, through the bar's menu header. A topic's *Next topic* goes across to a sibling. Where a topic's page is long, the topic's own sections carry an id and the menu or a link reaches them by anchor. **A help centre always draws `DSBreadcrumb` under the bar, one link for each level above the page and the page itself unlinked, and so does any site whose bar does not list its groups or that runs deeper than three levels** (`RULE.SUPPORT.SURFACE.598` · MUST · skill:spn-surface/design). A reader of such a site arrives deep, from a search, and the breadcrumb is the only thing on the page that says where it stands. saasplane.ai draws none today, since its bar lists its groups and three levels fit it |
| A group that is one page | Where a group's parts are short and read in one go, the group is one page (case *One page* of Group home): its parts are its own sections, each with an id, and the bar's menu links to them by anchor. It holds no doors to child pages. AI-native does this with its two parts. A group is one page when its parts are short and read together; it holds child pages when each part needs a page's room |
| A group inside a group | Never by default. A group sits inside a group, level 3 with topics at level 4, only when its topics are too many for one page and one menu even in named sets, and they fall into parts each worth a page of its own. A subgroup is then a Group home of its own, and the flow gains one step of the same kind |
| On a marketplace | Home, its search and its categories as door tiles → a Category, level 2 or deeper, from the categories menu in the bar → its smaller categories, then a narrowed Listing or a record's Detail. The bar holds the search and the categories menu on every page, and the breadcrumb stands under it, so a Seeker who arrives deep from a search engine sees where the page stands. Finding a record among many and choosing it is Find one and choose it |
| On a help centre | Home, its Find first, with the most asked topics under it → a group's home, Group home: its smaller groups as shelves (Records, case *By shelf*), each a few topics and *View all N*, then its own topics, paged; a group home may sit under another → a Topic, one help answer: the breadcrumb, its title and when it was updated, which plans it applies to, the answer, *Was this useful?*, the related topics, and *Still need help?*. On group and topic pages the top nav takes its side list: the group's topics at the start side and *On this page* at the end side, folding into a menu under the bar on a phone. A search from any page opens Search, a paged list of results |
| A landing page | A Landing page sits off the tree, at level OUTSIDE: it is entered from a campaign, an advert or an email, never from the bar, and it names no group. It ends on its own ask in one place, so it has no doors to the tree and no *Next topic*. A reader who wants the site goes to the home through the brand mark in the bar |
| Starts | Any level of a MARKETING, MARKETPLACE or RESOURCES site, from a link or a search; the home from the address; a landing page from its campaign |
| Ends | The topic that answers the reader, and the closing call or the demo that follows it. A reader who is lost ends at Not found, which says so and leads back to the home or to a person (*Way back*) |
| Task states | A site's page draws none of its own. A door to another site leaves it in its own tab and ends on the leaving arrow, never the inside arrow. An arrow stands only on a door, a boxed card or a lined row, never on a bare line of words |

### Find one and choose it

**For** Seeker. A Seeker comes with a need rather than a name: they look many times, narrow, and choose a record beside others. On a phone the filters open in a sheet, and the record's action stands in a bar fixed at the foot.

| Part | The flow states |
| --- | --- |
| Outcome | A Seeker finds the record that fits among many and takes its one action: buys, books, enrols, applies, connects or asks for the price |
| Steps | Home: its Find, one field or the fields a domain searches by, and the categories as door tiles → a Category, level 2 or deeper, a Brand, or Search for a typed query → a narrowed Listing: the records narrowed by filters, four or fewer in a bar above them and more as facets, the filters chosen kept in the page's address → a record's page, Detail, in the case of what the Seeker does with the record → where the Seeker weighs a few, Compare: two to four records picked from their cards, waiting in the compare tray at the foot of the page until it opens → the record's one action on its Detail page, or, on a site that sells, Buy one |
| Across and back up | The bar holds the search and the categories menu on every page, and the breadcrumb stands under it, one link for each level above the page. Back from a Detail returns to the narrowed listing at the same filters, the same page of records and the same place in the list. Where records are scanned fast, such as jobs, the chosen record opens in a pane beside the list from 1024 up, and the list keeps its place |
| Starts | Home from the address; a Category, a Brand or a narrowed Listing from a link someone shared or from a search engine, because the filters chosen are the address; a Detail from a link |
| Ends | The record's action done: an order, a booking, an enrolment, an application, an interest or an enquiry sent, said once by the page it lands on |
| Task states | A narrowed listing shows its cards in its own shape while they read. Filters that leave nothing say so, name the filters, and offer to clear them (empty). A failure keeps the filters and offers Try again. A record no longer offered says so on its page and leads to similar records. Compare opens only once two records are picked, and the tray says how many more it takes |
| Second content | *Clear filters*, on a narrowed listing; the shelf of similar records, on a Detail |

### Keep one for later

**For** Seeker. A Seeker often decides over days and on more than one device, so a kept record outlives the visit, and signing in is never asked before keeping.

| Part | The flow states |
| --- | --- |
| Outcome | A Seeker keeps a record with one press and finds it again later, on this device or in their account |
| Steps | A record's card on a narrowed Listing, or its page, Detail: one press keeps it, and the press is marked kept (Act) → Saved, from the bar: the records kept, newest first → back to a record's Detail page |
| Starts | Any record's card or page; Saved from the bar |
| Ends | A record's page, opened from Saved, or Saved with the record taken off |
| Task states | Keeping shows on the press at once, and a failure turns the press back and says so in a toast. Saved shows its cards in their own shape while it reads, and an empty Saved says nothing is kept yet and leads to the records (empty). A record no longer offered stays on the list, marked as gone, until the Seeker takes it off. When the Seeker signs in, what was kept on the device joins the account's list, said once |
| Second content | *Sign in to keep them on every device*, on Saved where the Seeker is not signed in; it is never asked before keeping |

### Buy one

**For** Seeker, on a site that sells. A Seeker may never have an account, so a guest buys with an email alone, and what follows the order opens in PORTAL.

| Part | The flow states |
| --- | --- |
| Outcome | A Seeker buys the records they chose, knows the order is placed, and knows where to follow it |
| Steps | A record's Detail, case *Buy*: *Add to cart* in its action panel → Cart: how many of each, what each costs and the total, then one way to checkout → Checkout, one step at a time, with `DSStepper` showing where the Seeker stands: who you are, signing in or going on as a guest with an email, and never forced to sign in → where it goes, the address and the way it comes → how you pay, in the payment provider's own fields → is it all right, the order read back, and one action, *Place order* → Order placed: the order read back, what happens next, and one action that opens the order in PORTAL after sign-in |
| Starts | A Detail's *Add to cart*; the cart in the bar |
| Ends | Order placed, said once. Following the order, its tracking and its returns are PORTAL's, in the app page kinds. A guest is offered an account there, and never made to take one |
| Task states | Adding shows on the button and on the cart's count in the bar. An empty cart says so and leads back to the records (empty). A record that ran out between the cart and the checkout is marked in the cart, and the total is read again. Each step keeps what was entered when the Seeker goes back. A payment that fails is an alert in the step of paying, with the order kept and nothing charged twice. *Place order* shows its own working state and takes one press |
| Second content | *Continue shopping*, on the cart; *Back to cart*, on every step of the checkout |

### From a site to the app

**For** Visitor · Seeker · Learner, on a docs site that has no app. For a Visitor, both doors stand on the first screen, and on a phone the call stays in the bar; for a Seeker, *Sign in* stands in the bar of every page, and a marketplace opens the app only for what needs an account, such as an order placed or the saved list on every device; for a Learner, a docs page ends on where to go next, and a help centre's topic ends on *Still need help?*, which opens the customer's own requests in PORTAL.

| Part | The flow states |
| --- | --- |
| Outcome | A visitor on a site reaches the sign-up or the sign-in of the app the site is about, or a person to talk to, and never a dead end |
| Steps | A site's page, by the container kinds → its doors: *Sign in* in the bar (Move), and the call to sign up as the page's one `SOLID` primary, in the Hero and the Closing call → where the platform offers more than one way to join, a page to choose what to join as, by Doors, each door saying whether it is open → the app's own Sign up or Sign in |
| Starts | Any page of a MARKETING, MARKETPLACE or RESOURCES site, from a link or a search |
| Ends | The sign-up or the sign-in of the app the site is about. A site over several apps ends at the sign-in's front door, which ends at the workspace the person chooses. A site with no app ends on its own call: a demo, the docs, or a contact page |
| Task states | A site's page draws none of its own. A page that reads whether each door is open shows its shape while it reads, and a failure with Try again |

### Sign up

**For** Visitor, who becomes a Team or an Individual here. The page is read by a Visitor, so it takes the Visitor's lines and asks only what the app's own person needs; the Home it ends at takes the person the app is for. For an Individual, the fewest fields: a name, an email and a password or a provider, no organization's fields, nothing asked before value, and the providers first. For a Team, the organization's name and its web address, checked as it is typed. For a Visitor, one ask, and no account before value.

| Part | The flow states |
| --- | --- |
| Outcome | A visitor becomes a member with a place of their own, such as a workspace or an account, and is signed in at its Home |
| Steps | Where there is more than one way to join, the site's page to choose, as From a site to the app says → **the sign-up page**, one of the pages beside a sign-in, its steps in place: the person's details (Enter) → a code that proves the address → where the address already holds a place, a question, make another or sign in (Choose) → the new place's Home, which is First run. With a provider in place of the details: the provider's own pages, then a step *Finish setting up* in the sign-in's panel |
| Starts | A site's call to sign up; the sign-in's second content, *New here? Create an account*; the sign-up page's own address |
| Ends | The new place's Home, signed in, with the welcome said once. Where the sign-in cannot finish by itself, such as when a second step is wanted, the site's own sign-in with the address filled |
| Task states | While the site is read, the panel in the shape of itself, then the main action's own working state. A failure is an alert in the step that keeps every field but the password. A site that takes no sign-ups is refused: it says so and offers *Sign in*. A site that could not be read is a failure with Try again, never a refusal. Done is the Home's welcome, not a screen |
| Second content | *Already have an account? Sign in*, on every step |

The sign-up page is an entry in steps. `DSStepper` shows where the person stands, each step after the first has its own way back to the one before, and the values are kept until the last.

### Sign in

**For** Team · Individual; where one sign-in serves both, it takes the less forgiving, the Individual. For an Individual, the providers and a code by email lead; for a Team, company sign-on stands as an equal.

| Part | The flow states |
| --- | --- |
| Outcome | A person with an account is in, at the place they asked for, for the site they came from |
| Steps | The sign-in page, one panel whose step changes in place: who you are → how you prove it, by a password, a code, a passkey, a provider or company sign-on → a second step, where the policy asks → which organization, where the person belongs to several (Choose) → the place asked for. With no site named, it opens at the sign-in's front door: who you are, a code to prove it, then the workspace to sign in to (Choose), then the steps of that site |
| Starts | Any page of an app with no session; a site's *Sign in*; signing out |
| Ends | The place the person asked for, or the app's Home where they asked for none. In a frame or a window of its own, the window says it may close |
| Task states | While the site is read, the panel in the shape of itself; then the main action's own working state. A page that only passes the person on, such as a console handing over to the sign-in, draws one line. A failure is an alert in the step, with what was typed kept, and it is drawn as an alert, never as a plain line. A refusal is one step that says why and who to ask, and offers another account. Done is not drawn: the person arrives. A provider's or a company's return page is a wait, and on a failure it is the sign-in's panel with its alert and the way back to the same site's sign-in |
| Proved again | When a session must be proved again in the middle of a task, the sign-in comes to the page as an interruption, a dialog, and the page and its work stay under it. The refused call is sent again once |

### Get back in

**For** Team · Individual. For an Individual, a code by email first, and an expired link explained in everyday words.

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
| Ends | The inviting site's Home. Where the sign-in cannot finish there, such as when a second step is wanted, the inviting site's own sign-in with the handle filled |
| Task states | While the invitation is read, the panel in the shape of itself. A failure is an alert that keeps the fields. An invitation that expired or was already accepted is refused: it says so and offers the same site's sign-in. An incomplete link is a failure. Done is the Home's welcome |

Sending an invitation is no flow of its own: it is an entry over the list of invitations, and the first step of First run for a Team.

### First run

**For** Team, the owner of a new organization or a person just invited · Individual, on their account's first visit. For an Individual, a greeting and one card with the one next thing, never a row of zero counts; for a Team, the counts appear once there is something to count, and the invitation card while the person is alone.

| Part | The flow states |
| --- | --- |
| Outcome | A new member's empty place shows them the first thing to do, and they do it |
| Steps | The Home, An overview: the welcome, once, and while the place holds nothing, one card that names the first step with its action, in place of a row of counts → the first step's entry, An entry over the page, such as *Invite members* as a sheet over the list of invitations → that list, by Find in a list, with the first record in it and a message. Every list opened for the first time draws its empty state, with the action that makes its first record |
| Starts | The end of Sign up or Accept an invitation |
| Ends | The first record made, on its list |
| Task states | Each count of the overview loads and fails by itself, with Try again. Each list's empty state. A count the person may not see is not drawn |
| A later visit | The first step's card shows on every visit until the place holds what it asks for |

### Open one and come back

**For** Team · Individual. For an Individual, the record is read before it is changed, and its one or two actions are their own.

| Part | The flow states |
| --- | --- |
| Outcome | A person reads a record found in a list, and returns to the list where they left it |
| Steps | Find in a list → the record: its own page, by A record and its setup, A record and what belongs to it or A record and its steps, or its look beside the list, a drawer at a desktop and a screen of its own on a phone → back to the list, with its search, its filters and its page kept |
| Starts | A row of a list; a link to a record |
| Ends | The record, then the list as it was |
| Task states | The record draws Read's states in its own place: its shape while it loads, not found, a failure with Try again, and a refusal. A spinner that never ends is a finding |

### Make or change one

**For** Team · Individual. For a Team, a medium entry in a sheet, with the page beside it; for an Individual, only a small entry over the page, and a medium one is an entry that is a page in steps, with `DSStepper`.

| Part | The flow states |
| --- | --- |
| Outcome | A record is made or changed, and the person is back where they started, told that it worked |
| Steps | A list or a record → the entry, opened by its size, as step 4 says: An entry over the page for a small or a medium form, An entry that is a page for a large one → on save, a new record with a page of its own opens that page, one made in a sheet over a list returns to the list, and a change returns to where it was opened from, which the entry is given when it opens |
| Starts | A list's main action, an empty state's action, *Edit* on a record, or an action on another page that names where to return |
| Ends | As the steps say, with a message (Hear back) |
| Task states | Enter's states: a refused field says why beside it, and a failed save is an alert in the entry that keeps everything typed, never a toast alone. An entry that changes a record shows its shape while the record is read |

### Set up a way in, and prove it

**For** Team, for an organization's providers and directories · Team and Individual, for their own second step. For a Team, the provider's console to open and the return address to copy; for an Individual, an authenticator app or a code by text, in everyday words.

| Part | The flow states |
| --- | --- |
| Outcome | A way of signing in, such as a second step, a passkey, a provider or a company's directory, is set up and shown to work before anyone relies on it |
| Steps | The setup page, A record and its setup or Set up by kind → its entry, An entry over the page, or An entry that is a page for a directory's many settings → in the entry, a proof: a code from the new method, or for a provider or a directory a test sign-in in a window that signs nobody in → in the entry, a secret shown once, such as recovery codes, with one action that says it was kept, *Finish* → the setup page, the method marked on, and a message |
| Starts | The setup page's *Add*; a sign-in that demands a second step, where every step stands in the sign-in's panel |
| Ends | The setup page; from a sign-in, where the sign-in ends |
| Task states | A failed proof says what to fix. A method set up and not proved stays on its list marked unverified, with *Verify* |

### Leave or switch

**For** Team · Individual. The switcher stands only for a person in two or more organizations, which an Individual rarely is.

| Part | The flow states |
| --- | --- |
| Outcome | A person who is signed in leaves, or moves to another organization or app, and knows where they are |
| Steps | The user menu or the organization switcher (Move) → signing out: the same site's sign-in; switching: the other organization's Home, its name in the shell; where one sign-in serves several apps, to the identity app's own pages: those pages, with a way back to the app the person came from |
| Starts | The user menu, the switcher, or a link to the identity app |
| Ends | As the steps say |
| Task states | Signing out asks nothing, because nothing is lost. A switch shows working on the row pressed; a failure says so and leaves the person where they were, and a switch that needs a second step says so |

## What holds across every flow — 🔮

Each rule below is one the task patterns or app page kinds already state for one page, stated here for the join between two pages. So none needs a unit.

- **A flow ends where the person can carry on, for the site they came from** (`RULE.SUPPORT.SURFACE.361` · MUST · skill:spn-surface/design). It never drops a site it was given, and never ends at a front door when a site was named.
- **One task is drawn one way** (`RULE.SUPPORT.SURFACE.361` · MUST · skill:spn-surface/design). A step that reads shows its own shape, the main action shows its own working state, and a page that only passes the person on draws one line.
- **Done is said by the place the flow arrives at, in one line, once** (`RULE.SUPPORT.SURFACE.361` · MUST · skill:spn-surface/design). A screen that says done stands only where nothing follows, such as a window that may now close.
- **Every step MUST draw every task state its task can reach** (`RULE.SUPPORT.SURFACE.361` · MUST · skill:spn-surface/design). A read that cannot finish is a failure with Try again, never a spinner that stays, an empty state or a refusal.
- **Signing in and signing up are one door with two rooms** (`RULE.SUPPORT.SURFACE.361` · MUST · skill:spn-surface/design). Each panel's second content offers the other, where the site takes sign-ups.
- **The first arrival after joining is greeted once, in every app the flow can end in** (`RULE.SUPPORT.SURFACE.361` · MUST · skill:spn-surface/design). A person who joined through one app and lands in another is greeted there too.

## On the web: Back, a reload, a link and a closed tab — 🔮

In a browser a person can leave any page of a flow by the browser's Back, reload it, send it as a link, or close its tab. An entry over the page is an address (`standards-patterns.md`, *On the web*), and a flow takes that rule as it is.

- **A step that holds a proof from the server MUST be the page's state, kept in its tab across a reload and cleared when a new trip starts** (`RULE.SUPPORT.SURFACE.362` · MUST · skill:spn-surface/design). A code sent to a person is such a proof. A step before any proof falls back to the flow's first step, with what was typed kept and never a password. Every other step is an address.
- **The browser's Back MUST leave a flow's page, and a step's own way back MUST move inside it** (`RULE.SUPPORT.SURFACE.362` · MUST · skill:spn-surface/design). The way back inside the panel gives a person the step before, and the browser's Back still does what it does on every other page.

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
- **A flow has no figure.** Each of its steps is drawn by the spec of the app page kind it follows, in `refs/support/surface/app-patterns/`, or of the container kind, in `refs/support/surface/site-patterns/`.

## Boundary

This ref states the paths across pages to one outcome: each flow's steps by the pattern each follows, where it starts and ends, the task states a person sees, and what holds at the joins. It stops at the step. The shape of each step is its app page kind or its task pattern, in `standards-patterns.md`, or its container kind, in `site-patterns.md`; the sign-in page and the pages beside it are stated there too. What a task state is belongs to `standards-interaction.md`, and `DSStepper`'s props to `architecture-components.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RULE.SUPPORT.SURFACE.360` | the ten flow patterns, each a path across pages to one outcome, built from the patterns that exist |
| `RULE.SUPPORT.SURFACE.361` | every step of a flow draws every task state its task can reach; that a flow holds the rest at its joins is advice |
| `RULE.SUPPORT.SURFACE.362` | on the web a step holding a proof from the server is the page's state, and every other step an address |
| `RULE.SUPPORT.SURFACE.332` | every flow names the persons it is for, with one line where it runs differently for one |

## Proof

No check reads a flow against these rules yet. A review applies them by walking each path from where it starts, in each task state.
