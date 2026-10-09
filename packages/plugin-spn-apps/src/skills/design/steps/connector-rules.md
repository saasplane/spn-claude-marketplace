# Step: connector-rules — what a child agent needs to send `use_figma`

Read this step when you are an agent started by another and you are to send `use_figma` to change a component set. A child cannot read the connector's own skill resource, so these are the rules from it that a change of a set meets, in our words. The facts about how the connector behaves are in `refs/support/surface/delivery-library.md`, under "The connector's facts". Pass `skillNames: "resource:figma-use"` on each call; it is a name for logging, and it does not load the skill.

## The script

1. **Write plain JavaScript with top-level `await` and `return`.** Use no wrapper function and no `figma.closePlugin()`. `console.log` is not returned, and `figma.notify()` throws.
2. **Only the `return` value comes back.** Return every id made or changed, with counts and names: `return { createdNodeIds: [...], mutatedNodeIds: [...] }`. Nothing lives between calls, so pass an id from an earlier call into the script as text.
3. **Every call starts on the file's first page.** Switch with `await figma.setCurrentPageAsync(page)`, at most once in a call. `figma.currentPage = page` throws.
4. **Await every promise** (`getNodeByIdAsync`, `loadFontAsync`, `setCurrentPageAsync`).
5. **Load a text's fonts before any change near it.** Read the node's fonts with `getStyledTextSegments(['fontName'])`, call `await figma.loadFontAsync(...)` for each, then change it. This holds also for `appendChild`, `setBoundVariable` and a mode change on a node that holds text. Never guess a font style name: read `await figma.listAvailableFontsAsync()`.
6. **A colour runs from 0 to 1, and its paint's `color` holds `{r, g, b}` only.** Fills and strokes are read-only lists: copy, change the copy, assign it back. `setBoundVariableForPaint` returns a new paint, so keep it and assign it. An opacity set on a paint that is bound to a variable draws opaque, so the opacity goes on the layer.
7. **Sizing.** `layoutSizingHorizontal` and `layoutSizingVertical` take `FIXED`, `HUG` or `FILL` and are set on a child after it is appended to an auto layout parent. `primaryAxisSizingMode` and `counterAxisSizingMode` take `FIXED` or `AUTO` and are set on the frame. `resize()` resets the sizing to `FIXED`, so call it first.
8. **Read property definitions from the set, never from a version.** A version is a `COMPONENT` whose parent is a `COMPONENT_SET`, and it holds none. Check a node's `type` before you read a property that only some kinds have.

## The set

9. **A version's name is `property=value, property=value`.** A variant property exists because the versions' names carry it. Renaming `round=false` to `shape=SQUARE` in the name of every version renames the property and its value, and the versions keep their ids and keys.
10. **A new version is a copy of its nearest twin.** Copy with `twin.clone()`, set its `name`, `set.appendChild(copy)`, then place it by the set's grid and resize the set to hold it. The copy is a new component with a new key. It loses its property ties, and a slot in it becomes a plain frame, so compare it with its twin and tie it again.
11. **A set's default version is the one at its top left, not the first in its list of children.** Change the default by changing places in the grid, and read `set.defaultVariant.id` back after any move.
12. **A boolean or text property** is added with `set.addComponentProperty(name, 'BOOLEAN', false)`, which returns the key with its `#id` suffix. Tie a layer with `layer.componentPropertyReferences = { visible: key }` in every version. An instance takes values with `instance.setProperties({ 'prop': 'value' })`, and a boolean or text property needs the full key with its suffix.

## The call

13. **On an error, read `safeToRetryWithoutCanvasRead`.** If it is true, correct the script and send it again. If it is false, read the canvas first to see what changed, then go on. If the same API error comes twice, read the API's definition before a third try.
14. **Size a call so that it is safe to send again.** One set or one step to a call, a call under about 90 seconds, and about eight layers to a call on a set of hundreds of versions. Return evidence from each write (ids, counts, names, bounds), and take one picture after composing a set and one after a repair.
15. **Look before you make.** Read what the file holds and match its names and structure.
16. **Do only what your order names.** The permission check refuses a call that changes a library when the order did not name the change. A refused call is not sent another way: report it, and report what else you found.
