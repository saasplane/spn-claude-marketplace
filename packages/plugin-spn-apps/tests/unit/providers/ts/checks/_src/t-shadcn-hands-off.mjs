// `shadcn-hands-off` (MKT.HOOKS.393) — any write under src/_shadcn/ is refused.
import { one, done, tree } from "../../../../../helpers/harness.mjs";

const IN = "apps/web-dmo/src/_shadcn/components/button.tsx";
const OUT = "apps/web-dmo/src/components/Button.tsx";
const TEXT = "export const Button = () => null;\n";

console.log("=== shadcn-hands-off — known-bad");
one("MKT.HOOKS.393 a Write under src/_shadcn", { script: "shadcn-hands-off", root: tree({ [IN]: TEXT }),
  input: { file_path: IN, content: TEXT }, expect: "deny", says: "shadcn CLI" });
one("MKT.HOOKS.393 an Edit under src/_shadcn", { script: "shadcn-hands-off", root: tree({ [IN]: TEXT }),
  input: { file_path: IN, old_string: "null", new_string: "undefined" }, expect: "deny", says: "outside src/_shadcn/" });
one("MKT.HOOKS.393 a hook file under src/_shadcn", { script: "shadcn-hands-off", root: tree({ "apps/web-dmo/src/_shadcn/hooks/use-mobile.ts": "" }),
  input: { file_path: "apps/web-dmo/src/_shadcn/hooks/use-mobile.ts", content: "export {};\n" }, expect: "deny", says: "wraps it" });

console.log("\n=== shadcn-hands-off — untouched");
one("MKT.HOOKS.393 a component outside src/_shadcn", { script: "shadcn-hands-off", root: tree({ [OUT]: TEXT }),
  input: { file_path: OUT, content: TEXT }, expect: "" });
one("MKT.HOOKS.393 a folder that only resembles it", { script: "shadcn-hands-off", root: tree({ "apps/web-dmo/src/shadcn-notes/a.ts": "" }),
  input: { file_path: "apps/web-dmo/src/shadcn-notes/a.ts", content: "export {};\n" }, expect: "" });

done("shadcn-hands-off");
