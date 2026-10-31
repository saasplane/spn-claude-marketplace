import { CHECKS, EVENTS, run } from "../../../helpers/harness.mjs";
// `checks/read-size.ts` — a `Read` with no range of a file over 20 KB passes with a note naming its size and the ranged form.
// A ranged read, a small file and a picture or a PDF are left alone.
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { workspace } from "../../../helpers/fixture.mjs";

const { checkReadSize } = await import(join(CHECKS, "read-size.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 500)}` : ""}`);
};

const root = workspace("read-size", { "big.md": "x".repeat(21 * 1024), "small.md": "x".repeat(20 * 1024), "big.pdf": "x".repeat(40 * 1024) });
writeFileSync(join(root, "big.png"), Buffer.alloc(40 * 1024));
const read = (file_path, more = {}) => ({ tool_name: "Read", tool_input: { file_path, ...more }, cwd: root, session_id: "w1" });

console.log("=== passed with a note");
{
  const verdict = checkReadSize(read(join(root, "big.md")));
  ok("[MKT.HOOKS.325] a whole read of a file over 20 KB passes", !verdict?.deny && Boolean(verdict?.note), JSON.stringify(verdict));
  ok("[MKT.HOOKS.325] the note names the size and the ranged form, offset and limit", /21 KB/.test(verdict?.note ?? "") && /offset/.test(verdict?.note ?? "") && /limit/.test(verdict?.note ?? ""), verdict?.note);
  ok("[MKT.HOOKS.325] the note is one line", !(verdict?.note ?? "").includes("\n"), verdict?.note);
  ok("[MKT.HOOKS.325] a path relative to the call's folder is read the same way", Boolean(checkReadSize(read("big.md"))?.note));
  const out = run("node", [join(EVENTS, "pretooluse.ts")], read(join(root, "big.md")), root);
  ok("[MKT.HOOKS.325] the pre-tool hook lets the read through with the note", !/permissionDecision/.test(out) && /21 KB/.test(out), out);
}

console.log("\n=== silent");
{
  ok("a file of exactly 20 KB is read whole", checkReadSize(read(join(root, "small.md"))) === null);
  ok("a ranged read of a big file passes (offset and limit)", checkReadSize(read(join(root, "big.md"), { offset: 1, limit: 80 })) === null);
  ok("a read with a limit alone passes", checkReadSize(read(join(root, "big.md"), { limit: 80 })) === null);
  ok("a picture is left alone", checkReadSize(read(join(root, "big.png"))) === null);
  ok("a PDF is left alone", checkReadSize(read(join(root, "big.pdf"))) === null);
  ok("a file that is not there is left to the tool", checkReadSize(read(join(root, "absent.md"))) === null);
  ok("a tool that is not Read is left alone", checkReadSize({ ...read(join(root, "big.md")), tool_name: "Edit" }) === null);
  const out = run("node", [join(EVENTS, "pretooluse.ts")], read(join(root, "big.md"), { limit: 50 }), root);
  ok("the pre-tool hook lets a ranged read through", !/permissionDecision/.test(out), out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-read-size` : `\n  all ${total} passed — t-read-size`);
process.exit(failed ? 1 : 0);
