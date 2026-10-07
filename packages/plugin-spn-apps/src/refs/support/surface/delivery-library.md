<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/11-delivery-library.md",
      "seen": "850362c7"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/11-delivery-library/",
      "seen": "9e182f2c"
    }
  ]
}
-->

# Delivery Library — Where the Look Is Drawn

Source of truth: the foundation's Delivery Library construct (`docs/02-constructs/02-support/03-surface/11-delivery-library.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/11-delivery-library/`). Delivery Library is the eleventh of thirteen Surface constructs, and the first of the Delivery group — where the library is drawn and what every stack shows as proof.

Read this before you add a token or a block to the library, or before you ask whether a look may live only in one stack's code.

## Terms

| Term | What it means |
| --- | --- |
| Design library | the Figma files that draw each named block and token |
| Snapshot | one file that states a design system in the Surface domain's own words, written from the library and from each stack |
| Gap | one difference between the library's snapshot and a stack's snapshot, of one closed kind |
| Plan | one file for one library file, that lists what the plugin's update mode does there, one operation an entry |
| Result file | the file the update mode saves after an apply, that says what happened to each entry |
| Decisions file | the short file of what a person settled once, from which the plans are written |

## The files, by layer — 🔮

The design library holds one file for each layer of the design system that is drawn, and one for drafts. Five of the six layers are drawn: Core, Components, Widgets, Containers and Layouts. The sixth layer, App, has no file of its own: the choices of the theme are variables, so Core holds them, and the rest of the app's contract stays in words.

| File | Holds | May use |
| --- | --- | --- |
| Core | the variables, the text styles, the scale and the icons | nothing |
| Components | one page for each group of components | Core |
| Widgets | one page for each widget | Components and Core |
| Containers | the container, with its parts and its look | Components and Core |
| Layouts | the layout, in each of its types | every file before it |
| Lab | drafts of large changes | any published file |

A file can use only what another file has published. SaaS Plane's own library is six files in Figma, in the **Design System** folder of the SaaS Plane team, and a link opens only for a person with a seat on that team:

| File | Its pages |
| --- | --- |
| DS 1-core | Colour · Type · Scale · Icons |
| DS 2-Components | one page for each group, then Choices |
| DS 3-Widgets | Filter bar · Data table |
| DS 4-Containers | Container |
| DS 5-Layouts | Layout |
| DS 9-Lab | drafts, never published |

Core holds the variables in collections, and each is one setting of the book: `Roles` (Light, Dark), `Hue` (the values of `color`), `Scale`, `Theme-Font`, `Theme-Radius`, the four `Theme-*` collections of the container look (`Theme-Raised` also holds `page/fill`), and `Frame` (the frame setting of `flush`). A private part's name starts with a dot; a description is one line and a link; a file that changes is published by a person.

## Color is a mode, and the rest are properties — 🔮

In the design library, `color` is a variable mode. `variant`, `size` and the state are properties. `color` stays a prop on every stack, and a design read back turns the mode into the prop.

## What stays in words — 🔮

The library holds the pictures, the properties and the variables. It draws every case a person can see in the showcase, and a line in a description never stands in for a drawing. The book states what no person sees: keyboard use and where focus goes; the overlay seam, and translation; a data shape as a whole; the rule that decides a refusal by the permission gate, whose denied state is drawn. A block with a behaviour and little or no look is stated by its behaviour and its feedback: `DSAuthz`, `DSSticky`, `DSAnchor` and `DSAnchorContainer` have a small sheet of states each, the five formatters share one sheet of formats, `DSAspectRatio` has one sheet of ratios, `DSElementObserver` has an entry with its description and no states, and `DSPortal`, a block of the web alone, has no entry. A description in the library carries one line and a link to the chapter that states the behavior.

## A value held worked out — 🔮

The primary ramp comes from one seed by a formula, and the radius of each size step comes from one base value. A variable of the library holds a value or a pointer to another variable, so the library holds the worked-out values, and the rule that produces them stays in words.

## The snapshot

A person who wants to know where the library and a stack differ should not have to read either one in full. A snapshot is one file that states a design system in the Surface domain's own words. It is written from the library, and the same file is written from each stack's code, so the two are compared key by key. It holds no word of a design tool and no word of a stack, so the web and a native stack write exactly the same file. The command `spnutils apps surface library` writes the library's snapshot and `spnutils apps surface snapshot <package>` writes a stack's, with no model. A file holds a time in UTC, and a command prints it in local time with its offset. A snapshot is the machine's own state and it never enters a repository.

