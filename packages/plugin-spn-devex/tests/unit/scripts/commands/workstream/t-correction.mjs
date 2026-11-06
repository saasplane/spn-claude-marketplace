// `workstream correction write` — a correction the developer made on something already answered: one log line, counted by what answered it,
// with the work map's row or the reference to amend printed; `none` is recorded and does not count (MKT.SCRIPTS.521).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cli, dataWorkspace } from "../../../../helpers/workstream-fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const { root, ws } = await dataWorkspace("correction");
const log = () => readFileSync(join(ws, "arcs", "N001", "log.jsonl"), "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
const write = (extra) => cli(root, ["workstream", "correction", "write", "031/N001", "--said", "active, not isActive", "--ref", "spn-foundation/docs/05-code.md:332", "--work", "server-contract", ...extra]);

console.log("=== a correction is one log line, counted by what answered it");
{
  const book = write(["--answered-by", "book"]);
  const line = log().filter((one) => one.kind === "correction").at(-1);
  ok("[MKT.SCRIPTS.521] a correction answered by the book is logged with what answered it, the reference and the work", book.code === 0 && line.answeredBy === "book" && line.ref.endsWith("05-code.md:332") && line.work === "server-contract" && line.note === "active, not isActive", book.out);
  ok("[MKT.SCRIPTS.521] the command prints the map row to amend, in the same work", book.out.includes("counts as 1") && book.out.includes("work-map.md row server-contract (Learned)"), book.out);
  write(["--answered-by", "code"]);
  const none = write(["--answered-by", "none"]);
  ok("[MKT.SCRIPTS.521] a decision nothing had answered is logged and does not count", none.code === 0 && none.out.includes("does not count") && log().filter((one) => one.kind === "correction").length === 3, none.out);
  const shown = cli(root, ["workstream", "state", "show", "031"]);
  ok("[MKT.SCRIPTS.521] state show counts the corrections by what answered them, and not the one that answered nothing", shown.out.includes("corrections 2 (book 1, code 1)"), shown.out);
}

console.log("\n=== a correction that cannot be placed is refused");
{
  const unknown = cli(root, ["workstream", "correction", "write", "031/N001", "--said", "x", "--answered-by", "book", "--ref", "a.md:1", "--work", "no-such-work"]);
  ok("[MKT.SCRIPTS.521] red: a kind of work the map does not hold is refused, naming the kinds", unknown.code !== 0 && unknown.out.includes("server-contract"), unknown.out);
  const open = cli(root, ["workstream", "correction", "write", "031/N001", "--said", "x", "--answered-by", "the-web", "--ref", "a.md:1", "--work", "preview"]);
  ok("[MKT.SCRIPTS.521] red: what answered it is one of book, code, review or none", open.code !== 0 && open.out.includes("book"), open.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream correction` : `\n  all ${total} passed — workstream correction`);
process.exit(failed ? 1 : 0);
