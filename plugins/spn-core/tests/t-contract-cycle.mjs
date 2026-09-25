// `contract-cycle` — the check the hook audit found dispatched and never once fired across 17
// sessions. A guard nobody has ever seen work is a guard nobody has evidence for, so the known-bad
// here is a real cycle written into a real seat on disk.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const HOOKS = resolve(import.meta.dirname, "..");
const SCRIPTS = resolve(HOOKS, "scripts");
const EVENTS = resolve(HOOKS, "src", "scripts", "events");

// THESE SUITES ARE A BUILDER'S GATE, and they say so rather than pretending otherwise. Several cases
// name real files in the surrounding workspace — a chapter, an approach page, this workstream's own
// arcs — because what they prove is that the check agrees with the incumbent ON THE CORPUS, and a
// corpus cannot be invented. A partner holds the plugin without the workspace and runs
// `partner-shape.ts` instead, which needs nothing but the plugin itself.
const WORKSPACE = resolve(HOOKS, "..", "..", "..");

// THE PARITY ARM IS THE INCUMBENT, AND THE INCUMBENT IS GOING AWAY. Until the plugin reinstall
// deletes `hooks/scripts/`, every case runs both implementations and requires them to agree. After
// that the Python is not there to run, and each case still asserts what the port itself must decide
// — which is the half that outlives the port.
const hasPython = (name) => existsSync(resolve(SCRIPTS, name));

const BASE = "/private/tmp/claude-501/-opt-work-saasplane-code/ca4d9391-8043-477a-926d-fabfa4253bdf/scratchpad/fixtures/cycle";

let n = 0, failed = 0;

/** A states seat on disk. `files` is { stem: source }. Returns the seat folder. */
function seat(files) {
  n += 1;
  const dir = join(BASE, `s${n}`, "src", "contract", "states");
  rmSync(join(BASE, `s${n}`), { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [stem, body] of Object.entries(files)) writeFileSync(join(dir, `${stem}.ts`), body, "utf8");
  return dir;
}

function verdict(cmd, args, payload) {
  let out;
  try { out = execFileSync(cmd, args, { input: JSON.stringify(payload), encoding: "utf8" }).trim(); }
  catch (e) { return [`error`, String(e.stderr ?? e.message).slice(0, 200)]; }
  if (!out) return ["silent", ""];
  try {
    const parsed = JSON.parse(out.split("\n").filter(Boolean).at(-1));
    const specific = parsed.hookSpecificOutput ?? {};
    return specific.permissionDecision === "deny"
      ? ["deny", specific.permissionDecisionReason ?? ""] : ["silent", ""];
  } catch { return ["unparsable", out.slice(0, 200)]; }
}

function one(label, files, writing, expect, expectLoop) {
  const dir = seat(files);
  const payload = { tool_name: "Write", tool_input: { file_path: join(dir, `${writing.stem}.ts`),
    ...(writing.content !== undefined ? { content: writing.content } : { new_string: writing.new_string }) } };
  const [ts, tsWhy] = verdict("node", [`${HOOKS}/src/scripts/checks/contract-cycle.ts`], payload);
  const [py, pyWhy] = hasPython("contract-cycle.py")
    ? verdict("python3", [`${SCRIPTS}/contract-cycle.py`, "--stdin"], payload)
    : [null, null];
  const loopOk = !expectLoop || (tsWhy.includes(expectLoop) && (pyWhy === null || pyWhy.includes(expectLoop)));
  const ok = ts === expect && (py === null || ts === py) && loopOk;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · ts ${ts} · py ${py}${expectLoop ? ` · names "${expectLoop}" ${loopOk}` : ""}`);
  if (!ok) console.log(`        ts: ${tsWhy.slice(0, 260)}\n        py: ${pyWhy.slice(0, 260)}`);
}

console.log("\n=== contract-cycle");

// KNOWN-BAD — the loops the guard exists for.
one("two states importing each other",
  { app: "import { R } from './role';\nexport type App = { r: R };\n", role: "export type R = string;\n" },
  { stem: "role", content: "import { App } from './app';\nexport type R = App;\n" },
  "deny", "app -> role -> app");

one("a three-file loop",
  { a: "import { B } from './b';\nexport type A = B;\n", b: "import { C } from './c';\nexport type B = C;\n", c: "export type C = string;\n" },
  { stem: "c", content: "import { A } from './a';\nexport type C = A;\n" },
  "deny", "a -> b -> c -> a");

one("an Edit, which carries only the replacement",
  { app: "import { R } from './role';\nexport type App = { r: R };\n", role: "export type R = string;\n" },
  { stem: "role", new_string: "import { App } from './app';\n" },
  "deny", "app -> role -> app");

// UNTOUCHED — every shape that is correct and must stay writable.
one("a one-way sibling import is right, and stays right",
  { app: "export type App = string;\n", role: "export type R = string;\n" },
  { stem: "role", content: "import { App } from './app';\nexport type R = App;\n" },
  "silent");

one("core.ts is the release valve, and both sides may use it",
  { core: "export type Id = string;\n", app: "import { Id } from './core';\nexport type App = Id;\n", role: "export type R = string;\n" },
  { stem: "role", content: "import { Id } from './core';\nimport { App } from './app';\nexport type R = [Id, App];\n" },
  "silent");

one("an import inside a comment is not an import",
  { app: "import { R } from './role';\nexport type App = R;\n", role: "export type R = string;\n" },
  { stem: "role", content: "// once: import { App } from './app';\n/* import { App } from './app'; */\nexport type R = string;\n" },
  "silent");

one("a file importing itself is not a loop",
  { app: "export type App = string;\n" },
  { stem: "app", content: "import { App } from './app';\nexport type App = string;\n" },
  "silent");

one("an import of a file that is not in the seat",
  { app: "export type App = string;\n" },
  { stem: "app", content: "import { X } from './nowhere';\nexport type App = X;\n" },
  "silent");

// A .ts file outside any states seat — the guard only ever speaks about that folder.
{
  n += 1;
  const dir = join(BASE, `s${n}`, "src", "services");
  mkdirSync(dir, { recursive: true });
  const payload = { tool_name: "Write", tool_input: { file_path: join(dir, "thing.ts"), content: "import { A } from './a';\n" } };
  const [ts] = verdict("node", [`${HOOKS}/src/scripts/checks/contract-cycle.ts`], payload);
  const [py] = hasPython("contract-cycle.py")
    ? verdict("python3", [`${SCRIPTS}/contract-cycle.py`, "--stdin"], payload)
    : [null];
  const ok = ts === "silent" && (py === null || py === "silent");
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  a .ts file outside a states seat\n        expect silent · ts ${ts} · py ${py}`);
}

console.log(failed ? `  ${failed} FAILED` : `  all ${n} passed`);
process.exit(failed ? 1 : 0);
