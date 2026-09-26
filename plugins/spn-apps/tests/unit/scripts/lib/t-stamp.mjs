// A HASH IS A PROMISE, AND TWO PLUGINS MUST MAKE IT IDENTICALLY.
//
// `spn-apps` carries its own copy of `seenHash` because a plugin is installed alone and cannot read
// another plugin's files. A copy that drifts would report every agreeing file as drifted, and a run
// whose findings are mostly wrong is a run nobody reads.
//
// So this suite hashes the same inputs with both copies and fails if they ever disagree. It is the
// only thing standing between the copy and silent divergence.
import { seenHash as mine, normalize } from "../../../../src/scripts/lib/stamp.ts";
import { seenHash as theirs } from "../../../../../spn-devex/src/scripts/lib/restates.ts";

let n = 0, failed = 0;
const one = (title, ok) => { n += 1; if (!ok) { failed += 1; console.log(`  FAIL ${title}`); } };

const cases = [
  ["plain text", "# A page\n\nOne line.\n"],
  ["trailing whitespace on a line", "# A page   \n\nOne line.\t\n"],
  ["blank lines at both ends", "\n\n\n# A page\n\nOne line.\n\n\n"],
  ["windows line endings", "# A page\r\n\r\nOne line.\r\n"],
  ["empty", ""],
  ["one character", "x"],
  ["multibyte", "# Ålesund — naïve café · 日本語\n"],
  ["a table", "| a | b |\n| --- | --- |\n| 1 | 2 |\n"],
];
for (const [title, text] of cases) one(`the two copies agree — ${title}`, mine(text) === theirs(text));

// The normalization must be the thing that makes them agree, not a coincidence of short inputs.
one("normalize strips trailing whitespace", normalize("a   \nb\t\n") === "a\nb");
one("normalize strips blank lines at both ends", normalize("\n\na\n\n") === "a");
one("a real difference still changes the hash", mine("a") !== mine("b"));

console.log(failed ? `${failed} of ${n} failed` : `all ${n} passed — stamp`);
process.exit(failed ? 1 : 0);
