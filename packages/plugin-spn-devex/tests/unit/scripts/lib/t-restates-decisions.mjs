// The `decisions` citation, as an object — `{ repo, row, seen }` — never a bare id. Each citation
// names the workspace member carrying the register (`repo`), the decision id (`row`), and the hash
// of that ROW'S OWN LINE (`seen`), never of the whole register file. Built after the developer
// dropped the bare-string form entirely: no citation here accepts one, and no fallback reads one.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  check, parse, registerPath, rowHash, rowText, seenHash, undeclared,
} from "../../../../src/scripts/lib/restates.ts";
import { POCKET } from "../../../../src/scripts/lib/docs-tree.ts";

let n = 0, failed = 0;
const one = (label, got, want) => {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}\n        got: ${JSON.stringify(got)}`); }
  else console.log(`  PASS  ${label}`);
};

const BASE = mkdtempSync(join(tmpdir(), "t-restates-decisions-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

const workspace = join(BASE, "ws");
const registerFile = registerPath(workspace, "spn-foundation");
mkdirSync(join(workspace, "spn-foundation", "docs", POCKET.registers), { recursive: true });
const ROW_LINE = "| RD.SUPPORT.APPS.086 | Scaffold and validate read one profile | prevents two ideas of a node | 2026-09-01 |";
writeFileSync(registerFile,
  "# Decisions\n\n| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n" +
  `${ROW_LINE}\n` +
  "| RD.SUPPORT.APPS.087 | Some other row | some other reason | 2026-09-02 |\n");

console.log("=== a bare-string decisions entry is refused, known-bad first");
{
  const refPath = join(BASE, "bare.md");
  writeFileSync(refPath, '<!-- spn:restates\n{\n  "decisions": ["RD.SUPPORT.APPS.086"]\n}\n-->\n\n# a ref\n');
  const [block, broken] = parse(refPath);
  one("a bare id in the decisions list is refused, not silently accepted", block, null);
  one("and the refusal names the shape it wants", broken, (g) => /object/.test(g) && /repo/.test(g) && /row/.test(g));
}

console.log("\n=== rowText / rowHash read one row's own line, never the whole register");
{
  one("rowText finds the row's own line", rowText(registerFile, "RD.SUPPORT.APPS.086"), (g) => g.includes("RD.SUPPORT.APPS.086") && g.includes("Scaffold"));
  one("rowHash is the hash of that line alone", rowHash(registerFile, "RD.SUPPORT.APPS.086"), seenHash(ROW_LINE));
  one("a row the register does not carry reads null", rowText(registerFile, "RD.APPS.999"), null);

  // KNOWN-BAD: A ROW CROSS-REFERENCES ANOTHER ROW IN ITS OWN PROSE, earlier in the file than that
  // row's own line. A bare "does this line mention the id" search returns the first row's text for
  // a lookup of the second row's id — the wrong row entirely, and two different citations then hash
  // the same.
  const crossRefRegister = join(BASE, "cross-ref.md");
  writeFileSync(crossRefRegister,
    "| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n" +
    "| RD.SUPPORT.APPS.001 | First rule, cites RD.SUPPORT.APPS.002 in its own prose. | because | 2026-01-01 |\n" +
    "| RD.SUPPORT.APPS.002 | Second rule, sharpens RD.SUPPORT.APPS.001. | because | 2026-01-02 |\n");
  one("a citation of the SECOND row is not satisfied by the FIRST row merely naming it",
    rowText(crossRefRegister, "RD.SUPPORT.APPS.002"), (g) => g !== null && g.includes("Second rule"));
  one("and the two rows hash differently",
    rowHash(crossRefRegister, "RD.SUPPORT.APPS.001") !== rowHash(crossRefRegister, "RD.SUPPORT.APPS.002"), true);
  {
    const before = rowHash(registerFile, "RD.SUPPORT.APPS.086");
    const src = readFileSync(registerFile, "utf8");
    writeFileSync(registerFile, src.replace("some other row", "a rewritten other row"));
    const after = rowHash(registerFile, "RD.SUPPORT.APPS.086");
    writeFileSync(registerFile, src); // restore
    one("editing an UNRELATED row leaves this row's hash where it was", before === after, true);
  }
}

console.log("\n=== check() — the four decisions findings, known-bad first");
{
  const refPath = join(BASE, "ref.md");
  const currentSeen = rowHash(registerFile, "RD.SUPPORT.APPS.086");

  const findingsFor = (decisions) => {
    writeFileSync(refPath, `<!-- spn:restates\n${JSON.stringify({ decisions })}\n-->\n\n# a ref\n`);
    const [block] = parse(refPath);
    return check(refPath, workspace, block, ["decisions"]);
  };

  one("a citation missing repo or row is refused",
    findingsFor([{ row: "RD.SUPPORT.APPS.086", seen: "x" }]),
    (g) => g.length === 1 && /repo/.test(g[0]) && /row/.test(g[0]));

  one("a register path that resolves to nothing is refused",
    findingsFor([{ repo: "spn-ghost", row: "RD.SUPPORT.APPS.086", seen: "x" }]),
    (g) => g.length === 1 && /does not resolve/.test(g[0]));

  one("a row the named register does not carry is refused",
    findingsFor([{ repo: "spn-foundation", row: "RD.APPS.999", seen: "x" }]),
    (g) => g.length === 1 && /does not carry/.test(g[0]));

  one("a rewritten row is refused, and the message says re-read, update, restamp",
    findingsFor([{ repo: "spn-foundation", row: "RD.SUPPORT.APPS.086", seen: "stale-hash" }]),
    (g) => g.length === 1 && /re-read the row, update the ref, then restamp/.test(g[0]));

  one("a current citation is clean",
    findingsFor([{ repo: "spn-foundation", row: "RD.SUPPORT.APPS.086", seen: currentSeen }]),
    (g) => g.length === 0);

  one("a citation with no seen at all is refused",
    findingsFor([{ repo: "spn-foundation", row: "RD.SUPPORT.APPS.086" }]),
    (g) => g.length === 1 && /nothing to compare/.test(g[0]));
}