A snapshot has four parts and three levels:

| Key | Level | What it holds |
| --- | --- | --- |
| `snapshotVersion` and `source` | all | the kind of source (`DESIGN_LIBRARY`, `WEB` or `NATIVE`), the time it was read, what it was read from, and the deepest level written |
| `vocabularies` and `units` | 1, the inventory | the closed lists a prop takes, and each unit with its name, layer, group, props, shown states and parts |
| `tokens` | 2 | the ramps, the roles for light and for dark, the scale, the type steps and the theme |
| `measures` | 3 | for each unit and each size: the height, paddings, gap, radii, border and text size, each as a value and, where the side can say it, the token it is bound to |

Level 1 finds most gaps. Level 2 finds a value that differs. Level 3 is read only for the units that levels 1 and 2 flag, because it is the largest. The category, the showcase layout and what a unit has are tags of the showcase only: they are never in a snapshot and never a gap.

## The gaps

A gap is one difference between the library's snapshot and a stack's. Its kind is one of six, and the list is closed:

| Kind | What it means |
| --- | --- |
| `UNIT_ABSENT` | a unit that one side holds and the other does not |
| `PROP_ABSENT` | a prop that one side holds and the other does not |
| `VALUE_ABSENT` | a value of a closed list that one side offers and the other does not, missing or extra; `lacks` says which side is without it |
| `VALUE_DIFFERS` | the same token or measure with another value, by more than half a pixel |
| `TOKEN_ABSENT` | a token that one side holds and the other does not |
| `NAME_UNMAPPED` | a name the naming map does not know, so no comparison was possible |

One gap is a record with the keys `kind`, `level`, `path`, `lacks`, `library` and `stack`. `lacks` is `LIBRARY` or `STACK`, and it is null for `VALUE_DIFFERS` and `NAME_UNMAPPED`, the two kinds that lack nothing on one side. The view prints a dash for it. The record is JSON, named by its package, and it also holds what the gaps were compared from and a count of what could not be compared. It holds `rulesApplied` too, the count of gaps each rule of the comparison left out. A view of one line for each gap is written from the record and is never edited.

The view stays short by five rules. A `UNIT_ABSENT` line replaces every line under that unit. Many `VALUE_ABSENT` gaps on one prop become one line with a list. What could not be compared is a count in the footer and never a line. Level 3 is written only for the units that levels 1 and 2 flagged. **A person and a model read the gaps, and never the library.**

## Reading the library

A plugin of SaaS Plane's own, run by hand in the Figma desktop app, works on the library file that is open. It has two modes, Read and Update. There is one run, and one file saved, for each of the five library files. Lab is never read.

- **The read mode MUST only read.** It creates, sets, moves and deletes nothing, and it saves what it read as one raw file. The plugin asks for no network in either mode.
- **The update mode MUST act on the open file alone, and MUST apply only what a plan names, only after the person has seen the dry run and pressed apply.** It MUST save a named version before its first operation, and it MUST NEVER publish.
- **An operation that fails MUST leave the file as it found it.** The plugin gives back each name it changed, removes each copy, frame, page and set it made, and binds again what it rebound, and the result file says that the operation was undone or names what it could not undo. A property is added to a set as a whole: every version is named first and the set is read once afterwards, because Figma refuses to describe a set whose versions differ.
- **A variable of another library file is found by name among the library variables the open file can use.** The manifest asks for the `teamlibrary` permission, the plugin imports the variable only when an entry binds a layer to it and only on apply, and when it cannot find the variable it refuses the entry and says that the other file's library must be published and enabled in this file.
- **A run MUST ask for one save.** A cancelled save leaves the window open with a button that saves the same result and makes no new read.
- **The window MUST show that it is working, from the moment a run starts.** When a plan is chosen, a file is read or Apply is pressed, it shows a moving mark, in plain words what is being done, and the progress the plugin really knows: `entry N of M` and the unit for a dry run and an apply, `page N of M` and its name for a read, and the versions of a long entry when the count is known. The buttons that must not be used meanwhile are off and the window says why. The plugin tells the window as it goes and gives it a turn to draw between entries, pages and versions. The window shows a time only when it measured it in this run, never an estimate, and when a run fails it says where it stopped.
- **A change MUST be published before it is read.** A raw file holds what its file held when it was read.
- **The raw file holds the facts as Figma names them**, with no rule of ours applied. Its keys are `rawVersion`, `file`, `collections`, `styles`, `pages`, `usage` and `counts`. `rawVersion` is `3`: a version holds its own frame, a layer holds its sizing, a text layer holds its case and its decoration, and `usage` holds, for every variable and style bound by at least one layer of the whole file, the whole count of layers and the first 20 paths with the field bound. A file of version 1 or 2 is still read. Version 1 lacks the frame, the sizing and the text facts, and versions 1 and 2 lack `usage`, so the command that reads the raw files says in one line for each such file that usage outside components is not known. Layers of other library files that bind a variable of this file are not read. **`counts` MUST be written last**: eight numbers that prove the file whole. The command that writes the library's snapshot refuses a file with no `counts`, with counts that differ from what it holds, or of an unknown `rawVersion`, and names the file.
- **Every library file MUST have a raw file before the library's snapshot is written.** A unit in one file is bound to a variable of another, so no file can be read alone.
- **The naming map is the one place a design tool's name appears.** It is one file kept inside the stack's tool. It maps by rule first and by exception second, and a name it does not know is a `NAME_UNMAPPED` gap, never a guess. It holds, for example, a boolean drawn as a variant with two values (a flag prop), a `BOOLEAN` switch that shows a part (the presence of a content prop), a `state` variant (a shown state, never a prop), a page name (a group name, with the layer from the file) and a one-value token such as `radius/base` (`theme.radius`).
- **A model MUST NOT read the library, a raw file or a snapshot to find a gap.** It reads the gaps.

