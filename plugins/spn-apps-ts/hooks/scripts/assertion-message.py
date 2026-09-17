#!/usr/bin/env python3
"""Warn about a journey assertion that says nothing about why it might have failed.

**The rule.** An assertion names what it expected and what would explain the absence (rule 27 of
the tests chapter, RD.APPS.109). Writing that costs nothing at the time. Reading it later replaces
the spec, the component and the permission model. A case reporting `expected > 0, received 0` buys
the next reader an investigation. A case reporting that no channel editor rendered at all, and that
the session may lack `NTF_CONFIG_MANAGE`, has diagnosed itself.

**Which tier it judges: the journey tier, and only that.** A journey spec is a `.spec.ts` or
`.spec.tsx` under a `tests/journeys/` folder. A journey drives a real browser against a running
stack, so its failure arrives with none of the context that would explain it, and finding out why
costs about three times what writing the case cost.

**Which tiers it leaves alone, and why each is deliberate.**

  contract     The rule names this tier and the check cannot reach it. The contract tier runs under
               Jest, whose `expect` takes at most one argument and throws `Expect takes at most one
               argument.` on a second. There is nowhere for the message to go. That tier gets the
               rule from the step file instead.
  component    A component case and the component it mounts are one file apart, and the failure
               names the component. The diagnosis the journey tier pays for is not owed here.
  unit         A bare assertion in a unit test is defensible. The subject is named in the title,
               the file under test is short, and nobody reads a permission model to explain it.

**What counts as a message: a second argument to `expect`.** Playwright takes it as
`expect(value, 'message')`, on `expect.soft` and `expect.poll` alike, and prints it as the
failure's headline. Anything counts — a literal, a template literal, a variable. The check judges
that a message is there, never whether it is a good one. Whether the words name what would explain
the absence is a reading somebody has to do, and this script says so rather than pretending.

**It warns, and it does not refuse.** Its two denying siblings each had a clean tree behind them.
This one does not: both stack repos carry journey assertions written before the rule, and moving a
block of them reads to any write-time check as introducing them. A refusal on a proxy — the
presence of an argument, standing in for a judgement about prose — also teaches people to satisfy
it with filler, and filler reads as information while carrying none.

It reads the file the write would PRODUCE, never the fragment alone: an Edit carries only its
replacement, and a half-assertion scored on its own is how a hook reports green having checked
nothing. It then reports only an assertion the write itself introduces, so one elsewhere in the
file does not nag on an unrelated edit. Comment and string bodies are blanked first, so an
assertion quoted in a doc comment is never judged.

  hook :  assertion-message.py --stdin        (PreToolUse JSON on stdin; warns, never refuses)
  scan :  assertion-message.py <path> …       (any file or tree; prints every finding it can see)
"""
import importlib.util, json, os, re, sys

SKIP = {'node_modules', 'dist', 'build', '.git', '.nx', 'coverage', '.output', '__pycache__'}
SPEC = ('.spec.ts', '.spec.tsx')
JOURNEY_TIER = '/tests/journeys/'
# An assertion, as Playwright writes one. `expect.extend` and `expect.configure` are not matched,
# because neither asserts anything.
ASSERTION = re.compile(r'(?<![\w.$])expect(?:\.soft|\.poll)?\s*\(')
OPENERS = {'(': ')', '[': ']', '{': '}'}
CLOSERS = {')', ']', '}'}
REMEDY = ('Give the assertion a second argument naming what you expected and what would explain '
          'its absence: expect(editors, `the content page rendered no channel editor at all — the '
          'session may lack NTF_CONFIG_MANAGE`).toHaveCount(1). Playwright prints that as the '
          'failure headline, on expect, expect.soft and expect.poll alike, so the next reader '
          'starts with a diagnosis rather than with the spec and the component behind it.')

_SIBLING = None


