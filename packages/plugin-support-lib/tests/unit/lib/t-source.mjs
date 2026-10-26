// `source.ts` — the shared reader of a source file: the mask that blanks comment and string bodies, and
// the resulting text of a pending write. spn-apps and spn-surface each import it, so the cases are
// proven once here rather than once per plugin.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..");
const { inComment, mask, read, resultingText } = await import(pathToFileURL(resolve(HERE, "src", "lib", "source.ts")).href);

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

const dir = mkdtempSync(join(tmpdir(), "support-lib-source-"));
process.on("exit", () => rmSync(dir, { recursive: true, force: true }));

console.log("=== mask — comment and string bodies are blanked, and nothing else moves");

{
  const source = "const a = 'x{'; // b{\nconst c = `d`; /* e\nf */ g();\n";
  const masked = mask(source);
  same("the masked text is as long as the source", masked.length, source.length);
  same("every newline survives, so a line number still lines up", [...masked].map((ch, i) => (ch === "\n") === (source[i] === "\n")).every(Boolean), true);
  same("a brace inside a string is gone", masked.includes("{"), false);
  same("the code outside comments and strings is untouched", masked.startsWith("const a = ") && masked.includes("g();"), true);
  same("a character inside a line comment answers inComment", inComment(masked, source.indexOf("b{")), true);
  same("a character in code does not", inComment(masked, source.indexOf("g()")), false);
  same("an offset outside the text does not", [inComment(masked, -1), inComment(masked, masked.length)], [false, false]);
}
{
  const source = "const e = '😀'; f('}');";
  const masked = mask(source);
  same("a character outside the BMP keeps the lengths equal, so the next string is masked in the right place", [masked.length, masked.includes("}")], [source.length, false]);
}
{
  const source = "const s = 'it\\'s'; open();";
  same("an escaped quote does not end the string", mask(source).endsWith("open();"), true);
}

console.log("\n=== resultingText — what the write would produce, and what it adds");

{
  const file = join(dir, "a.ts");
  writeFileSync(file, "one\ntwo\nthree\n");
  same("a read of a file that is there is its text", read(file), "one\ntwo\nthree\n");
  same("a read of a file that is not there is null", read(join(dir, "none.ts")), null);
  same("a Write is its content, whole", resultingText({ file_path: file, content: "x" }, file), ["x", "x"]);
  same("an Edit is applied to what is on disk", resultingText({ file_path: file, old_string: "two", new_string: "2" }, file), ["one\n2\nthree\n", "2"]);
  same("replace_all replaces every occurrence", resultingText({ file_path: file, old_string: "e", new_string: "E", replace_all: true }, file), ["onE\ntwo\nthrEE\n", "E"]);
  same("an old string that is not on disk appends the fragment", resultingText({ file_path: file, old_string: "zzz", new_string: "tail" }, file), ["one\ntwo\nthree\n\ntail", "tail"]);
  same("an Edit of a file not on disk is the fragment", resultingText({ file_path: join(dir, "none.ts"), old_string: "a", new_string: "b" }, join(dir, "none.ts")), ["b", "b"]);
  same("a call with neither content nor new_string produces nothing", resultingText({ file_path: file }, file), [null, null]);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — source` : `\n  all ${total} passed — source`);
process.exit(failed ? 1 : 0);
