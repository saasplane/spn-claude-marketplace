// `stack.ts` — the stack of the repository that owns a path, read from the nearest `sprepo.json` and
// never typed or guessed. spn-apps resolves its provider with it and spn-surface will too, so the
// cases are proven once here.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..");
const { stackOf } = await import(pathToFileURL(resolve(HERE, "src", "lib", "stack.ts")).href);

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

const root = mkdtempSync(join(tmpdir(), "support-lib-stack-"));
process.on("exit", () => rmSync(root, { recursive: true, force: true }));
const repo = (name, manifest) => {
  mkdirSync(join(root, name, "apps", "web", "src"), { recursive: true });
  if (manifest !== undefined) writeFileSync(join(root, name, "sprepo.json"), manifest);
  return join(root, name, "apps", "web", "src", "a.tsx");
};

console.log("=== stackOf — the claim sits in the repository's own manifest");

same("a stack is lowercased from the declaration's own spelling",
  stackOf(repo("declares", JSON.stringify({ type: "APPS", config: { mtype: "APPS", stack: "TS" } }))), "ts");
same("a manifest with no config answers null", stackOf(repo("no-config", JSON.stringify({ type: "APPS" }))), null);
same("a config with no stack answers null", stackOf(repo("no-stack", JSON.stringify({ config: { mtype: "GENERAL" } }))), null);
same("an empty stack answers null", stackOf(repo("empty-stack", JSON.stringify({ config: { stack: "" } }))), null);
same("a manifest that is not JSON answers null, never a throw", stackOf(repo("broken", "{ not json")), null);
same("the walk stops at the first manifest, so a nearer one without a stack hides a farther one",
  (() => {
    const inner = repo("outer", JSON.stringify({ config: { stack: "TS" } }));
    mkdirSync(join(root, "outer", "apps", "web", "nested"), { recursive: true });
    writeFileSync(join(root, "outer", "apps", "web", "sprepo.json"), JSON.stringify({ config: {} }));
    return stackOf(inner);
  })(), null);
same("a path inside no repository answers null", stackOf(join(root, "outside", "a.tsx")), null);

console.log(failed ? `\n  ${failed} of ${total} FAILED — stack` : `\n  all ${total} passed — stack`);
process.exit(failed ? 1 : 0);
