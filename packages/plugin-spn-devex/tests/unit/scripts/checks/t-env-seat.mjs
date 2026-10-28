import { compare, WORKSPACE } from "../../../helpers/harness.mjs";
import { homedir } from "node:os";

const HOME = process.env.HOME || homedir();
const seat = (prefix) => `${prefix}/.spnenv`;

const cases = [
  // KNOWN-BAD — every route that puts a value on screen.
  { label: "Bash: cat the seat by tilde", expect: "deny",
    payload: { tool_name: "Bash", tool_input: { command: `cat ${seat("~")}` } } },
  { label: "Bash: a line range by $HOME", expect: "deny",
    payload: { tool_name: "Bash", tool_input: { command: `sed -n '72,89p' ${seat("$HOME")}` } } },
  { label: "Bash: ${HOME} inside double quotes", expect: "deny",
    payload: { tool_name: "Bash", tool_input: { command: `grep KEY "${seat("${HOME}")}"` } } },
  { label: "Bash: the absolute path this machine has", expect: "deny",
    payload: { tool_name: "Bash", tool_input: { command: `tail -5 ${seat(HOME)}` } } },
  { label: "Bash: a keys-only pipeline is refused too, by design", expect: "deny",
    payload: { tool_name: "Bash", tool_input: { command: `cut -d= -f1 ${seat("~")}` } } },
  { label: "Bash: a heredoc that only QUOTES the path", expect: "deny",
    payload: { tool_name: "Bash", tool_input: { command: `cat <<'EOF' > note.md\nthe seat is at ${seat("~")}\nEOF` } } },
  { label: "Read: the tool pointed at the seat", expect: "deny",
    payload: { tool_name: "Read", tool_input: { file_path: seat(HOME) } } },
  { label: "Grep: a search whose path is the seat", expect: "deny",
    payload: { tool_name: "Grep", tool_input: { pattern: "TOKEN", path: seat("~") } } },
  { label: "Glob: a glob naming the seat", expect: "deny",
    payload: { tool_name: "Glob", tool_input: { glob: seat("~") } } },

  // UNTOUCHED — the doors that stay open. A guard that refuses these is one people work around.
  { label: "Bash: the keys-only door", expect: "silent",
    payload: { tool_name: "Bash", tool_input: { command: "spnutils workspace status" } } },
  { label: "Bash: an ordinary command", expect: "silent",
    payload: { tool_name: "Bash", tool_input: { command: "git status --short" } } },
  { label: "Bash: a different dotfile in the same home", expect: "silent",
    payload: { tool_name: "Bash", tool_input: { command: `cat ${HOME}/.zshrc` } } },
  { label: "Bash: a file whose name merely ends in env", expect: "silent",
    payload: { tool_name: "Bash", tool_input: { command: "cat ./apps/api/.env" } } },
  { label: "Read: an ordinary source file", expect: "silent",
    payload: { tool_name: "Read", tool_input: { file_path: `${WORKSPACE}/CLAUDE.md` } } },
  { label: "Write: content that names the seat is not a render", expect: "silent",
    payload: { tool_name: "Write", tool_input: { file_path: "/tmp/x.md", content: `see ${seat("~")}` } } },
  { label: "unparsable tool: allows", expect: "silent",
    payload: { tool_name: "Task", tool_input: {} } },
];

process.exit(compare("env-seat", ["@/env-seat.py"], "env-seat.ts", cases) ? 1 : 0);