def sibling():
    """`resulting_text`, `mask` and `introduced` live once, in the sibling hook. An Edit carries
    only its replacement, so it is applied to what is on disk before anything is measured, and
    comment and string bodies are blanked at the same offsets before anything is matched."""
    global _SIBLING
    if _SIBLING is None:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'enablement-grammar.py')
        spec = importlib.util.spec_from_file_location('enablement_grammar', path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        _SIBLING = module
    return _SIBLING


def watched(path):
    """A journey spec: a `.spec.ts` or `.spec.tsx` under a `tests/journeys/` folder."""
    normalized = os.path.abspath(path).replace(os.sep, '/')
    return normalized.endswith(SPEC) and JOURNEY_TIER in normalized


def argument_list(masked, open_paren):
    """Where this call's parentheses close, and how many arguments sit between them.

    The walk runs over the masked text, so a comma inside a string or a comment is already blank
    and can never look like an argument boundary. A call that never closes — a fragment, or a file
    this script cannot parse — answers None, and the caller leaves it alone.
    """
    depth, index, commas, content = 0, open_paren, 0, False
    while index < len(masked):
        char = masked[index]
        if char in OPENERS:
            depth += 1
        elif char in CLOSERS:
            depth -= 1
            if depth == 0:
                return index, (commas + 1 if content or commas else 0)
        elif char == ',' and depth == 1:
            commas += 1
        elif depth >= 1 and not char.isspace():
            content = True
        index += 1
    return None, 0


def findings(source, added):
    """Every assertion in this text that carries no message.

    `added` is the text the write introduces, or None for a scan. An assertion is reported only
    when the write carries one of its lines, so one written earlier does not nag on a later edit.
    """
    masked = sibling().mask(source)
    found = []
    for match in ASSERTION.finditer(masked):
        close_paren, arguments = argument_list(masked, match.end() - 1)
        if close_paren is None or arguments >= 2:
            continue
        start = source.rfind('\n', 0, match.start()) + 1
        end = source.find('\n', close_paren)
        if end == -1:
            end = len(source)
        if not sibling().introduced(source, (start, end), added):
            continue
        line = source.count('\n', 0, match.start()) + 1
        # An assertion may span lines, and a finding reads better on one.
        quoted = ' '.join(source[start:end].split())
        found.append(f'line {line}: {quoted[:110]}')
    return found


def warn(message):
    print(json.dumps({'systemMessage': message,
                      'hookSpecificOutput': {'hookEventName': 'PreToolUse',
                                             'additionalContext': message}}))


def run_stdin():
    try:
        event = json.load(sys.stdin)
    except Exception:
        return 0                                  # unparsable input allows, as the sibling hooks do
    tool_input = event.get('tool_input') or {}
    path = tool_input.get('file_path') or ''
    if not watched(path):
        return 0
    try:
        source, added = sibling().resulting_text(tool_input, path)
    except Exception:
        source = added = tool_input.get('content') or tool_input.get('new_string')
    if source is None:
        return 0
    try:
        found = findings(source, added)
    except Exception:
        return 0                                  # a parse this script cannot do allows, never blocks
    if not found:
        return 0
    lines = [f'A journey assertion says why it might have failed. In {os.path.basename(path)}:']
    lines += [f'  - {item}' for item in found]
    lines.append(f'  {REMEDY}')
    warn('\n'.join(lines))
    return 0


def run_scan(paths):
    total = 0
    for root in paths:
        targets = [root] if os.path.isfile(root) else []
        for base, folders, files in os.walk(root):
            folders[:] = [folder for folder in folders if folder not in SKIP]
            targets += [os.path.join(base, filename) for filename in files]
        for target in sorted(set(targets)):
            if not watched(target):
                continue
            try:
                with open(target, encoding='utf8', errors='replace') as handle:
                    source = handle.read()
            except OSError:
                continue
            for item in findings(source, None):
                total += 1
                print(f'{target}: {item}')
    print(f'\n{total} finding(s) — a journey assertion carrying no message')
    return 1 if total else 0


if __name__ == '__main__':
    paths = [argument for argument in sys.argv[1:] if argument != '--stdin']
    sys.exit(run_stdin() if '--stdin' in sys.argv else run_scan(paths or ['.']))
