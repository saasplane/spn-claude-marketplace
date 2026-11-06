// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A card is only for what the rules leave open
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream decision write <workstream>/<arc> --said "…" --because rule|book|code|purpose --ref <file[:line]> --reverse "…"
//   spn-devex workstream decision show <workstream>/<arc> [--json]
//
// An engineering call with a clear recommendation is the agent's: it decides it, logs it here with what settles it and the one line
// that reverses it, and reports it to the developer in one line. `state show` counts the calls, so each is reported and reversible.

import { type Action, FLAG, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { arcIdsOf, logEvent, logLinesOf } from "../../lib/workstream.ts";
import { BECAUSE, DECIDED_KIND, type LogLine } from "../../lib/workstream-schema.ts";
import { arcNamed } from "./_shared.ts";

export const describe = "an engineering call the agent decided, logged with what settles it and the line that reverses it";

/** The calls the agent decided on one arc or on every arc of a workstream, in the order they were logged. */
export function decisionsOf(ws: string, arc: string | null = null): LogLine[] {
  return (arc ? [arc] : arcIdsOf(ws)).flatMap((one) => (logLinesOf(ws, one) as LogLine[]).filter((line) => line?.kind === DECIDED_KIND));
}

function write(args: string[]): number {
  const words = readWords(args, { said: VALUE, because: BECAUSE, ref: VALUE, reverse: VALUE });
  if (words.paths.length !== 1) throw new UsageFault("takes one arc: `decision write <workstream>/<arc> --said \"…\" --because rule|book|code|purpose --ref <file[:line]> --reverse \"…\"`.");
  const { ws, arc } = arcNamed(words.paths[0]);
  const said = words.value("said");
  const because = words.value("because");
  const ref = words.value("ref");
  const reverse = words.value("reverse");
  if (!said?.trim() || !because || !ref?.trim() || !reverse?.trim()) throw new UsageFault("needs `--said`, `--because`, `--ref` and `--reverse`: the call, what settles it, the file or rule, and the one line that reverses it.");
  logEvent(ws, arc, DECIDED_KIND, null, said, { because, ref, reverse });
  console.log(`logged · decided by the agent · report it in one line: ${said} (reverse: ${reverse})`);
  return 0;
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length !== 1) throw new UsageFault("takes one arc: `decision show <workstream>/<arc> [--json]`.");
  const { ws, arc } = arcNamed(words.paths[0]);
  const found = decisionsOf(ws, arc);
  if (words.given("json")) { console.log(JSON.stringify(found, null, 2)); return 0; }
  if (!found.length) console.log("no call decided by the agent");
  for (const line of found) console.log(`${line.at} · ${String(line.note)} · because ${String(line.because)} (${String(line.ref)}) · reverse: ${String(line.reverse)}`);
  return 0;
}

export const actions: Record<string, Action> = {
  write: { describe: "log an engineering call the agent decided, with what settles it and the one line that reverses it", usage: "<workstream>/<arc> --said \"…\" --because rule|book|code|purpose --ref <file[:line]> --reverse \"…\"", run: write },
  show: { describe: "print the calls the agent decided on an arc", usage: "<workstream>/<arc> [--json]", run: show },
};
