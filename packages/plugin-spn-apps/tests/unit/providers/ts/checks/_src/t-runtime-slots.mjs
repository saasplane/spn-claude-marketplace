// `runtime-slots` (MKT.HOOKS.394) — an SPApp interface with a member beside config, providers and modules is refused.
import { one, done, tree } from "../../../../../helpers/harness.mjs";

const FILE = "packages/thing-ts/src/runtime/SPApp.ts";
const app = (body) => `export interface SPApp {\n${body}\n}\n`;
const go = (label, content, expect, says, file = FILE) =>
  one(`[MKT.HOOKS.394] ${label}`, { script: "runtime-slots", root: tree({ [file]: "" }), input: { file_path: file, content }, expect, says });

console.log("=== runtime-slots — known-bad");
go("a fourth member", app("  config: SPConfig;\n  providers: SPProvider[];\n  modules: SPModule[];\n  cache: Map<string, string>;"), "deny", "cache");
go("a method beside the slots", app("  config: SPConfig;\n  start(): Promise<void>;"), "deny", "start");
go("an optional member", app("  config: SPConfig;\n  extras?: string[];"), "deny", "extras");
go("the refusal names the corrected form", app("  other: string;"), "deny", "Put a setting in config");

console.log("\n=== runtime-slots — untouched");
go("exactly the three slots", app("  config: SPConfig;\n  providers: SPProvider[];\n  modules: SPModule[];"), "");
go("a slot with a nested object type", app("  config: { a: string; b: number };\n  providers: Array<SPProvider>;\n  modules: SPModule[];"), "");
go("another interface with other members", "export interface SPModule {\n  name: string;\n  cache: string;\n}\n", "");
go("a member only in a comment", app("  // cache: Map<string, string>;\n  config: SPConfig;"), "");
go("a file outside src", app("  cache: string;"), "", undefined, "packages/thing-ts/docs/SPApp.ts");
{
  // An Edit elsewhere in a file whose SPApp is already over the line is not blocked.
  const before = app("  config: SPConfig;\n  cache: string;") + "export const X = 1;\n";
  one("[MKT.HOOKS.394] an unrelated edit to a file already over the line", { script: "runtime-slots", root: tree({ [FILE]: before }),
    input: { file_path: FILE, old_string: "X = 1", new_string: "X = 2" }, expect: "" });
}

done("runtime-slots");