## Bringing the library to a stack

A change of the surface is stated in the construct first, drawn in the library second and built in the web or a native stack third. An improvement is taken in the same order. A person settles what a gap cannot give once, in the decisions file. The command `spnutils apps surface library-plan <package>` reads the gaps, the two snapshots, the raw files and the decisions file, and writes one plan for each library file into `plugin-input/<package>/`, with `counts` last, and a view of the plans by library file, `compare/<package>/library-plan.md`, for a person to review. The library is the side that changes, and a plan shows what would change there before anything is applied.

- **A plan holds operations of eighteen kinds, one entry each, and the plugin completes every one.** A person draws, rebinds, removes and confirms nothing in Figma: a person chooses a plan, reads the dry run and presses apply, and sends a picture to the agent when something looks wrong. Five kinds make a place (`VARIANT_PROPERTY_ADD`, `VARIANT_VALUE_ADD`, `SET_CREATE_EMPTY`, `SHEET_PLACE` and `CASES_DRAW`), and each carries `changes`, a list of exact changes from a closed set of ten kinds: `SET`, `BIND`, `ADD`, `COPY`, `REMOVE`, `BASE`, `SWAP`, `DRAWING`, `COLOR` and `EFFECT`. A look of the library comes from a variable (`BIND`); `COLOR` (a plain colour with its opacity on the fills or the strokes of a layer) and `EFFECT` (a stated list of drop and inner shadows) set a plain value, which is allowed only where the web itself draws a value that is no token, and the library follows the web in that. A decision that draws and gives none is refused by name. A set that `SET_CREATE_EMPTY` makes holds its cases under one variant property named `case` (never Figma's `Property 1`); a set found under `Property 1` is renamed, not refused. Its keys are `planVersion` (`2`), `file`, `madeAgainst`, `decidedIn`, `pluginVersionNeeded`, `operations` and `counts` (`operations`, `doneByPlugin`, `expectedSkips`).
- **A recipe may state a variant property whole, a change may reach the versions of today, and a layer is named exactly.** A recipe for a prop may give `values` in order, `default`, `existing` (the value that each version of today carries) and, for a plain look the web does not name, the value `none` with `plainBecause`; the comparison leaves `none` out and counts it as `NONE_IS_UNSET`. A change may say `on` (`MADE`, `EXISTING` or `BOTH`) in an entry that adds a property or a value, and the plugin gives such a change back when the entry fails. Where a version holds several layers of one path, a change says `occurrence` (from 1, or `ALL`); a path that is not told apart is refused by name, in the command, in the dry run and in the apply, and never applied to the first layer. `planVersion` stays `2` and `pluginVersionNeeded` is `0.4.5`: a plugin before 0.4.2 refuses the kinds `COLOR` and `EFFECT` by name and never reads them wrong, one before 0.4.3 does not foresee the versions an entry before gives a unit, one before 0.4.4 picks a version a change names from the file as it is and not as the unit will be when the entry runs, and one before 0.4.5 cannot find a text style or an effect style of another library file.
- **The plan counts the versions it makes, and a unit's set may not pass 1,000.** Each entry that makes versions carries `versionsMade` and, for a property, a value or a set, `versionsAfter`, the versions the unit's set holds once it is done (both from `copyFrom.versions`, never a second count). `library-plan.md` and the printed lines say them, and for each library file the versions made in all and the largest set after the plan; the dry run says the versions made and the versions the set holds after, beside each entry that adds a property or a value, and the plugin is `0.4.6` for that. The command refuses in one sentence, and writes nothing, an entry that takes a set past 1,000 versions (the unit, the entry, the property, the count, the limit, and: draw the look as cases on the unit's sheet). 1,000 is read from the library (the largest set today is `DSInput` at 850) and refuses the plan that added `format`, `monospaced` and `underline` to `DSText` as properties (2,720). A decision cannot raise it for one unit; a recipe has no key for it. A value whose decision does not change the library (`READING`, `BOOK` or `NONE`, no `FIGMA`) is not made, and its gap is counted as decided with no change.
- **A unit that is one component becomes a set when it gains its first property.** The component and its copies are combined as variants into a set with the unit's name, in the component's place; the component keeps its key and a later run finds the unit by it.
- **A unit that an entry of the run made a set is a set for every entry after it, and a plan can be chosen again.** The dry run foresees the versions the entries before an entry give a unit, and `copyFrom.versions` of an entry that adds a property or a value is the number the unit holds when that entry runs (the command writes it in the order of the file; the plugin forecasts the same). The `target.versions` of a `LAYER_REMOVE` is the same kind of count: the versions that hold the layer when the entry runs, copies of the entries before it included. The plugin is `0.4.7` for both. An entry that cannot be checked against what an entry before it makes is refused by name. An entry whose result is in the file exactly as the plan asks (the page; the property as a variant property with the same values; the value among the values, which are those the plan expected, the new one and the values that other entries of the same plan add to that property, so one of a series of values on one property is found done; the set with its cases) is skipped as "already as the plan asks", a state check does not refuse counts that only grew when such an entry is found done, and an entry only partly present is refused by name. After a run that stopped, the same plan goes on from where it stopped. The check cannot see the look inside the versions made.
- **A version a change names is the one the unit holds when the entry runs, and the apply never hands Figma nothing.** A `from` that names a property an earlier entry of the plan adds picks the version that will carry it; a `from` that does not name it means the versions that carry the value of today (`copyFrom.value` of the entry that adds it), so a decision written before the property existed still picks one version. The dry run tries every swap target, variable, text style, effect style, font and layer on the versions the entry will make; an apply that finds none stops with a sentence naming the layer and the target, and undoes the entry.
- **A style of another library file is found through a layer of the open file that uses it.** Figma's plugin interface lists the variables of a library but no library styles, so a `textStyle` or `effectStyle` a change names is the open file's own style of that name, else the one style of that name that a layer of the file uses (the layer's style id is its id in this file). The read already names these styles, so no new read is asked, and the plugin imports no style. A name no layer uses, or two different styles hold, is refused by name in the dry run.
- **The tool's folder, `~/.spnutils/surface/`, is ordered around the plugin, and the tool writes only under `plugin/`, `plugin-input/` and `compare/`.** The plugin saves into `plugin-output/raw/` and `plugin-output/results/<package>/`, a person writes `decisions/<package>.decisions.json`, and the tool never writes in those two. `spnutils apps surface plugin` makes the whole tree, and run again it leaves every other folder and file as it was.
- **A removal of a variable or a style is written by its usage in the raw file.** Bound by no layer: the plugin alone removes it. Bound by layers: a `LAYERS_REBIND` entry comes first, which the plugin does by binding those layers to the variable the decision names or by letting them go, naming each page and path up to 20 and the whole count, and the removal follows. With no such decision the variable is refused by name. Usage not known, from a raw file of version 1 or 2: the removal is written as checked when applied, and the view says so.
- **A decision matches a gap exactly.** A gap's key is its path, and for `VALUE_ABSENT` the path, `=` and the value. A decision's subject is one key or a list of keys, each compared as written and never as a prefix. The command refuses, by name, a decision that changes the library and matches no gap, and a gap that two decisions match.
- **The dry run changes nothing, and apply is available only when no operation is refused, unless the person ticks the box that applies the ready entries and leaves the refused ones.** The plugin refuses a plan made for another library file or against an older state of the library, an entry whose expected value is not what the file holds, and the removal of a variable or a style that layers bind, naming up to 20 of those layers by page and path, and a change that names a layer, a field, a value or a variable that does not fit. For an entry that makes versions it shows the count of versions made and each change as layer, field, before and after.
- **The result file says one outcome for each entry:** `DONE`, `SKIPPED`, `REFUSED` or `FAILED` (an entry that was undone), with `run.leftRefused` and `counts` last. The command `status` reads the result files.
- **A rule of the comparison removes a gap only when a named fact proves it, and `rulesApplied` MUST count it.** The comparison leaves out what is not a unit, and it reads the props the stack declares. A second reader of the web's snapshot reads from the running showcase the values that only a browser works out.

## A developer's hands are three, and you change the library in one of two ways

- **A developer's hands in the design library are three things: publishing a file, using the plugin, and saving a named version of a file before the connector's first change in it.** Using the plugin means to import it, choose a plan, apply, save a result and read a file. The plugin saves its own named version before it applies a plan, so the third is asked only when the connector is to work, because the connector cannot save one. Nothing else is asked of a developer. Never ask a developer to draw, rebind, remove or confirm anything in Figma. When something looks wrong the developer sends a picture, and you correct the plan or the tool and show the result again.
- **You change the library in one of two ways: a plan that the plugin executes whole, or the Figma connector.** Pick the way from the nature of the work, say which way and why, name the developer's next step, and show the result.

| The work has | The way |
| --- | --- |
| many changes that are alike, exact values, a token or many versions touched, or a change that must be seen before it happens or run again | a plan |
| few items made once, items composed from units or drawn freely (an icon, a sheet of cases, a page), or work where looking at the result matters more than running it again | the connector |

- **Three kinds of work.** A unit that changes (a prop, a value, a look) is a plan. A case the showcase shows is a unit with prop values set: place it as instances, and never draw it as a new look. A use case, a page or a pattern built from units is not synchronised with a stack: compose it from the published library on request, in a file that is not a library file.
- **Before the connector writes, say what you are about to change**, stay inside the file and the items you named, and show the result. A write outside the named file or items is a defect. The connector never publishes a library.
- **Before the connector's first change in a library file, a person MUST have saved a named version of that file.** The connector cannot save one, so ask the developer for it and wait. Without it, a change that goes wrong leaves no point to go back to, and you could not give one.

## How the connector's work is carried out

The connector works one call at a time, and each call costs time and tokens. Six agents worked in one library file by the connector, and each used between 57 and 131 tool calls. The cost came from finding the file again, from a read, a change and a proof as three calls for one item, from probing how the file behaves, and from a picture for nearly every step. These rules take that cost away without making a change less safe.

- **An inventory of a library file MUST be read once and handed on.** Before the first change in a library file, one reading writes an inventory of it: its pages with their ids; its sets and lone components with their ids, pages, properties and counts of versions; the form its sheets of cases take; and the ids of the variables and styles the work will bind. Every agent that then works in that file is given the inventory and does not read those facts again. The inventory names the time it was read. A change to the file updates the inventory's lines for what it changed. Without one, each agent reads the same facts again, and each reading is paid for in full.
- **A script MUST cover a page and return its own proof.** The changes one page needs go in as few calls as stay safe to run again, and the same call returns what proves it: the ids changed or made, the counts, the names and the boxes. A separate reading call is made only where that proof is missing. A change followed by a reading call for each item is the same work paid for twice.
- **Calls that change a file MUST run one at a time.** Two agents never change one library file at once. Reading calls may run together. Two changes to one file at once can each be made against a state the other has already changed.
- **One picture MUST be taken for each set or sheet.** It is taken once after the set or the sheet is made or changed, and once more only after a repair of what the picture showed. A picture for each step costs more than the proof the step already returned.
- **What a probe learned MUST be written once, where the next agent reads it before working, and it is not tried again.** A fact about how Figma or the connector behaves, which an agent had to try out, is written down: how a slot of an instance is filled, how a version is copied, what the connector cannot do. A fact tried twice is paid for twice, and a probe in a real file can change the file.

### The connector's facts

Read this list before you work in a library file by the connector. Each is a fact about how Figma or the connector behaves, written once so that no agent tries it again. **The agent that learns a new fact adds it to this list**, in the book first, and then here.

| Group | Fact | What the agent does |
| --- | --- | --- |
| Every call | A script is plain JavaScript | it uses top-level `await` and `return`, with no wrapper and no call to close the plugin |
| Every call | Only the `return` value comes back | it returns what it needs to see, because a log line is not returned and a notice throws |
| Every call | Every promise must be awaited | it awaits each one, or the call ends before the work does |
| Every call | No state lives between calls | it passes the ids of an earlier call as text in the script |
| Every call | A call names the skills it follows | it passes the skill names on every call, and the skill for changing a library on a call that changes a set, a version, a variable or a style |
| Every call | An error says whether the call may run again | it reads that answer, runs the call again if it is safe, and reads the file first if it is not |
| Pages | A call starts on the file's first page, every time | a script does not assume the page it worked on before |
| Pages | Moving to a page is an async call, and a switch loads the file again | a script switches page once and never inside a loop over pages |
| Pages | Work on several pages is several calls | it sends one call for each page, and calls that only read may be sent together |
| Reading | A search by type uses an index and is far faster than a search with a test | it searches by type first |
| Reading | A node's subtree is searched by a selector | it uses the node's query, such as a name, a type or a child of a type, and not a loop |
| Reading | A set holds its property definitions and a version does not | it never reads the definitions from a version, and optional chaining does not make that safe |
| Reading | Only some kinds of node have some properties | it checks the node's kind before it reads such a property |
| Reading | A picture of a node comes back in the answer | it asks the node for it, and sets the scale when the default size is too small |
| Writing | A call that changes the file must say what it changed | it returns every id made or changed |
| Writing | A colour runs from 0 to 1, and its opacity sits on the paint | it writes the three channels with no alpha, and sets the opacity on the paint |
| Writing | Fills and strokes are read-only lists | it copies the list, changes the copy and assigns it back |
| Writing | A paint bound to a variable is a new paint | it assigns the new paint back |
| Writing | A text cannot change before its fonts are loaded | it loads the text's own fonts first, then changes it |
| Writing | A new node lands at the corner of its page | it places the node clear of what the page holds |
| Writing | A child must be in its parent before it is set to hug or fill | it appends the child first, and sets the size before the sizing modes |
| Writing | A variable or a style that fits is better than a plain value | it binds fills, strokes, padding, radius and gap to a variable where one fits, and uses a plain value only where the work names one |
| Writing | Versions combined into a set sit on one another | it lays them out in a grid and resizes the set before the set is read or shown |
| Writing | A comma inside a version's value splits its name | a value never holds a comma, or the set breaks |
| Writing | An id cannot be guessed | it reads an id from an earlier answer and never makes one up |
| Writing | A name's beginning can match more than one node | it cleans up only by exact id |
| Composing a sheet | A part moved across calls can fail with no error and leave a node with no parent | it makes the wrapper frame first, builds each part inside it, and fetches the wrapper by id at the start of each script |
| Composing a sheet | A child cannot be appended to an instance | it fills a slot through the slot, and the footer slot of a nested popup takes an instance put in through it |
| Composing a sheet | An instance holds its text in a text property | it sets the text through that property, reading the exact key from the instance, and sets the text of a layer only where no property holds it |
| Composing a sheet | A variable or a style of another library file is not in the local lists | it finds one through a layer of this file that uses it, or imports it by key |
| Composing a sheet | A picture of a whole case cannot be edited | it never places one as a fill or a layer, and builds the case from layers |
| What the connector cannot do | It cannot save a named version | a person saves it before the connector's first change in a file |
| What the connector cannot do | It cannot load all pages at once | it works on one page at a time |
| What the connector cannot do | It cannot set plugin data | it keeps its notes outside the file |
| What the connector cannot do | It cannot create an image from bytes | it builds the drawing from layers, and an icon is an instance of the icon unit |

## What a library file holds

A library file is read by people and by scripts. A person reads the grid of a set to see every case at once. A script reads the label of a set to learn how the grid is laid out, and reads the top left of a set to learn its default. So each rule below keeps one thing true that a script or a person relies on.

### A set and its layout

- **A set's versions MUST sit in a grid inside the set. No version sits outside the set's box, and no two versions meet.** A version outside its set belongs to no set when a person looks, and two versions that meet hide each other.
- **A set's header label MUST state which property runs on the rows, which runs on the columns, and in which order the values of each run, and the set MUST be laid out as its label says.** The label is the one place a layout is written, so a script and a person read the same layout. The one thing a label does not decide is the default version, which the next heading decides, and that rule always wins over a label.
- **A layout MUST be changed by changing the label and the set together.** A set laid out in a new way under an old label, or a label rewritten over an old layout, leaves the two saying different things.
- **A set whose label states no layout MUST NOT be laid out again by an agent.** An agent that chose a layout for it would be choosing for the designer, and the choice could not be checked against anything. The agent reports the set, so that a label can be written.

### The default version is the stack's default, and the label tells the truth about it

In Figma, the default version of a set is the version at its top left. So the layout of a set decides its default, and moving versions can change the default without anyone seeing it. The default of a unit is what a stack gives it when no prop is passed. A stack states it, the library follows it, and the library does not state a second default of its own.

- **The version at the top left of a set MUST carry the stack's default value of every property.** Then the row and the column that hold the default come first.
- **The header label of the set MUST name that default.**
- **Where a label and the stack differ on the default, the stack decides, and the label is corrected first. A label is never followed to a different default.** A default the library holds under a label's word would become the default of every instance placed from it, and no stack builds it. A label states a default as a claim, and a claim is checked against the stack, never the other way.

These three rules and the layout rules above do not conflict, because they cover two different questions. A set follows its label for which property runs on the rows and which on the columns, and in which order. It does not follow a label for which version comes first: the row and the column that hold the default come first whatever an old label says, and the label is corrected to say so. A set whose label states no layout is not moved, and if its default version is not the stack's, the agent reports it and does not move it.

- **Anything that moves versions MUST read the default version of each set it touches before it moves them and after, and report both.** A default that changed is then seen on the day it changes, and not found later in a file that others have built on. The evidence is a layout done from labels that still named a default the stack did not give: seventeen sets were laid out as their labels said, and each one's default moved from the stack's default to another size.

### Versions that are added are laid out

- **Whatever adds versions to a set, a plan or the connector, MUST place them in the grid as the label's order gives, and MUST prove that no version is outside the set and no two versions meet.** A copy of a version lands on top of the one it was made from, and a set with stacked or outside versions reads as one case. The plan's kinds that make a place carry the same, and the connector's facts state that combined versions sit on one another.

### A label

A set, a lone component and a sheet each have a header label. A row of a set may have a row label.

- **A label MUST name its unit in a form a script can read: its layer is named `label · ` followed by its text, and its text begins with the unit's name and then ` — `.** For example, `label · DSAnchor — one row · columns: case=text, block, new tab, disabled`. The unit's name is the name the book gives it. A script then finds the unit that a label belongs to by reading the label, and not by guessing from where it sits. The row label of a set names the value its row holds, such as `label · XS`, and a script finds its unit by the row it sits beside.
- **A label MUST sit by its unit, on the unit's own page, and move when the unit moves.** A label left behind when its set moves names nothing near it. A label on a page other than its unit's is a defect, and an agent that finds one reports it.

### A sheet of cases, and a case

- **A sheet of cases MUST sit on its unit's page, beside the unit's set, and its name MUST be the unit's name followed by `cases`, such as `DSInput cases`.** The page then shows the unit and its cases in one place, and a script finds the sheet from the unit's name.
- **A case MUST be the unit with its prop values set, placed as instances of the unit, and never drawn as a new look.** A case drawn as a new look would be a second look for the same unit. A case is named for what it shows, under one property named `case`, and a case's name holds no comma, as the connector's facts and the plan's kinds state.
- **A case is not a unit and is never published as one.** It MUST NOT take, in the file, a form that publishes it as a component of the library. A published case would appear among the units a stack imports, so a stack would be offered units the book never named, one for each case of each sheet.

How the library keeps to the last rule is stated as far as the book can state it today. The form a case takes in the file must not publish it as a component of the library. The tool that draws cases and the files that hold them are brought to this by their own change, and until that change lands a case that is still a component is a recorded difference from this rule, never a form to copy.

### A unit with no look of its own

- **A unit with no look of its own MUST be shown on a sheet that is composed from library units, and the sheet's label MUST say that the unit is not drawn.** A unit that places or watches another unit draws nothing, so a drawing of it would be a look the web does not have. The sheet shows what a person sees when the unit is used, and the label says what the unit is.

### A unit that cannot hold the web's case

- **When a unit cannot hold a case of the web, the case MUST show what the unit can hold, the sheet's label MUST say what is cut, and the cut MUST be recorded as a difference between the unit and the web, to be closed in the unit.** A sheet that shows less than the web without saying so reads as the whole case. The difference is closed by changing the unit, so that the sheet can later show the whole case. It is never closed by redrawing the case.

### A new set, sheet or page takes the form of its neighbours

- **A new set, sheet or page MUST take the form of its neighbours: the ground of a set, a label, a place clear of every other node, and the background of its page.** The ground of a set is its fill and its stroke, bound to the same variables the neighbouring sets bind. A new node is made at the corner of its page, where it meets what is there, and a new page has the editor's own background and not the library's. A new set with no ground shows dark text on a dark page, and a page with another background makes the same unit look different from its neighbours.

## How an agent changes a library file through the connector

The rules under "A developer's hands are three" and "How the connector's work is carried out" state what the agent says before it writes, the named version a person saves first, and how the connector's work is carried out. The rules below add to them and repeat none of them.

### Before the change

- **An order MUST be checked against the live file before it runs.** A plan or an order that was written from a reading MUST name the time of that reading. Before a change, the agent reads the live file for what the order assumes: that each unit exists, that it is a set or a lone component, and what its properties are. It corrects the order and says what it corrected. A file changes between a reading and a change, and an order written from the older reading names counts that are wrong and units that are not there.
- **An order MUST name the web's file and line for each thing it makes, and where the order and the web differ, the agent takes the web and says so in its report.** The library follows the web, and an order written from memory can name a trigger or a count the web does not have.

### During the change

- **A script that changes a file MUST change only the nodes it names.** It is given the nodes it may touch. Before it moves anything it checks that the change leaves no version outside its set, no two versions meeting and no two top-level nodes meeting, and if the change would, it moves nothing. A change outside the named nodes is a defect and is reported, never kept quiet, because a node moved outside the order is a change nobody approved and nobody will look for.

### What the agent reads and keeps

- **An inventory MUST hold, for each page: its id, name and background.** For each set and each lone component it holds the id, the box, the properties with their values, the count of versions, the default version and the ground. For each sheet it holds the id, the box and the cases. For each label it holds the id, the full text, the box and the unit it names. It holds every other top-level node too, and the time it was read. A label's text is in it because without the text the next agent reads the file again to learn what a label says, and the inventory is read once to avoid that. The rule that an inventory is read once and handed on is stated above; this rule states what it holds.
- **A picture that is taken MUST be looked at, and the report MUST say which pictures were looked at and what each one showed.** A picture that nobody looked at proves nothing, and the cost of taking it is paid for nothing.

### Before a publish

- **Before the agent says that a file may be published, it MUST scan the whole file and report each of these:** versions outside a set; pairs of versions that meet; top-level nodes that meet; strays, which are nodes that belong to no unit and no sheet; a property left with the editor's default name; a set whose properties cannot be read; labels on a page other than their unit's; and each set whose default version is not the one its label names. A person publishes after the agent's word, and a file that is published with one of these shows it to every stack that reads the library.

## Drawing a block

- A block drawn from data is a host and an item. One item serves every host that takes one data shape (`architecture-components.md`).
- Each shared state has one picture, on every block and on every kind of surface (`architecture-names.md`).
- An overlay is drawn as its surface alone, placed over a `DSBackdrop`, and its extent is the size of the instance. It draws no width of its own, and the library draws no `extent` variant.
- A popup or an overlay that a block opens is a private part of that block, shown by the switch `open`. It is never a block a designer places on a page of its own.
- A value that only changes which published block sits in a slot is no variant. The slot holds the block.

## Boundary

This ref states what the library draws, how its files are layered, and what stays in words because no person sees it. It does not state which blocks or tokens exist — that is `architecture-components.md` and `architecture-core.md`. It does not state how a stack builds what the library draws, or what proves it did — that is `providers.md` and `delivery-showcase.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.141` | the design library draws the look of each named block, and behavior stays in words |
| `RD.SUPPORT.SURFACE.025` | a change of the surface is stated in the construct first, drawn in the library second and built in the web or a native stack third |
| `RD.SUPPORT.SURFACE.026` | the library draws every case the showcase shows, and states a block with a behaviour and little or no look by its behaviour and its feedback |
| `RD.SUPPORT.SURFACE.027` | the plugin has a read mode and an update mode, and the update mode writes only what a plan names, only in the open file, only after a dry run and an apply, and never publishes |
| `RD.SUPPORT.SURFACE.028` | the agent changes the library by a plan or by the connector picked by the nature of the work, and says what it will change before a connector write |
| `RD.SUPPORT.SURFACE.029` | a developer's hands in the library are three (publishing a file, using the plugin, saving a named version before the connector's first change), and the connector's work is carried out by an inventory read once, a script for each page, one picture for each set, a probe written once and a named version saved first |
| `RD.SUPPORT.SURFACE.030` | a library file holds a set in a grid its label states, the stack's default at the top left with the label corrected to it, a label a script can read, and a case that is never published as a unit |
| `RD.SUPPORT.SURFACE.031` | an agent checks an order against the live file and the web, changes only the nodes it names, and scans the whole file before it says a publish may go |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
