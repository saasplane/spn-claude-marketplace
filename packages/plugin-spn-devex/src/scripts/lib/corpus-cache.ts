// The corpus check's verdict store, in `~/.spnutils/cache/corpus/`: one immutable file per verdict,
// named by the content it describes, shared safely by every window on the machine. The rule it
// follows is spn-foundation `docs/02-constructs/01-devex/02-agent/04-plugins.md` § The shape of a
// plugin: a plugin's state lives in the machine store, never in the shared `.spndevex/` folder.

import { createHash, randomBytes } from "node:crypto";
import {
  closeSync, mkdirSync, openSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync, writeSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * The one way to move the store, and it exists for the plugin's own tests and measurements only.
 *
 * A user never sets this. The machine store is `~/.spnutils`, resolved the way the `spnutils` CLI
 * resolves it (`os.homedir()`), so every window on the machine shares one store.
 */
export const TEST_STORE_ENV = "SPN_CORPUS_CACHE_FOR_TESTS";

/** Bumped when the shape of a stored verdict changes, so an old file is never read as a new one. */
const SCHEMA = 1;
/** A lock this old belongs to a run that is not coming back. The corpus run's own budget is 10 s. */
const LOCK_STALE_MS = 60_000;
/** How often a waiting run looks for the verdict another run is computing. */
const POLL_MS = 50;
/** Verdicts nobody has written for this long are pruned. A pruned verdict is re-run once. */
const PRUNE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
/** A temporary file this old was left by a run that died between its write and its rename. */
const TEMP_STALE_MS = 60 * 60 * 1000;

export function storeDir(): string {
  return process.env[TEST_STORE_ENV] || join(homedir(), ".spnutils", "cache", "corpus");
}

/** What one subject's tools found. `findings` are the lines replayed verbatim on a later run. */
export type Verdict = {
  schema: number;
  key: string;
  subject: string;
  at: string;
  findings: string[];
  ran: Array<{ tool: string; rule: number }>;
};

/**
 * Where a verdict came from on this run.
 *
 *   ran         this run computed it and stored it
 *   replayed    it was already stored
 *   waited      another run was computing it, and this run read that run's verdict
 *   unshared    this run computed it and did not store it: it was partial, a tool failed, or the
 *               store could not be written or another run held the lock past this run's budget
 */
export type Source = "ran" | "replayed" | "waited" | "unshared";

/** What a subject's computation hands back. `store: false` keeps it out of the store. */
export type Computed = { findings: string[]; ran: Verdict["ran"]; store: boolean };

const sleepCell = new Int32Array(new SharedArrayBuffer(4));
function sleep(ms: number): void {
  Atomics.wait(sleepCell, 0, 0, ms);
}

/**
 * Every file under `dir` fed into `hash`, sorted by relative path, as path, size and bytes.
 *
 * Content, never modification times: a `touch` changes nothing a tool reads, and two checkouts
 * holding the same bytes should share one verdict. Dot-files, `node_modules`, `.git` and `dist` are
 * skipped. Returns false when the walk passed `limit` files, which makes the subject uncacheable
 * rather than cached from a partial read.
 */
export function hashFiles(hash: ReturnType<typeof createHash>, dir: string, limit: { left: number }): boolean {
  const files: string[] = [];
  const walk = (at: string, rel: string): boolean => {
    let entries: string[];
    try { entries = readdirSync(at); } catch { return true; }
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "dist") continue;
      const full = join(at, entry);
      let st;
      try { st = statSync(full); } catch { continue; }
      const relPath = rel ? `${rel}/${entry}` : entry;
      if (st.isDirectory()) { if (!walk(full, relPath)) return false; continue; }
      if (!st.isFile()) continue;
      if (limit.left-- <= 0) return false;
      files.push(relPath);
    }
    return true;
  };
  if (!walk(dir, "")) return false;
  files.sort();
  for (const rel of files) {
    let bytes: Buffer;
    try { bytes = readFileSync(join(dir, rel)); } catch { hash.update(`${rel}\0unreadable\0`); continue; }
    hash.update(`${rel}\0${bytes.length}\0`);
    hash.update(bytes);
  }
  return true;
}

/** One file's bytes fed into `hash`, or a marker saying it is absent. */
export function hashFile(hash: ReturnType<typeof createHash>, label: string, path: string): void {
  try {
    const bytes = readFileSync(path);
    hash.update(`${label}\0${bytes.length}\0`);
    hash.update(bytes);
  } catch { hash.update(`${label}\0absent\0`); }
}

function verdictPath(key: string): string { return join(storeDir(), `${key}.json`); }
function lockPath(key: string): string { return join(storeDir(), `${key}.lock`); }