console.log("\n=== undeclared() — a row named in prose the block's object citations do not declare");
{
  const refPath = join(BASE, "prose.md");
  writeFileSync(refPath,
    '<!-- spn:restates\n{\n  "decisions": [\n    { "repo": "spn-foundation", "row": "RD.SUPPORT.APPS.086", "seen": "x" }\n  ]\n}\n-->\n\n' +
    "# a ref\n\nSource of truth: RD.SUPPORT.APPS.086 and RD.SUPPORT.APPS.087.\n");
  const [block] = parse(refPath);
  const missing = undeclared(refPath, block);
  one("the declared row (RD.SUPPORT.APPS.086) is not reported as undeclared", missing.includes("RD.SUPPORT.APPS.086"), false);
  one("the row named in prose but not declared by an object citation (RD.SUPPORT.APPS.087) is reported",
    missing.includes("RD.SUPPORT.APPS.087"), true);
}

console.log("\n=== restates decisions --write — restamps after the developer's rewrite, never the prose");
{
  const devexRoot = join(BASE, "devex-ws");
  mkdirSync(join(devexRoot, ".spndevex"), { recursive: true });
  mkdirSync(join(devexRoot, "spn-foundation", "docs", POCKET.registers), { recursive: true });
  const reg = registerPath(devexRoot, "spn-foundation");
  writeFileSync(reg, `# Decisions\n\n${ROW_LINE}\n`);
  const refPath2 = join(devexRoot, "ref.md");
  const staleBody = '<!-- spn:restates\n{\n  "decisions": [\n    {\n      "repo": "spn-foundation",\n      "row": "RD.SUPPORT.APPS.086",\n      "seen": "deadbeef"\n    }\n  ]\n}\n-->\n\n# a ref\n\nProse untouched by the writer.\n';
  writeFileSync(refPath2, staleBody);
  const TOOL = join(import.meta.dirname, "..", "..", "..", "..", "src", "scripts", "commands", "restates", "decisions.ts");
  const out = execFileSync("node", [TOOL, "--write", refPath2], { encoding: "utf8" });
  const after = readFileSync(refPath2, "utf8");
  one("the writer reports one row restamped", out, (g) => /1 row\(s\) restamped/.test(g));
  one("the seen hash now matches the row's real text", after, (g) => g.includes(`"seen": "${rowHash(reg, "RD.SUPPORT.APPS.086")}"`));
  one("the prose is byte-identical — the writer never rewrites text, only the stamp",
    after.endsWith("Prose untouched by the writer.\n"), true);
  const [block2] = parse(refPath2);
  one("re-checking the restamped ref is clean", check(refPath2, devexRoot, block2, ["decisions"]).length, 0);
}

console.log(failed ? `\n  ${failed} of ${n} FAILED — restates decisions` : `\n  all ${n} passed — restates decisions`);
process.exit(failed ? 1 : 0);
