// `cli.ts` — the one entry: `<group> [<subject>] <action> [<path>…] [options]`.
//
// THIS SUITE OWNS THE ENTRY. The plugin ships one command, `check scan`: `help` prints the grammar under
// the plugin's own name and lists it, an unknown group is refused by name, and the scan reads a seeded
// repository whole. The entry is the same text spn-devex and spn-apps ship.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const CLI = resolve(import.meta.dirname, "..", "..", "..", "src", "scripts", "cli.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

function run(...args) {
  try {
    return { out: execFileSync("node", [CLI, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 };
  }
}

console.log("=== cli — help lists the one command");
{
  const { out, code } = run("help");
  ok("exits clean", code === 0, out);
  ok("states the grammar with the plugin's own name", out.includes("`spn-surface <group> [<subject>] <action> [<path>…] [options]`"), out);
  ok("with no word at all the entry prints the same reading", run().out === out && run().code === 0, run().out);
}
{
  const { out, code } = run("help", "--json");
  let parsed;
  try { parsed = JSON.parse(out); } catch { parsed = null; }
  ok("--json exits clean and names the plugin", code === 0 && parsed?.plugin === "spn-surface", out);
  ok("--json lists `check scan` and nothing else",
    JSON.stringify(parsed?.commands?.map((listed) => listed.command)) === '["check scan"]', out);
}

console.log("\n=== cli — unknown names, refused by name");
{
  const { out, code } = run("nope", "nope");
  ok("an unknown group exits 2", code === 2, out);
  ok("names what was asked for, and the groups there are", out.includes("unknown group `nope`") && out.includes("groups: check"), out);
}

console.log("\n=== cli — `check scan` reads Surface code whole, and says what it cannot see");
{
  const root = realpathSync(mkdtempSync(join(tmpdir(), "spn-surface-scan-")));
  const put = (path, body) => { mkdirSync(join(root, path, ".."), { recursive: true }); writeFileSync(join(root, path), body, "utf8"); };
  put("sprepo.json", JSON.stringify({ type: "APPS", config: { mtype: "APPS", stack: "TS" } }));
  put("packages/web/spkind.json", JSON.stringify({ kind: "MODULE_WEB" }));
  put("packages/web/src/Page.tsx", "import { DSButton, DSVariantType } from '@saasplane/support-web-ds-ts';\n" +
    "export const Page = () => (\n  <div>\n    <DSButton variant={DSVariantType.SOLID} label=\"Save\" />\n    <DSButton variant={DSVariantType.SOLID} label=\"Cancel\" />\n  </div>\n);\n");
  const { out, code } = run("check", "scan", root);
  rmSync(root, { recursive: true, force: true });
  ok("exits clean: a scan reports, it never fails a run", code === 0, out);
  ok("names the file, the line and the note's book row", out.includes("Page.tsx:5: [button-one-solid]") && out.includes("RD.SUPPORT.SURFACE.370"), out);
  ok("counts the notes by rule, and says what it cannot see", out.includes("button-one-solid") && out.includes("What it cannot see"), out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — cli` : `\n  all ${total} passed — cli`);
process.exit(failed ? 1 : 0);