/** The stored verdict for `key`, or null. A file that does not parse, or names another key, is a miss. */
export function readVerdict(key: string): Verdict | null {
  try {
    const saved = JSON.parse(readFileSync(verdictPath(key), "utf8"));
    if (saved?.schema !== SCHEMA || saved?.key !== key || !Array.isArray(saved?.findings)) return null;
    return saved as Verdict;
  } catch { return null; }
}

/**
 * Store a verdict: write a temporary file, then rename it over the final name.
 *
 * A RUN NEVER FAILS BECAUSE ITS BOOKKEEPING FAILED. A store that cannot be written costs the next run
 * a re-run, and returns false so the caller can say the verdict was not shared.
 */
export function writeVerdict(verdict: Verdict): boolean {
  const temp = join(storeDir(), `.${verdict.key}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`);
  try {
    mkdirSync(storeDir(), { recursive: true });
    writeFileSync(temp, `${JSON.stringify(verdict, null, 2)}\n`, "utf8");
    renameSync(temp, verdictPath(verdict.key));
    return true;
  } catch {
    try { unlinkSync(temp); } catch { /* never written */ }
    return false;
  }
}

function alive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; }
  catch (error: any) { return error?.code === "EPERM"; }
}

/** Take the lock for `key`, or return null when another live run holds it. */
function claim(key: string): (() => void) | null {
  const path = lockPath(key);
  try { mkdirSync(storeDir(), { recursive: true }); } catch { return null; }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = openSync(path, "wx");
      try { writeSync(fd, String(process.pid)); } finally { closeSync(fd); }
      return () => { try { unlinkSync(path); } catch { /* already removed as stale */ } };
    } catch (error: any) {
      if (error?.code !== "EEXIST") return null;
      // A LOCK IS ONLY RESPECTED WHILE ITS OWNER CAN STILL FINISH. A run killed mid-compute leaves
      // its lock behind, and a lock nobody removes would make every later run wait out its budget.
      let stale = false;
      try {
        const st = statSync(path);
        const owner = Number(readFileSync(path, "utf8").trim());
        stale = Date.now() - st.mtimeMs > LOCK_STALE_MS || (owner > 0 && !alive(owner));
      } catch { continue; }
      if (!stale) return null;
      try { unlinkSync(path); } catch { /* another run removed it first */ }
    }
  }
  return null;
}

/**
 * The verdict for `key`: replayed when stored, else computed once and stored for every other run.
 *
 * `waitUntil` is an absolute time. A run that finds another run computing the same key waits until
 * then for its verdict, and after it computes its own without storing it, so a stuck lock costs one
 * run its speed and never its answer.
 */
export function verdictFor(key: string, subject: string, compute: () => Computed, waitUntil: number): { verdict: Verdict; source: Source } {
  const stored = readVerdict(key);
  if (stored) return { verdict: stored, source: "replayed" };
  const make = (c: Computed): Verdict => ({ schema: SCHEMA, key, subject, at: new Date().toISOString(), findings: c.findings, ran: c.ran });
  for (;;) {
    const release = claim(key);
    if (release) {
      try {
        // THE SECOND LOOK IS WHAT MAKES IT ONE WRITE. Another run may have stored the verdict and
        // released the lock between this run's miss above and its claim.
        const late = readVerdict(key);
        if (late) return { verdict: late, source: "waited" };
        const computed = compute();
        const verdict = make(computed);
        return { verdict, source: computed.store && writeVerdict(verdict) ? "ran" : "unshared" };
      } finally { release(); }
    }
    const theirs = readVerdict(key);
    if (theirs) return { verdict: theirs, source: "waited" };
    if (Date.now() >= waitUntil) return { verdict: make(compute()), source: "unshared" };
    sleep(POLL_MS);
  }
}

/**
 * Remove verdicts nobody has written in `PRUNE_AFTER_MS`, and temporary files a dead run left.
 *
 * A verdict is never rewritten, so its age is the age of the corpus it describes, and an old one
 * describes a tree that has since moved on. Deleting one a run still wants costs that run a re-run.
 */
export function prune(now = Date.now()): void {
  let entries: string[];
  try { entries = readdirSync(storeDir()); } catch { return; }
  for (const entry of entries) {
    const full = join(storeDir(), entry);
    const limit = entry.endsWith(".tmp") ? TEMP_STALE_MS : entry.endsWith(".json") ? PRUNE_AFTER_MS : 0;
    if (!limit) continue;
    try { if (now - statSync(full).mtimeMs > limit) unlinkSync(full); } catch { /* gone already */ }
  }
}
