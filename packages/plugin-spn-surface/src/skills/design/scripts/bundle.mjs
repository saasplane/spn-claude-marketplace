// Makes one call for the connector out of one script and several fillings of its inputs.
//
//   node bundle.mjs --script <name.js> --inputs <file.json> --out <prefix> [--max 45000] [--seconds 60]
//
// A script of this folder is passed to `use_figma` once for each filling of its INPUTS, so a page of ten
// sets sends `layout.js` twenty times, dry and real. This writes the same work as one call: the script's
// body stands once, as a function of its INPUTS, and runs once for each entry of the inputs file, a JSON
// list of objects, each merged over the script's own defaults. The answer of the call is
// `{ script, runs, of, stopped, answers }`, the answers in the order of the list.
//
// The body is the script's own text from the line after its INPUTS block to its end, with nothing changed
// but two things the connector's rules ask of a call that does more than one run: a line that holds only a
// comment is left out, to keep the call under the connector's limit of 50,000 characters, and
// `figma.setCurrentPageAsync(` is replaced by a guard that switches the page once and throws if a later
// run asks for another page. So EVERY RUN OF ONE BUNDLE MUST WORK ON THE SAME PAGE: make one inputs file
// for each page.
//
// A run that throws ends the call: its entry is `{ threw }`, and the runs after it are not started. The
// call also stops by itself before a run when `--seconds` have passed, and says so in `stopped` with the
// index of the next run; make a new inputs file from that index on. When the inputs do not fit `--max`
// characters, several files are written, `<prefix>-1.js`, `<prefix>-2.js`, to be sent in that order.
// Prints one line for each file: its path, its runs and its length.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const argumentsGiven = process.argv.slice(2);
const valueOf = (flag) => {
  const at = argumentsGiven.indexOf(flag);
  return at < 0 || at + 1 >= argumentsGiven.length ? null : argumentsGiven[at + 1];
};
const script = valueOf("--script");
const inputsFile = valueOf("--inputs");
const prefix = valueOf("--out");
const max = Number(valueOf("--max") ?? 45000);
const seconds = Number(valueOf("--seconds") ?? 60);
const stop = (text) => { console.error(text); process.exit(2); };
if (!script || !inputsFile || !prefix) stop("usage: node bundle.mjs --script <name.js> --inputs <file.json> --out <prefix> [--max 45000] [--seconds 60]");

// A bare name is a script of this folder; a name with a `/` is a path to a script of the same form.
const text = readFileSync(script.includes("/") ? script : join(import.meta.dirname, script), "utf8");
const block = /const INPUTS = \{[\s\S]*?\n\};\n/.exec(text);
if (!block) stop(`${script} holds no INPUTS block`);
const isComment = (line) => line.trim().startsWith("//");
const before = text.slice(0, block.index).split("\n").filter((line) => line.trim().length > 0 && !isComment(line));
if (before.length > 0) stop(`${script} holds code before its INPUTS block, which a bundle would lose: ${before[0].trim()}`);
const defaults = block[0].slice("const INPUTS = ".length, block[0].lastIndexOf(";"));
const SWITCH = "figma.setCurrentPageAsync(";
const body = text.slice(block.index + block[0].length).split("\n").filter((line) => !isComment(line)).join("\n").trim();
if (body.split(SWITCH).length - 1 !== body.split(`await ${SWITCH}`).length - 1) stop(`${script} switches the page without \`await\`, which a bundle cannot guard`);

let inputs;
try { inputs = JSON.parse(readFileSync(inputsFile, "utf8")); } catch (error) { stop(`${inputsFile} is not JSON: ${error.message}`); }
if (!Array.isArray(inputs) || inputs.length === 0 || inputs.some((one) => one === null || typeof one !== "object" || Array.isArray(one))) stop(`${inputsFile} must hold a list of objects, one for each run`);

const callOf = (runs, first) => `const startedAtOfBundle = Date.now();
let pageOfBundle = null;
const pageOnce = async (page) => {
  if (pageOfBundle !== null && pageOfBundle !== page.id) throw new Error("a bundle works on one page: a run asked for " + page.id + " after " + pageOfBundle);
  if (pageOfBundle === null) { await ${SWITCH}page); pageOfBundle = page.id; }
};
const run = async (INPUTS) => {
${body.split(`await ${SWITCH}`).join("await pageOnce(")}
};
const DEFAULTS = ${defaults};
const RUNS = ${JSON.stringify(runs)};
const answers = [];
let stopped = null;
for (let at = 0; at < RUNS.length; at += 1) {
  if (Date.now() - startedAtOfBundle > ${seconds} * 1000) { stopped = { next: ${first} + at, why: "${seconds} seconds passed" }; break; }
  try { answers.push(await run({ ...DEFAULTS, ...RUNS[at] })); } catch (error) { answers.push({ threw: String(error && error.message ? error.message : error) }); stopped = { next: ${first} + at, why: "a run threw" }; break; }
}
return { script: ${JSON.stringify(script)}, runs: answers.length, of: RUNS.length, stopped, answers };
`;

const files = [];
let from = 0;
while (from < inputs.length) {
  let to = from + 1;
  if (callOf(inputs.slice(from, to), from).length > max) stop(`run ${from} alone makes a call of ${callOf(inputs.slice(from, to), from).length} characters, over --max ${max}`);
  while (to < inputs.length && callOf(inputs.slice(from, to + 1), from).length <= max) to += 1;
  files.push({ from, to, code: callOf(inputs.slice(from, to), from) });
  from = to;
}
files.forEach((file, at) => {
  const path = files.length === 1 ? `${prefix}.js` : `${prefix}-${at + 1}.js`;
  writeFileSync(path, file.code);
  console.log(`${path}: runs ${file.from} to ${file.to - 1}, ${file.code.length} characters`);
});
