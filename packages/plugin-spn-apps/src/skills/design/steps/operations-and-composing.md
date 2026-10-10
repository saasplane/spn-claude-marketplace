# Step: operations-and-composing — what a unit still owes, then composed, then scanned once

Read this step when a library file's sets are brought to their specs (the walk "A set changed by its spec" in `skills/design/steps/change-library.md`) and the units still owe drawing: a name, a copy, a property, a header, a sheet, a case, a look. It has three walks. The first carries out by script everything a script can. The second is for what only an eye can do. The third scans every page once, after the last change. Read `skills/design/steps/connector-rules.md` first, and send every call as it says. Every script named here is in `skills/design/scripts/`.

## What a unit still owes, written as operations

A script cannot follow a sentence. The spec of a unit says in sentences what the unit still owes (`needsDrawing`), and each sentence becomes an **operation**: the same decision in a form a script carries out, naming the exact layer, property and value as they stand in the file. The writer of an operation decides nothing new about the design. Where a line needs a design choice, the writer records it for the developer. Where a line needs real composing, the writer says so.

### The form of an operation

One file for each unit, `<Unit>.json` in a folder of operation files. Every line of the spec's `needsDrawing`, by its place in the list (0 for the first), stands in exactly one of `ops`, `choices`, `compose` or `nothing`.

```json
{
  "unit": "DSCommand",
  "setId": "<the set's id>",
  "ops": [
    { "op": "names", "lines": [0], "why": "empty leaves the names when size and state come",
      "renameProperty": { "validationType": "state" },
      "renameValue": [{ "property": "state", "from": "ERROR", "to": "error" }],
      "fold": [{ "match": { "selected": "true", "state": "rest" }, "set": { "state": "selected" } }],
      "dropProperty": ["selected"] },
    { "op": "copy", "lines": [1], "from": { "size": "SM", "state": "rest" }, "to": [{ "size": "XS" }, { "size": "MD" }],
      "look": "the icons take the size's icon size; the text keeps its style" },
    { "op": "property", "lines": [2], "name": "empty", "type": "BOOLEAN", "default": false, "layer": "empty state", "ties": "visible" },
    { "op": "sheet", "lines": [3] },
    { "op": "case", "lines": [3], "name": "groups=rows with end icon", "proves": "Content: End icon",
      "base": { "size": "SM", "state": "rest" }, "props": { "withEndIcon": true },
      "text": { "label": "Open file" }, "swap": { "endIcon": "DSIcon / SETTINGS" }, "modes": { "Hue": "SUCCESS" },
      "replaces": "the lone component `groups=rows` that stands on the sheet today is replaced by this instance" },
    { "op": "default", "lines": [4], "to": { "size": "SM", "state": "rest" } },
    { "op": "header", "layout": "rows: state=rest (default), focus · columns: size=SM (default), XS, MD, LG", "notes": ["behaviour: filter"] }
  ],
  "choices": [{ "lines": [5], "what": "a mode for tone", "web": "the web's file and line", "options": ["a new collection", "a version drawn once for each tone"], "suggest": "the first, because …" }],
  "compose": [{ "lines": [6], "what": "the usage of stored files", "why": "a new composition of three tiles; no property or copy makes it" }],
  "nothing": [{ "lines": [7], "why": "the set holds it already: the case stands on the sheet (read today)" }]
}
```

The operations are these seven, and only these.

