// `app-style` — a style forced onto a design-system unit is noted, through the `src` subject, and never refused.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { PLUGIN } from "../../../../../helpers/harness.mjs";

const { validate } = await import(join(PLUGIN, "src", "providers", "ts", "scripts", "checks", "src.ts"));

const BASE = mkdtempSync(join(tmpdir(), "t-app-style-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));
let total = 0, failed = 0;

/** `expect` is "note" or "" (silent); a deny is always a failure. */
function one(label, { path, content, expect, says = [] }) {
  total += 1;
  const file = join(BASE, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, "");
  const verdict = validate({ file_path: file, content });
  const kind = verdict?.deny ? "deny" : verdict?.note ? "note" : "";
  const text = verdict?.deny ?? verdict?.note ?? "";
  const ok = kind === expect && says.every((s) => text.includes(s));
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect || "silent"} · got ${kind || "silent"}`);
  if (!ok) console.log(`        said: ${text.slice(0, 300)}`);
}

const SCREEN = "apps/web-dmo/src/entry/routes/SignIn.tsx";
const STYLES = "apps/web-dmo/src/styles/app.css";

console.log("=== app-style — noted [MKT.HOOKS.142]");
one("[MKT.HOOKS.142] a forced ! utility on a unit", { path: SCREEN, expect: "note",
  content: 'export const A = () => <DSButton className="!bg-blue-600">Go</DSButton>;\n',
  says: ["!bg-blue-600 forces a style on DSButton", "app's stylesheet", "surface context"] });
one("[MKT.HOOKS.142] a colour set by hand on a unit", { path: SCREEN, expect: "note",
  content: 'export const A = () => <DSButton className="bg-blue-600 rounded">Go</DSButton>;\n',
  says: ["bg-blue-600 sets a colour by hand on DSButton"] });
one("[MKT.HOOKS.142] spacing set by hand on a unit", { path: SCREEN, expect: "note",
  content: 'export const A = () => <DSCard className="p-4">x</DSCard>;\n', says: ["p-4 sets spacing by hand on DSCard"] });
one("[MKT.HOOKS.142] a style prop on a unit", { path: SCREEN, expect: "note",
  content: 'export const A = () => <DSCard style={{ color: "red" }}>x</DSCard>;\n', says: ["DSCard"] });
one("[MKT.HOOKS.142] !important in the app stylesheet", { path: STYLES, expect: "note",
  content: ".card { color: red !important; }\n", says: ["!important"] });

console.log("\n=== app-style — silent");
one("[MKT.HOOKS.142] a unit with no forced style", { path: SCREEN, expect: "",
  content: 'export const A = () => <DSButton variant="primary">Go</DSButton>;\n' });
one("[MKT.HOOKS.142] layout utilities on a plain element", { path: SCREEN, expect: "",
  content: 'export const A = () => <div className="p-4 bg-blue-600">x</div>;\n' });
one("[MKT.HOOKS.142] a negation is not a forced utility", { path: SCREEN, expect: "",
  content: "export const A = ({ on }) => (!on ? <DSButton>Go</DSButton> : null);\n" });
one("[MKT.HOOKS.142] a file outside an app", { path: "packages/module-web-x/src/ui/A.tsx", expect: "",
  content: 'export const A = () => <DSButton className="!bg-blue-600">Go</DSButton>;\n' });

console.log(failed ? `\n  ${failed} of ${total} FAILED — app-style` : `\n  all ${total} passed — app-style`);
process.exit(failed ? 1 : 0);
