// What a suite of the `spn-surface` plugin is written against: the plugin root, found once.
//
// THE PLUGIN ROOT IS FOUND, NEVER COUNTED. The suites mirror `src/`, so they sit at many depths —
// a `..` hop per suite would be a constant every move has to update, which is the defect the mirror
// was meant to remove rather than introduce.
import { resolve } from "node:path";

export const PLUGIN = resolve(import.meta.dirname, "..", "..");
