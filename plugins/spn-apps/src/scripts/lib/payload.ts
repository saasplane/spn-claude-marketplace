// The event a check is handed, the verdict it gives back, and the two functions that carry each
// across the process boundary. Named as `spn-devex/hooks/lib/payload.ts` names the same job, so a
// reader who has learned one plugin has learned both.
//
// WHY A VERDICT IS A RETURN VALUE. A check that prints its refusal and exits can have that refusal
// swallowed by whatever is reading its stdout — which is exactly what happened to `confirmed` in
// the core plugin, silently, for 147 fires. A check that RETURNS what it decided cannot lose it.
// Each file still runs alone: `emit` prints the same JSON the Python printed, on the same stdout.
//
// EXIT 0, ALWAYS. A refusal is the documented PreToolUse decision on stdout, never a non-zero exit.
// A hook that crashes takes every other gate in the chain down with it.


export type ToolInput = {
  file_path?: string;
  content?: string;
  new_string?: string;
  old_string?: string;
  replace_all?: boolean;
};

export type Payload = {
  tool_name?: string;
  tool_input?: ToolInput;
  cwd?: string;
  session_id?: string;
};

/**
 * What a check decided. `deny` refuses the call; `note` is advice the turn reads.
 *
 * `headline` is the one line shown beside a refusal. Not every check has one — `host-assertion`
 * printed a `systemMessage` with its denial and `read-verb-naming` did not, and that difference is
 * visible to the developer, so it is carried rather than smoothed away.
 */
export type Verdict = { deny?: string; note?: string; headline?: string } | null;

/** The event on stdin, or null when there is nothing parseable there. Unparsable input allows. */
export async function payload(): Promise<Payload | null> {
  const chunks: Buffer[] = [];
  try {
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Payload;
  } catch { return null; }
}

/** Print a verdict the way the Python did, on the same stdout. Silence is an allow. */
export function emit(verdict: Verdict): void {
  if (!verdict) return;
  if (verdict.deny) {
    process.stdout.write(JSON.stringify({
      ...(verdict.headline ? { systemMessage: verdict.headline } : {}),
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: verdict.deny,
      },
    }));
    return;
  }
  if (verdict.note) {
    process.stdout.write(JSON.stringify({
      systemMessage: verdict.note,
      hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: verdict.note },
    }));
  }
}

/** Whether this file is being run directly rather than imported by the dispatcher. */
export function runAlone(name: string): boolean {
  return Boolean(process.argv[1]) && process.argv[1].endsWith(name);
}
