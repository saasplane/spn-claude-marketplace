// `one-component-per-file` (MKT.HOOKS.144) — a second exported component in a .tsx, a runtime export from an interfaces file.
import { one, done, tree } from "../../../../../helpers/harness.mjs";

const TSX = "apps/web-dmo/src/ui/Panel.tsx";
const IFACE = "apps/web-dmo/src/ui/interfaces.ts";
const go = (label, file, content, expect, says) =>
  one(`MKT.HOOKS.144 ${label}`, { script: "one-component-per-file", root: tree({ [file]: "" }), input: { file_path: file, content }, expect, says });

console.log("=== one-component-per-file — known-bad");
go("two exported function components", TSX,
  "export function Panel() { return null; }\nexport function Header() { return null; }\n", "deny", "its own .tsx file");
go("a function and an arrow component", TSX,
  "export function Panel() { return null; }\nexport const Header = () => null;\n", "deny", "Panel, Header");
go("a memo-wrapped second component", TSX,
  "export const Panel = () => null;\nexport const Row = React.memo((props) => null);\n", "deny", "Row");
go("a constant in an interfaces file", IFACE,
  "export interface A { id: string }\nexport const CODE_PATTERN = /^[A-Z]{3}$/;\n", "deny", "CODE_PATTERN");
go("an enum in an interfaces file", IFACE, "export enum Kind { A }\n", "deny", "types only");

console.log("\n=== one-component-per-file — untouched");
go("one component and a type", TSX, "export interface Props { id: string }\nexport function Panel(p: Props) { return null; }\n", "");
go("a hook beside the component is not a component", TSX, "export function Panel() { return null; }\nexport function usePanel() { return 1; }\n", "");
go("only types in an interfaces file", IFACE, "export interface A { id: string }\nexport type B = string;\n", "");
go("a component in a plain .ts file", "apps/web-dmo/src/ui/panel.ts", "export const A = 1;\nexport const B = 2;\n", "");
go("a component in a story file", "apps/web-dmo/src/ui/Panel.stories.tsx", "export function A() { return null; }\nexport function B() { return null; }\n", "");
{
  // An Edit that touches a different line of a file already holding two components is not blocked.
  const before = "export function Panel() { return null; }\nexport function Header() { return null; }\n";
  one("MKT.HOOKS.144 an unrelated edit to a file already over the line", { script: "one-component-per-file", root: tree({ [TSX]: before }),
    input: { file_path: TSX, old_string: "Panel() { return null; }", new_string: "Panel() { return 1; }" }, expect: "" });
}

done("one-component-per-file");
