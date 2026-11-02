// `lib/telemetry-values.ts` — the plugins' copy of the telemetry values spnutils' contract holds, and the patterns a
// row's free-text fields are held to (RULE.DEVEX.WORKSPACE.185). The copy names exactly the skill folders the four
// plugins ship; a row whose workstream, arc, part, retryOf, check or test.node is off its pattern is written with null
// there; a log whose first line has no `v` is moved to `.1.jsonl` before the append. Every write runs in a temporary
// workspace, in a child process with `SPN_TELEMETRY` removed.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  ARC_PATTERN, CHECK_PATTERN, ID_PATTERN, NODE_PATTERN, PART_PATTERN, SPDevExAgentSkillType, SPDevExStageType, SPDevExWorkstreamWorkType,
  TELEMETRY_VALUES, WORKSTREAM_PATTERN, held, known, skillValue, stageOf,
} from "../../../src/lib/telemetry-values.ts";
import { appendLog } from "../../../src/lib/debug-store.ts";

const LIB = resolve(import.meta.dirname, "..", "..", "..", "src", "lib");
const PACKAGES = resolve(import.meta.dirname, "..", "..", "..", "..");
const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-telemetry-values-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

console.log("=== SPDevExAgentSkillType — exactly the skill folders the four plugins ship");
{
  const shipped = [];
  for (const plugin of readdirSync(PACKAGES).filter((name) => /^plugin-spn-(devex|surface|apps|infra)$/.test(name))) {
    const skills = join(PACKAGES, plugin, "src", "skills");
    if (!existsSync(skills)) continue;
    const domain = plugin.replace(/^plugin-spn-/, "").toUpperCase();
    for (const folder of readdirSync(skills, { withFileTypes: true }).filter((entry) => entry.isDirectory()))
      shipped.push(`${domain}_${folder.name.toUpperCase().replace(/-/g, "_")}`);
  }
  const values = Object.values(SPDevExAgentSkillType);
  same("[MKT.SCRIPTS.329] four plugins ship 24 skill folders", shipped.length, 24);
  same("[MKT.SCRIPTS.329] the copy holds 24 values", values.length, 24);
  same("[MKT.SCRIPTS.329] every shipped folder is a value of the copy", shipped.filter((one) => !values.includes(one)).sort(), []);
  same("[MKT.SCRIPTS.329] every value of the copy is a shipped folder", values.filter((one) => !shipped.includes(one)).sort(), []);
  same("[MKT.SCRIPTS.329] each key is its value", Object.entries(SPDevExAgentSkillType).filter(([key, value]) => key !== value), []);
  same("[MKT.SCRIPTS.329] every enum the copy holds is frozen and reachable by name",
    Object.entries(TELEMETRY_VALUES).filter(([, one]) => !Object.isFrozen(one)).map(([name]) => name), []);
}

console.log("\n=== skillValue and stageOf");
{
  same("[MKT.SCRIPTS.329] a Skill call's name is its value, with the plugin or without", [skillValue("spn-devex:execute"), skillValue("execute"), skillValue("/spn-apps:verify"), skillValue("spn-surface:design")],
    ["DEVEX_EXECUTE", "DEVEX_EXECUTE", "APPS_VERIFY", "SURFACE_DESIGN"]);
  same("[MKT.SCRIPTS.329] a name the copy does not hold is null", [skillValue("spn-devex:nothing"), skillValue(7), skillValue(null)], [null, null, null]);
  same("[MKT.SCRIPTS.329] a stage skill gives its own stage", [stageOf("DEVEX_SCM", null), stageOf("APPS_NEW", null), stageOf("INFRA_VERIFY", null), stageOf("APPS_RELEASE", null), stageOf("SURFACE_DESIGN", null)],
    [SPDevExStageType.SCM, SPDevExStageType.SCM, SPDevExStageType.TEST, SPDevExStageType.DELIVER, SPDevExStageType.IDEATE]);
  same("[MKT.SCRIPTS.329] execute, check and report take the stage from the work",
    ["DOCS", "CODE", "GENERATED", "TEST", "PROOF", "RELEASE", "DESIGN", null].map((work) => stageOf("DEVEX_EXECUTE", work)),
    ["DEVELOP", "DEVELOP", "DEVELOP", "TEST", "TEST", "DELIVER", null, null]);
  same("[MKT.SCRIPTS.329] no skill, no stage", [stageOf(null, "CODE"), stageOf("UNKNOWN", "CODE")], [null, null]);
  same("[MKT.SCRIPTS.329] the work values are the contract's seven", Object.values(SPDevExWorkstreamWorkType), ["DOCS", "CODE", "GENERATED", "DESIGN", "TEST", "RELEASE", "PROOF"]);
}

