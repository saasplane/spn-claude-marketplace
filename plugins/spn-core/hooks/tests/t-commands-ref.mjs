// `commands-ref` — the `spnutils` surface rendered into a ref, so an agent holds every command
// without shelling out to learn its own tooling.
//
// THE KNOWN-BAD HERE IS A SURFACE THAT MOVED. A generator is only worth having if a verb added to
// the CLI makes the region stale rather than silently wrong, so the cases below change the payload
// and require the fingerprint to move — and change things that are NOT the surface and require it
// to hold. That second half is the one that matters: without it the safe answer is to rewrite the
// region on every release, and a regeneration nobody needs is a regeneration somebody skips.
import { fingerprint, regionOf, render } from "../tools/commands-ref.ts";

let n = 0, failed = 0;
const one = (label, got, want) => {
  n += 1;
  const ok = got === want;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) console.log(`        want ${JSON.stringify(want)}\n        got  ${JSON.stringify(got)}`);
};

const cmd = (command, intent, options = []) => ({ command, intent, signature: `spnutils ${command}`, options });
const surface = (...commands) => ({ cli: "spnutils", commands });

const BASE = surface(
  cmd("apps build", "Build one node, the way its kind builds", [
    { param: "--package", alias: "-p", takes: "<package>", description: "the node" },
  ]),
  cmd("repo create", "Create the repository in the bound SCM if absent"),
  cmd("workspace status", "Read the ground"),
);

console.log("\n=== commands-ref — the fingerprint moves when the SURFACE moves");

one("a verb added moves it",
  fingerprint(BASE) === fingerprint(surface(...BASE.commands, cmd("apps clean", "Remove build output"))), false);

one("a verb renamed moves it",
  fingerprint(BASE) === fingerprint(surface(cmd("apps compile", "Build one node, the way its kind builds",
    BASE.commands[0].options), ...BASE.commands.slice(1))), false);

one("an option added moves it",
  fingerprint(BASE) === fingerprint(surface(
    { ...BASE.commands[0], options: [...BASE.commands[0].options, { param: "--json", alias: null, takes: null, description: "as data" }] },
    ...BASE.commands.slice(1))), false);

console.log("\n=== commands-ref — and HOLDS when the surface did not");

// THE LOAD-BEARING CASE. The CLI's own name is not its surface, and neither is a patch that changes
// nothing a caller can type. If either moved the hash, every release would force a plugin release
// for a region whose bytes are identical.
one("the CLI's own name is not the surface",
  fingerprint(BASE) === fingerprint({ ...BASE, cli: "spnutils-next" }), true);

one("the same surface hashes the same twice",
  fingerprint(BASE) === fingerprint(surface(...BASE.commands)), true);

console.log("\n=== commands-ref — what the region says");

const body = render(BASE, "1.2.64", fingerprint(BASE));
one("names the version it describes", body.includes("spnutils 1.2.64"), true);
one("says the CLI is the released one", body.includes("**released**"), true);
one("carries the surface stamp", body.includes(fingerprint(BASE)), true);
one("one table per group", /#### `apps`[\s\S]*#### `repo`[\s\S]*#### `workspace`/.test(body), true);
one("a command with no option reads —", body.includes("| `workspace status` | Read the ground | — |"), true);
one("options are listed with what they take", body.includes("`--package <package>`"), true);

console.log("\n=== commands-ref — reading a region back");

const REF = `# Command Vocabulary\n\nargument above.\n\n<!-- spn:generated commands — do not edit inside these markers; \`commands-ref.ts\` writes it -->\n${body}\n<!-- /spn:generated -->\n\nargument below.\n`;
one("round-trips what was written", regionOf(REF), body);
one("a file with no region reads null", regionOf("# nothing here\n"), null);

// An unterminated region is corruption rather than absence, and answering `null` would make the
// next `--write` append a SECOND region below the broken one.
one("an unterminated region reads null rather than to end of file",
  regionOf("start\n<!-- spn:generated commands — do not edit inside these markers; `commands-ref.ts` writes it -->\nhalf"), null);

console.log(failed ? `\n  ${failed} of ${n} FAILED — commands-ref` : `\n  all ${n} passed — commands-ref`);
process.exit(failed ? 1 : 0);
