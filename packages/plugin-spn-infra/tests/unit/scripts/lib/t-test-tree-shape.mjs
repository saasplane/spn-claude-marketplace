// The test-tree shape rules (N102 step 9): a case in the wrong tier folder is refused at write
// time, and a harness that looks like it re-checks the manifest gets a note rather than a denial —
// narrow on purpose, so a false positive costs a read rather than a lost edit.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { validate as tierShape } from "../../../../src/scripts/lib/test-file-outside-tier-folder.ts";
import { validate as manifestIdentity } from "../../../../src/scripts/lib/harness-reimplements-manifest-identity.ts";

const PRETOOLUSE = resolve(import.meta.dirname, "..", "..", "..", "..", "src", "scripts", "events", "pretooluse.ts");

let passed = 0;
const failures = [];

function check(title, verdict, want) {
  const got = verdict?.deny ? "deny" : verdict?.note ? "note" : "";
  if (got !== want) failures.push(`${title}: expected ${want || "silence"}, got ${got || "silence"}`);
  else passed += 1;
}

/** Run the whole dispatch chain, the way the hook really runs, rather than calling a subject
 * directly — this is what proves subjects.ts actually wires a new check in. */
function checkThroughPreToolUse(title, input, wantDeny) {
  const event = { session_id: "t", cwd: process.cwd(), tool_name: "Write", tool_input: input };
  let out = "";
  try {
    out = execFileSync(process.execPath, [PRETOOLUSE], { input: JSON.stringify(event), encoding: "utf8" }).trim();
  } catch (error) {
    out = String(error.stdout ?? "").trim();
  }
  let denied = false;
  try { denied = JSON.parse(out).hookSpecificOutput?.permissionDecision === "deny"; } catch { /* silence */ }
  if (denied !== wantDeny) failures.push(`${title}: expected ${wantDeny ? "deny" : "silence"}, got ${denied ? "deny" : "silence"}`);
  else passed += 1;
}

const NODE = "/tmp/estate/packages/infra-module-idp";

// 1 · a case-like file directly under tests/, with no tier folder — refused, EXCEPT run.sh.
check("a .tftest.hcl directly under tests/", tierShape(`${NODE}/tests/edge.tftest.hcl`, ""), "deny");
check("a .sh directly under tests/", tierShape(`${NODE}/tests/case.sh`, ""), "deny");
check("run.sh directly under tests/ is the one entry, not a case", tierShape(`${NODE}/tests/run.sh`, ""), "");
check("the repository-root tests/run.sh is the same entry", tierShape("/tmp/estate/tests/run.sh", ""), "");

// 2 · a .tftest.hcl in contract/ — contract/ takes only *.sh.
check("a .tftest.hcl in contract/", tierShape(`${NODE}/tests/contract/declaration.tftest.hcl`, ""), "deny");
check("a .sh in contract/ is the tier's own engine", tierShape(`${NODE}/tests/contract/declaration.sh`, ""), "");

// 3 · unit/ takes *.test.mjs and *.tftest.hcl, never *.sh.
check("a .sh in unit/", tierShape(`${NODE}/tests/unit/router.sh`, ""), "deny");
check("a .test.mjs in unit/ is the tier's own engine", tierShape(`${NODE}/tests/unit/router.test.mjs`, ""), "");
check("a .tftest.hcl in unit/ is the tier's own engine", tierShape(`${NODE}/tests/unit/naming.tftest.hcl`, ""), "");

// 4 · integration/ takes *.tftest.hcl, and *.sh only as acceptance.sh — the one render a test
//     file cannot stage.
check("a .test.mjs in integration/", tierShape(`${NODE}/tests/integration/module-seat.test.mjs`, ""), "deny");
check("a .tftest.hcl in integration/ is the tier's own engine", tierShape(`${NODE}/tests/integration/module-seat.tftest.hcl`, ""), "");
check("a plain .sh case in integration/ is refused", tierShape(`${NODE}/tests/integration/render.sh`, ""), "deny");
check("acceptance.sh in integration/ is the one sanctioned render", tierShape(`${NODE}/tests/integration/acceptance.sh`, ""), "");

// 5 · a folder that is not a tier, fixtures/ or helpers/.
check("a case in an unrecognised folder", tierShape(`${NODE}/tests/render/foo.sh`, ""), "deny");
check("helpers/case.sh is not a tier and is left alone", tierShape(`${NODE}/tests/helpers/case.sh`, ""), "");
check("fixtures/<name>/… owns its own shape", tierShape(`${NODE}/tests/fixtures/local-face/compose.env`, ""), "");
check("cloud/ is reserved and left unchecked", tierShape(`${NODE}/tests/cloud/anything.tftest.hcl`, ""), "");

// 6 · a file with no case-like extension, or no tests/ segment at all, is not this rule's business.
check("an ordinary source file", tierShape(`${NODE}/src/main.tf`, ""), "");
check("a .test.mjs outside any tests/ tree", tierShape(`${NODE}/scripts/router.test.mjs`, ""), "");

// 7 · the harness manifest-identity note — narrow: an embedded Python heredoc reading a manifest
//     file by name, inside a run.sh. Anything short of that is silence.
const PY_MANIFEST_CHECK = [
  "#!/usr/bin/env bash",
  "python3 <<'PY'",
  "import json",
  "d = json.load(open('spkind.json'))",
  "assert d['type'] == 'MODULE'",
  "PY",
].join("\n");
check("a run.sh embedding a Python manifest check", manifestIdentity(`${NODE}/tests/run.sh`, PY_MANIFEST_CHECK), "note");
check("a run.sh calling infra validate, not re-checking it", manifestIdentity(`${NODE}/tests/run.sh`,
  "#!/usr/bin/env bash\nset -uo pipefail\nsource \"$(dirname \"$0\")/helpers/case.sh\"\nrun_tier_files \"$(dirname \"$0\")\"\n"), "");
check("a Python heredoc with no manifest file named is not this rule's business",
  manifestIdentity(`${NODE}/tests/run.sh`, "python3 <<'PY'\nprint('hello')\nPY\n"), "");
check("a real trees's own run.sh, unmodified", manifestIdentity(`${NODE}/tests/run.sh`,
  "#!/usr/bin/env bash\nset -uo pipefail\ntests_dir=\"$(cd \"$(dirname \"$0\")\" && pwd)\"\nsource \"$tests_dir/helpers/case.sh\"\ncd \"$tests_dir/..\"\nbuild_step \"OpenTofu is on the path\" command -v tofu\nrun_tier_files \"$tests_dir\"\n"), "");
check("the check only applies to run.sh, not any shell file", manifestIdentity(`${NODE}/tests/contract/declaration.sh`, PY_MANIFEST_CHECK), "");

// 8 · the same two cases, run end to end through pretooluse.ts, to prove subjects.ts actually
//     wires these two checks into the dispatch chain rather than only into this file's imports.
checkThroughPreToolUse("end to end: a .tftest.hcl directly under tests/ is refused",
  { file_path: `${NODE}/tests/edge.tftest.hcl`, content: 'run "x" {}' }, true);
checkThroughPreToolUse("end to end: acceptance.sh in integration/ plans through",
  { file_path: `${NODE}/tests/integration/acceptance.sh`, content: "#!/usr/bin/env bash\n" }, false);

if (failures.length) {
  for (const f of failures) console.log(`  FAIL  ${f}`);
  console.log(`${failures.length} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`all ${passed} passed — test tree shape`);