console.log("\n=== held and known — a value that does not look like its field is null");
{
  same("[MKT.SCRIPTS.330] a workstream, an arc and a part on their patterns are kept", [held("036-agent-follows-rules", WORKSTREAM_PATTERN), held("N017", ARC_PATTERN), held("code-spn-claude-marketplace-4", PART_PATTERN)],
    ["036-agent-follows-rules", "N017", "code-spn-claude-marketplace-4"]);
  same("[MKT.SCRIPTS.330] off the pattern they are null", [held("36-x", WORKSTREAM_PATTERN), held("036-Upper", WORKSTREAM_PATTERN), held("N17", ARC_PATTERN), held("n017", ARC_PATTERN), held("Code Part", PART_PATTERN), held("-lead", PART_PATTERN)],
    [null, null, null, null, null, null]);
  same("[MKT.SCRIPTS.330] a retryOf, a check and a test node are held to theirs", [held("msg_01-ab", ID_PATTERN), held("a b", ID_PATTERN), held("split-plan", CHECK_PATTERN), held("Split Plan", CHECK_PATTERN), held("plugin-support-lib", NODE_PATTERN), held("../x", NODE_PATTERN)],
    ["msg_01-ab", null, "split-plan", null, "plugin-support-lib", null]);
  same("[MKT.SCRIPTS.330] what is not a string is null", [held(7, ARC_PATTERN), held(null, ARC_PATTERN), held(undefined, ARC_PATTERN)], [null, null, null]);
  same("[MKT.SCRIPTS.330] known gives the contract's value or null", [known(SPDevExWorkstreamWorkType, "CODE"), known(SPDevExWorkstreamWorkType, "altitude"), known(SPDevExWorkstreamWorkType, 3)], ["CODE", null, null]);
}

const env = () => { const copy = { ...process.env }; delete copy.SPN_TELEMETRY; return copy; };
const root = join(BASE, "w");
mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
writeFileSync(join(root, ".spndevex", "README.md"), "# .spndevex\n");
writeFileSync(join(root, ".spndevex", ".debug", "switches.json"), '{"telemetry": true}\n');
const logPath = join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl");
const logOf = () => readFileSync(logPath, "utf8").trim().split("\n").map((line) => JSON.parse(line));

console.log("\n=== a written row — off-pattern fields are null");
{
  execFileSync("node", ["--input-type=module", "-e", `
    import { begin, end, record } from ${JSON.stringify(join(LIB, "timing.ts"))};
    begin({ script: "spn-devex", event: "PreToolUse", tool: "Bash", session: "s", workstream: "36 agent", arc: "N17", part: "Bad Part", skill: "NO_SUCH_SKILL", work: "ALTITUDE" }, ${JSON.stringify(root)});
    record({ group: "x", action: "split-plan" }, 1);
    record({ group: "x", action: "Not A Name" }, 1);
    end();`], { env: env(), encoding: "utf8" });
  const rows = logOf();
  same("[MKT.SCRIPTS.329] a workstream, arc, part, skill and work off their values are written null", [rows[0].workstream, rows[0].arc, rows[0].part, rows[0].skill, rows[0].work], [null, null, null, null, null]);
  same("[MKT.SCRIPTS.329] retryOf is null", rows[0].retryOf, null);
  same("[MKT.SCRIPTS.329] a check whose name is off its pattern writes no row, never check: null", rows.map((row) => row.check), ["split-plan"]);
  same("[MKT.SCRIPTS.329] the first line carries `v`", rows[0].v, 1);
}

console.log("\n=== the arc field — N<nnn>, ideate and follow-ups");
{
  same("[MKT.SCRIPTS.491] ARC_PATTERN accepts N011, ideate and follow-ups", ["N011", "ideate", "follow-ups"].map((one) => ARC_PATTERN.test(one)), [true, true, true]);
  same("[MKT.SCRIPTS.491] ARC_PATTERN refuses N11, Ideate, follow-up and 012", ["N11", "Ideate", "follow-up", "012"].map((one) => ARC_PATTERN.test(one)), [false, false, false, false]);
  rmSync(logPath, { force: true });
  for (const arc of ["ideate", "other"])
    execFileSync("node", ["--input-type=module", "-e", `
      import { begin, end } from ${JSON.stringify(join(LIB, "timing.ts"))};
      begin({ script: "spn-devex", event: "PreToolUse", tool: "Bash", session: "s", arc: ${JSON.stringify(arc)} }, ${JSON.stringify(root)});
      end();`], { env: env(), encoding: "utf8" });
  same("[MKT.SCRIPTS.491] a row written with arc ideate holds it, and one with other holds null", logOf().map((row) => row.arc), ["ideate", null]);
}

console.log("\n=== the old log — a first line without `v` moves to .1.jsonl before the append");
{
  const old = join(BASE, "old", "telemetry", "hooks.jsonl");
  mkdirSync(join(BASE, "old", "telemetry"), { recursive: true });
  writeFileSync(old, '{"script":"spn-devex","group":"events","action":"pretooluse","altitude":"CODE"}\n');
  appendLog(old, JSON.stringify({ v: 1, mtype: "CHECK" }));
  same("[MKT.SCRIPTS.330] the old rows are in hooks.1.jsonl", readFileSync(join(BASE, "old", "telemetry", "hooks.1.jsonl"), "utf8").includes('"altitude"'), true);
  same("[MKT.SCRIPTS.330] the live file holds only the new row", readFileSync(old, "utf8"), '{"v":1,"mtype":"CHECK"}\n');
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — telemetry values` : `\n  all ${total} passed — telemetry values`);
process.exit(failed ? 1 : 0);