| `op` | What it does |
| --- | --- |
| `names` | Changes the versions' names and nothing else; ids and keys stay. `renameProperty` (old to new), `renameValue`, `fold` (the versions matching `match` take the cells of `set`; an empty `match` is every version) and `dropProperty` (a property whose cell leaves every name; it then holds one value among the versions after the folds) are applied in that order. |
| `copy` | A new version as a copy of its twin (`from`, the twin's cells as they are after `names`), once for each entry of `to` (the cells that differ). `look` says in words what must then differ in the copy and where the web says so, or is `null` when the copy is right as it is. A copy with a `look` is finished by composing. |
| `property` | A yes-or-no (`BOOLEAN`, tied to a layer's `visible`) or a text (`TEXT`, tied to a text layer's `characters`) added to the set and tied to the layer named `layer` in every version that holds it. `layer` is the layer's name exactly as the read answered it; where the versions name it differently, or the layer does not exist yet, the line is `compose`. |
| `sheet` | The unit has no sheet `<Unit> cases`; one is made in its section. Its cases are then `case` operations. |
| `case` | One case on the sheet: an instance of the version `base` (cells after `names` and `copy`) with `props`, `text`, `swap` (a swap property and the component to put in, which must exist in the library) and `modes` (a variable collection and one of its modes). `replaces` is the usual sentence "the lone component `<name>` that stands on the sheet today is replaced by this instance", and a case that is `stands: false` in the spec and not on the sheet is listed here too. |
| `default` | The version that must stand at the top left, where the set's default is not the web's. |
| `header` | Once for each unit that has an operation: the layout clause the header holds when all the unit's operations are carried out, in the strict form (every property named once, in `rows:` or `columns:`, with every value, ` x ` between two properties of a side, ` (default)` after a default, `one row` or `one column` for a side with none), and the notes it ends with. It may carry `defaults`, `{ property: value }`. |

Rules for the form:

- **Name nothing you did not see.** A layer, a property, a value or a component comes from the read of the file or from the spec, and never from memory of how such a unit is usually built.
- **A mode that exists is an operation, and a mode that does not is a choice.** A variable mode set on an instance is an operation only where the library's core file holds the collection and the mode. Where it does not (a custom colour, a tone, an attached look), the line is a `choice` for the developer: say what the web draws (file and line) and what you suggest.
- **One line may need two operations,** a property and its case; both carry the same `lines`.
- **A `then` of a move rule** (what a moved instance still owes) goes into `compose` with `"then": true`, and the units that own the instances.
- **Where the record and the file disagree,** keep the operation true to the file and write the difference in the report. A line already true in the file goes to `nothing`, with what you saw.

### The walk

1. **Write the operation files, one writer for each page or part of one, reading only.** For each unit read its spec whole, its record, and the unit as it stands (a read-only call: the set's properties, its versions' names, the layers of its default version, its section, its sheet and its cases). Read the web only where a line cannot be made exact without it, and name the file and line.
2. **Check the files offline, with no call to Figma:** `node skills/design/scripts/operations-check.mjs --ops <operation files> --specs <specs> --readings <readings> [--modes <file.json>]`. It checks that each line is accounted for once, that each operation holds what its kind needs, that the names stay unique after the `names` operations, that a copy starts from a version that is there and makes one that is not, that a case and a default name a version that is there, and that the header names every property once and gives every version a place. `--modes` is a JSON object of `{ "<collection>": ["<mode>", …] }` read from the core file; without it a mode is not checked. Go on only when it says `0 with faults`.
3. **Prepare the page's calls by a program, never by hand:** `node skills/design/scripts/operations-calls.mjs prepare --page "<page's name>" --ops … --specs … --readings … --plan <page plan> --out <output folder>`. The page plan is a list of pages, each with its `page`, its `pageId` and its `units` (`unit`, and `changes` for a unit whose spec removal is carried out first); the header comment of the program states every file and its form. It writes a dry file and a real file for each step the page has, `expected.json` (what each set must hold at the end), and a line for what it leaves out. Where it meets a thing only a decision can settle, it stops, writes nothing and names the unit and the reason: a `replaces` that is not the usual sentence, a case whose `why` says it is repointed, a copy that brings in a property no version holds, a unit with no set whose lone component has no id. Settle each one by reading the unit and its record, write the decision in a decisions file (`--decisions <file.json>`, its form in the program's header comment), and prepare again. A decision names the unit and the case, and it is a fact about the file, so it never goes into the program. `node skills/design/scripts/operations-calls.mjs summary …` prints one line for each page and what each leaves open, and changes nothing.
4. **Have the developer's named version saved first** (step 2 of the walk in `change-library.md`), and send the page's calls in the order below, alone in the file. Each call is passed whole and unchanged (connector rules 20 and 23). Its answer is `{ script, runs, of, stopped, answers }`, one answer for each run in the order of `<name>.inputs.json`. Read every answer. A `-dry` call changes nothing. **Send a `-real` call only when every answer of its dry call says what the table asks.** A step whose files are not in the folder is not owed on this page. A call that says `stopped` because seconds passed is sent again as it is: every script leaves standing what is done (`stood`). Each dry call is sent after the real call of the step before it, because it reads what that step left.

| Step | Files | The dry answer must say |
| --- | --- | --- |
| Read | `01-read.js`; save its answer as `read.json` in the page's folder, then run the program's `layout` stage | Nothing is refused. The `layout` stage prints a FAULT when a set is not in the state the calls expect; stop and report. |
| Names | `02-names-dry`, `03-names-real` | `problems` empty for each run; `renamed` and `some` read like the unit's `names` operations. Real: the same `renamed`. |
| Copies | `04-copy-dry`, `05-copy-real` | `problems` empty, no `refused`; `made` names exactly the copies `expected.json` gives. `slotProbe: "owed"` is no problem: a twin holds a slot, and the real call first makes one probe copy, reads whether the slot is still a slot, and removes the probe. Real: write down `tiedAgain` and `slotProbe`. `kept` means the copies were made like any others; `lost` means that unit is refused with nothing changed, which is that unit's own. |
| Properties | `06-property-dry`, `07-property-real` | `problems` empty, `wouldTie` at least 1; write down `versionsWithoutLayer`. |
| Headers | `08-header-dry`, `09-header-real` | `problems` empty; `now` is `was` with only its layout clauses changed and its notes added at the end. A header with no layout clause is that unit's problem. |
| Layout | `10-layout-dry`, `11-layout-real` | Each answer says `mode: "dry"`. An answer that says `refused` is that set's own; send the real call for the others. |
| Labels | `12-labels-dry`, `13-labels-real` | `problems` empty for each set; `removed` holds only row and column labels of that set, never `Usage`, `Cases`, `Parts` or a sheet's own label; `rows` and `columns` read like the header's layout. A set whose layout was refused answers with problems and writes nothing. If any other set's dry answer holds a problem, do not send the real call. Never send `13-labels-real` twice. |
| Sheets | `14-sheet-dry`, `15-sheet-real` | `problems` empty; `stood` true, or false with a `box`. |
| Cases | `16-cases-dry`, `17-cases-real` | Read `made`, `replaced`, `stood`, `stoodDifferent` and `problems` for each unit. A `replaced` entry says what the standing component holds and what the real call does with it: `rename` (right already), `keep` (its one instance stays and takes the case's values) or `rebuild` (its children are removed and a new instance goes in). **Where any entry says `rebuild`, the real call would remove drawn layers: do not send it, report the dry answer whole and stop the page there.** Write every `stoodDifferent` and every `nothingToReplace` entry (a case made new because the component it replaces is not on the sheet) in the report. Real: no problem that says a property or a mode was refused. |

5. **Take one picture of each section a call changed (`get_screenshot`, `maxDimension` 1200) and look at it:** does each new version sit in the set, does a new sheet hold its cases and stand clear of the rest, does a case look like its name, does a label meet anything. A set too large for its section until the page is aligned is expected.
6. **Prove the page at its end.** Send `18-read.js` as a call of its own, save the answer as `after.json` in the page's folder, and run the program's `check` stage. For each set it says whether every version that stood keeps its key under the name the operations give it, whether the new versions are exactly the copies (the count of versions also proves that no probe copy was left behind), whether the default carries the header's defaults, and whether the header holds the layout and the notes. A set it calls `FAULT` is looked at before anything goes on.
7. **Leave what is not an operation.** Nothing a file lists under `compose` or `choices` is done here, and no `look` of a copy: a copy stands as its twin for now. `align.js` and the scan do not run until the page is composed.

**A page that was partly done is taken from the start like any other,** because every script leaves standing what is done. Its dry answers then say so (`renamed` 0, a copy in `stood`, a header `stood` true, a case in `stood`), and that is right. Send the read again, save it over `read.json`, and run the `layout` stage. One answer reads like a fault and is none: a `names` dry run that says `two versions would be named […]` for a unit whose copies already stand. The operation adds a property to every version, and said again it would give the copies the twin's value; the script sees that and changes nothing in that unit.

**When a step fails:**

- A run's answer that is a refusal or holds a problem is that unit's. Note it whole and go on with the others, except where the table says to stop.
- A run that threw (`threw` in an answer) ended the call. Send nothing changed, send `18-read.js` to see what stands, report the error whole and stop the page.
- A real call whose answers differ from its dry call's in what is made, renamed or replaced stops the page: send `18-read.js` and report.
- A call stopped by the safety check or refused by the permission check is never sent again and never another way (see the next walk).

## What only an eye can do: composing

What the operations leave is a list, written for the page before composing starts, from the operation files: for each unit its `compose` entries (each with the words of the spec lines it accounts for; `then: true` marks a value that a moved instance still owes), its **looks** (each version a copy made, with its twin's name and the operation's `look`), its `choices` (settled ones are carried out word for word; one that says open is left untouched), and its **waits** (cases that wait for the composing, and cases given to the hand). A unit is finished when a person who opens its section sees what the web draws, and the proof is a picture. The record decides the design; where the record and the file disagree, report it and decide nothing.

### The composer and the closer

Closing a page is a fixed cost: `align.js` twice and the four scan parts, about 150 thousand characters sent whole, and a writer has room for about a dozen long calls. Composing costs by the line. The numbers are in "The measure and the pace" in `change-library.md`. So a page is shared:

- **A composer** takes the units named for it, composes them, and does not close the page: no `align.js`, no scan. It places a new thing where the book puts it in its section, clear of its neighbours. It works unit by unit, smallest first, and writes its report after each unit. It stops at a clean point when its room runs short: no half-made version in a set, every version that stands whole and named. It says which units it did not reach.
- **A closer** takes one page that is composed and does only the page's end: `align.js` in mode `plan`, repairs by the book where the plan names problems, `align.js` in mode `run`, then all four scan parts. It composes nothing.

### How a unit is composed

1. **Look before you make.** Read the unit as it stands and build like its neighbours: the same layer names, the same variables, the same auto layout. Look whether a line already stands before you draw it.
2. **Read before and read after, each in a call of its own.** Before the first change to a set, read every version in one read-only call: name and key, and for each layer you may touch its type, name, text style, font, size, fills and strokes with what they are bound to, and its property ties. Save the answer. After the last change, send the same read as a new call, save it, and compare: every version you did not mean to change must read exactly as before. An answer read inside the call that made the change is no proof: on one set a call read right in its own answer and the damage showed only in the next call.
3. **Do a unit's copies in one call.** For a `look`, read from two versions at different sizes what a size changes (paddings, gaps, text styles, icon sizes, radii and the variables they are bound to) and apply the same to each copy. Bind to the variables the neighbours are bound to, never a raw number where a neighbour has a variable.
4. **Text layers of one set can follow each other.** A change of a text property on one version's text layer (case, decoration, font) was applied to all 24 versions of a set, because their layers held one text style and were tied to one property. A text style covers font, size, line height, letter spacing, case and decoration. Before you change such a property on a text layer, take the style off that layer only, set on the layer the values the style gave it (bound to the variables the style's values are bound to), then set the look, then read every version in a new call. Never change a text style itself. Figma has no dashed text decoration (solid, dotted and wavy only): draw the nearest and name the approximation in the report.
5. **A copy with a slot.** A clone of a version turns a slot into a frame. Make one copy first: clone the twin, name it, append it to the set; in the copy make a slot with the version's `createSlot()`, give it the frame's name, place among its siblings, layout, item spacing with its bound variable, paddings, wrap and alignments, and empty fills and strokes; move the frame's children into it, remove the frame, and tie the slot with `componentPropertyReferences = { slotContentId: <the key of the set's slot property> }`. `createSlot()` also adds a new slot property to the set: remove it with `set.deleteComponentProperty(<the new key>)` in the same call, and prove in the after-read that the set holds one slot property, the old one. If the slot cannot be made or tied, remove that one copy, report the error whole and leave the unit. Make the other copies the same way.
6. **A case's name is `property=value`,** joined by `, ` for more than one, and the scan blocks any other. Where a record names a case otherwise (`one key (Esc)`), name it by the property and the value it shows (`label=Esc`) and write both names in the report. A case goes on the unit's sheet as a component holding one instance of the unit with its slot filled or its properties set; a usage goes into the unit's section as the book places it, its layer and caption beginning `usage · <Unit>`.
7. **A new variant property renames every version of the set.** Correct the header's layout clause, and send `layout.js` and `labels.js`, dry and then real. Say so in the report with the count. Where two column labels meet because a column is narrower than its label, move the columns apart, each as wide as the wider of its label and its versions, and each label with its column.
8. **Take one picture of the unit after its last change and look at it.** If it is not what the web draws, repair it once; if it is still not right, leave it and say plainly what is wrong.

### What is never done

- **Never remove a published thing to make it again.** A version, a case that is a component, a lone component and a set keep their ids and keys; change what is inside them. Remove only what you made yourself in this run, or a layer inside a component. A component that holds drawn layers and is to hold an instance keeps its node: remove its children and put the instance in. A case a record says is removed is removed only after a read of the page proves that no instance stands on it, and its key is written in the report.
- **No experiment in the library file.** Make nothing there to try something out, also not to remove it again. If you must learn how an API behaves, read; if a read cannot tell you, report the question and leave the unit.
- **No new variable, collection or mode, and no change to a script.** Where a line needs a design choice the record did not make (a property no layer can carry, a swap with no component named), leave the line and give the reason in one sentence. That is a right outcome.
- **A unit that goes wrong stops at once.** If a picture or an after-read shows a change you did not mean, stop that unit, repair only what your before-read proves was there, write it up at the top of the report, and go on. If you cannot repair it from the before-read, stop altogether.
- **If the same error comes twice from one API,** stop that unit and report it. Do not try a third way.

### A call that is refused or stopped

- **The permission check refuses a call that changes a library when the order did not name the change.** It has refused a call that moved or wrote the labels of a set. A refused call is not sent again and its work is not done another way: write the call's text whole into the report so that the developer can allow it, and go on with what does not depend on it.
- **The safety check stops a call whose text broke off.** A call that changes the file and is stopped is never sent again, and never another way: stop that unit, report it whole, go on with the next. For `align.js` the developer decided on 2026-10-10 that it is sent once more, whole and unchanged, after planning first; if the check stops an `align.js` call a second time, no `align.js` call is sent again by anyone, on any page: stop and report it whole. A scan part only reads and has its own rule (the next walk).
- **A page whose `align.js` plan names problems you may not repair stays unclosed.** Report the plan's problems whole and send the scan parts all the same.

### The page's end (the closer)

1. **`align.js`, passed as it is, mode `plan` first, then `run`.** Take the file's length in characters (`wc -c`), pass every character, and check that what you pass ends with the file's last line. Fill `INPUTS` and change nothing else. `fails` must be empty. A fail that names a thing you can repair by the book (a label on the wrong side, a thing outside its section) is repaired and the script run again; a fail you cannot explain is reported whole.
2. **The four scan parts, each as it is with the page's id,** and each answer's findings in the report. A blocking finding on something this page's composing drew is repaired once and the part run again. A finding on something the composing did not touch is reported and left.
3. **Write `passedByException` and `unitsWithoutCases` into the report as they are.**

## The scan as one pass

Each page is scanned as it is finished, and some pages are changed again afterwards. So when all writing is done, **every page is scanned once more, all four parts, after the last change.** The result of that one pass is what the developer's confirmation to publish rests on, and a part that is not read leaves a hole in it. The worth of a run is that every part of its pages is read, and reported exactly.

- **Readers run side by side, each with its own pages.** A reader only reads. It changes nothing in Figma, sends no `align.js`, composes nothing and repairs nothing.
- **For each page, the four parts in this order:** `scan-placement.js`, `scan-sets.js`, `scan-labels.js`, `scan-properties.js`. Read each script's header comment for its inputs; fill `INPUTS` with the page's id and change nothing else, not a line. One page in a call; never `loadAllPagesAsync`. For a second page send the same text with only the page id changed.
- **Read the script file once, right before its first use,** and know its length and its last line. Send it in a reply that holds that one tool call and no other text, before or after it (connector rule 23).
- **A scan part that comes back as anything but its own answer is sent once more.** An answer that is "Interrupted", or "Code executed with no return value", or anything that is not the script's own answer, means the text broke off. Send that part one more time, whole, in a reply of its own. This holds for the scan parts because they only read. If the second sending fails too, do not send a third: write "not read" for that part, with what came back, and go on to the next part.
- **Report page by page as you go.** For each page a table with one row for each part: clean or not; every finding that is not 0, with its name, its count, and the ids and names the scan gives, whole; `passedByException` and `unitsWithoutCases` where the part gives them; how many sendings the part took. Say nothing about what a finding means or how to repair it. The repair is another task.
- **A page is clean when all four parts say `clean`;** a part not read is not clean, and the page is reported as not fully read.
