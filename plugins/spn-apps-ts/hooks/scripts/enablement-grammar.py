#!/usr/bin/env python3
"""Refuse a write that breaks the enablement grammar, at the moment it is written.

The construct: an enablement answers ONE question about one organization TYPE — what is this
type offered. A permission answers what a PERSON may do. The full reasoning, the placement rule
and the three traps this estate actually hit are in `refs/permission-vs-enablement.md` in the
**spn-core** plugin. This script checks only the part a script CAN check.

Four rules, each named in its own denial:

  1 PREFIX    an enablement code starts with its OWNING module's prefix — `{MOD}_MANAGE_…`.
              A code carrying another module's prefix collides in the shared catalog.
  2 VERB      the code's second segment is `MANAGE`. That position is the whole discriminator:
              a permission is `{MOD}_{FAMILY}_{TIER}`, so a new verb makes the two unreadable.
  3 NOUN      a multi-value definition is named for its OPTIONS, never its area. Name it for the
              area and the console shows "Customization" holding a list of entity types.
  4 ORG TYPE  no hardcoded Set or array of `OrgType` values in a service. That is a product
              decision written as code — the RD.SAAS.033 shape — invisible to the console and
              changeable only by a release.

**Not checked here, on purpose.** *Every gated method is a write* needs the decorator-to-method
map, which no single-file write-time hook can build. It belongs in the module's own
`tests/unit/enablement/authz.spec.ts`, where the gate table and the methods are both in scope.

Scope is by path, and the two halves differ because the shapes differ:

  **/app/utils/authz.ts        rules 2 and 4 — the gate table names enum members, not codes
  **/migrations/*setup-a*.ts   rules 1, 2 and 3 — the seed carries the code literals
  **/app/services/*.ts         rule 4 only — a ceiling list in a MIGRATION is correct, and a
                               hardcoded org-type set in a SERVICE is the trap

It reads the file the write would PRODUCE, never the fragment alone: an Edit carries only its
replacement, and scoring that fragment is how a hook reports green having checked nothing. It
then denies only for a finding the write itself introduces, so a pre-existing violation
elsewhere in the file does not block an unrelated edit.

  hook :  enablement-grammar.py --stdin       (PreToolUse JSON on stdin; denies with the rule named)
  scan :  enablement-grammar.py <path> …      (any folder or repo; prints every finding it can see)
"""
import json, os, re, sys

ORG_TYPES = {
    "PLATFORM", "ACCOUNT",
    "PLATFORM_ENTERPRISE", "ACCOUNT_ENTERPRISE",
    "PLATFORM_CONSUMER", "ACCOUNT_CONSUMER",
}
# A selection is named for what it offers. These five name the AREA instead, which is what the
# boolean form is for — so a multi-value definition ending in one of them is rule 3.
GENERIC = {"CUSTOMIZATION", "MANAGEMENT", "CONFIG", "SETTINGS", "OPTIONS"}

COMMENT = "\x01"
STRING = "\x02"

REF = "See refs/permission-vs-enablement.md in the spn-core plugin (decisions RD.SAAS.033 · RD.SAAS.034)."


# ---------------------------------------------------------------- source masking

def mask(source):
    """Same-length text with comment bodies and string bodies blanked.

    Brace matching and key detection run over this, so a `{` inside a comment or a SQL string
    can never move the parser. Newlines survive, so line numbers still line up.
    """
    out = list(source)
    i, n = 0, len(source)
    while i < n:
        two = source[i:i + 2]
        if two == "//":
            while i < n and source[i] != "\n":
                out[i] = COMMENT
                i += 1
        elif two == "/*":
            while i < n and source[i:i + 2] != "*/":
                if source[i] != "\n":
                    out[i] = COMMENT
                i += 1
            for j in range(i, min(i + 2, n)):
                out[j] = COMMENT
            i += 2
        elif source[i] in "'\"`":
            quote = source[i]
            i += 1
            while i < n and source[i] != quote:
                if source[i] == "\\":
                    if source[i] != "\n":
                        out[i] = STRING
                    i += 1
                if i < n:
                    if source[i] != "\n":
                        out[i] = STRING
                    i += 1
            i += 1
        else:
            i += 1
    return "".join(out)


def in_comment(masked, index):
    return 0 <= index < len(masked) and masked[index] == COMMENT


def enclosing_object(masked, index):
    """The `{ … }` literal that directly contains `index`, or None."""
    depth, start = 0, None
    for i in range(index - 1, -1, -1):
        char = masked[i]
        if char == "}":
            depth += 1
        elif char == "{":
            if depth == 0:
                start = i
                break
            depth -= 1
    if start is None:
        return None
    depth = 0
    for i in range(start, len(masked)):
        char = masked[i]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return (start, i + 1)
    return None


def balanced(masked, start, opener, closer):
    """The region from `start` (which holds `opener`) to its matching `closer`, or None."""
    depth = 0
    for i in range(start, len(masked)):
        char = masked[i]
        if char == opener:
            depth += 1
        elif char == closer:
            depth -= 1
            if depth == 0:
                return (start, i + 1)
    return None


# ---------------------------------------------------------------- path scope

def is_authz(path):
    return path.replace(os.sep, "/").endswith("/app/utils/authz.ts")


def is_seed(path):
    p = path.replace(os.sep, "/")
    base = os.path.basename(p)
    return "/migrations/" in p and base.endswith(".ts") and re.search(r"setup-a", base) is not None


def is_service(path):
    p = path.replace(os.sep, "/")
    return "/app/services/" in p and p.endswith(".ts")


def watched(path):
    return is_authz(path) or is_seed(path) or is_service(path)


MODULE_FROM_SOURCE = (
    re.compile(r"\bexport\s+const\s+([A-Z][A-Z0-9]*)_AUTHZ\b"),
    re.compile(r"\b([A-Z][A-Z0-9]*)_ENABLEMENT_(?:SEED|DEFINITION_IDS)\b"),
    re.compile(r"\b([A-Z][A-Z0-9]{1,7})EnablementType\b"),
)


def module_of(path, source):
    """The module a file belongs to, by its own evidence first.

    The folder is the least reliable witness: the sample module lives in `src/modules/project/`
    and its codes are prefixed `PRJ`. So the file's own symbols are read first, then the
    migration's name, then the package folder.
    """
    for pattern in MODULE_FROM_SOURCE:
        found = pattern.search(source)
        if found:
            return found.group(1)
    base = os.path.basename(path)
    found = re.search(r"^\d+-([a-z][a-z0-9]{1,7})-setup-", base)
    if found:
        return found.group(1).upper()
    found = re.search(r"/module-server-([a-z][a-z0-9]{1,7})-[a-z]+/", path.replace(os.sep, "/"))
    if found:
        return found.group(1).upper()
    return None


# ---------------------------------------------------------------- the four rules

CODE_LITERAL = re.compile(r"\bcode\s*:\s*['\"]([A-Z][A-Z0-9_]*)['\"]")
FIELD_MULTI = re.compile(r"\b(?:fieldType|mtype)\s*:\s*['\"]([A-Z_]*_MULTI)['\"]")
ENABLEMENT_ALIAS = re.compile(r"\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Z][A-Z0-9]{1,7}EnablementType)\b")
ORG_MEMBER = re.compile(r"\bOrgType\s*\.\s*([A-Z_]+)\b")
ORG_QUOTED = re.compile(r"['\"](PLATFORM|ACCOUNT|PLATFORM_ENTERPRISE|ACCOUNT_ENTERPRISE|PLATFORM_CONSUMER|ACCOUNT_CONSUMER)['\"]")


def finding(rule, region, message):
    return {"rule": rule, "region": region, "message": message}


def seed_findings(path, source, masked, module):
    """Rules 1, 2 and 3 — over the enablement definitions a seed migration carries.

    A definition is told from a permission row by its own shape: the object holding the `code`
    also holds `orgTypes`, the ceiling. Nothing else in these migrations carries both.
    """
    out = []
    for match in CODE_LITERAL.finditer(source):
        if in_comment(masked, match.start()):
            continue
        obj = enclosing_object(masked, match.start())
        if obj is None:
            continue
        body = source[obj[0]:obj[1]]
        body_masked = masked[obj[0]:obj[1]]
        if not re.search(r"\borgTypes\s*:", body_masked.replace(COMMENT, " ")):
            continue                                   # a permission row, or some other record
        code = match.group(1)
        segments = code.split("_")
        region = (match.start(), match.end())

        if module and not code.startswith(module + "_"):
            out.append(finding("PREFIX", region,
                f"Enablement code `{code}` does not start with its own module's prefix `{module}_`. "
                f"A code carries the prefix of the module that OWNS the question. A module supplying an "
                f"OPTION to another module's question appends to that definition's VALUES instead — it "
                f"never mints a code under someone else's prefix."))
        elif len(segments) < 3 or segments[1] != "MANAGE":
            out.append(finding("VERB", region,
                f"Enablement code `{code}` does not read `{module or '{MOD}'}_MANAGE_{{NOUN}}`. "
                f"`MANAGE` in the second position is the whole discriminator: a permission is "
                f"`{{MOD}}_{{FAMILY}}_{{TIER}}`, so a new verb makes the two unreadable and fragments the "
                f"vocabulary. There is no amount form either — a quota is billing's, not an enablement's."))

        multi = FIELD_MULTI.search(body)
        if multi and segments and segments[-1] in GENERIC:
            out.append(finding("NOUN", region,
                f"`{code}` is a multi-value definition (`{multi.group(1)}`) named after its AREA. "
                f"A boolean names the area; a SELECTION names its options. Named this way the console "
                f"shows \"{segments[-1].capitalize()}\" holding a list of options, and whoever flips the "
                f"cell cannot tell what they are choosing. Name it for what it offers."))
    return out


def authz_findings(path, source, masked):
    """Rule 2 at the gate site — an enablement enum MEMBER begins `MANAGE_`.

    The gate table names members through an alias (`const E = PRJEnablementType`), so the aliases
    are resolved from the file rather than assumed.
    """
    names = {found.group(2) for found in ENABLEMENT_ALIAS.finditer(source)}
    names |= set(re.findall(r"\b([A-Z][A-Z0-9]{1,7}EnablementType)\b", source))
    aliases = {found.group(1) for found in ENABLEMENT_ALIAS.finditer(source)} | names
    if not aliases:
        return []
    pattern = re.compile(r"\b(" + "|".join(re.escape(a) for a in sorted(aliases)) + r")\s*\.\s*([A-Za-z_][\w]*)\b")
    out = []
    for match in pattern.finditer(source):
        if in_comment(masked, match.start()):
            continue
        member = match.group(2)
        if not member.startswith("MANAGE_"):
            out.append(finding("VERB", (match.start(), match.end()),
                f"Enablement member `{match.group(1)}.{member}` does not begin `MANAGE_`, so its code "
                f"does not read `{{MOD}}_MANAGE_{{NOUN}}`. `MANAGE` in the second position is what tells "
                f"an enablement from a permission (`{{MOD}}_{{FAMILY}}_{{TIER}}`). Rename the member and "
                f"its code together, and fold the rename into the seed migration rather than adding one."))
    return out


def org_type_findings(path, source, masked):
    """Rule 4 — a hardcoded Set or array of `OrgType` values in a service or a gate table.

    Three shapes, all of them the same product decision written as code. A complete enumeration
    of every type is left alone: it gates nothing. So is `Record<OrgType, …>`, which is exhaustive
    by the type system rather than a subset somebody chose.
    """
    out = []
    seen = set()

    def members(region):
        text = source[region[0]:region[1]]
        return {m for m in ORG_MEMBER.findall(text) if m in ORG_TYPES}

    def quoted(region):
        text = source[region[0]:region[1]]
        return {m for m in ORG_QUOTED.findall(text) if m in ORG_TYPES}

    def report(region, found, shape):
        if region in seen or not found or found == ORG_TYPES:
            return
        seen.add(region)
        listed = ", ".join(sorted(found))
        out.append(finding("ORG TYPE", region,
            f"A hardcoded {shape} of organization types ({listed}) in {os.path.basename(path)}. "
            f"No module gates by organization type on its own authority (RD.SAAS.033). Which types are "
            f"offered a capability is a PRODUCT decision, authored as an enablement cell the platform "
            f"console can show and change — not a literal a release has to move. Register a "
            f"`{{MOD}}_MANAGE_{{NOUN}}` definition and check it with `assertEnabled`, or `assertAllows` "
            f"where the answer is a value."))

    # `new Set([...])` — the shape the estate actually hit, in IAMOrgService.updateOrgSubdomain.
    for match in re.finditer(r"\bnew\s+Set\s*\(", masked):
        if in_comment(masked, match.start()):
            continue
        region = balanced(masked, match.end() - 1, "(", ")")
        if region is None:
            continue
        report((match.start(), region[1]), members(region) or quoted(region), "Set")

    # A const annotated with `OrgType` and initialized to a list. `Record<OrgType, …>` is exempt:
    # an exhaustive map keyed by the type is not a subset anyone chose.
    for match in re.finditer(r"\bconst\s+([A-Za-z_$][\w$]*)\s*:\s*([^=;\n]*OrgType[^=;\n]*)=\s*", masked):
        if in_comment(masked, match.start()) or "Record<" in match.group(2):
            continue
        opener = source[match.end():match.end() + 1]
        if opener == "[":
            region = balanced(masked, match.end(), "[", "]")
        else:
            continue
        if region is None:
            continue
        report((match.start(), region[1]), members(region) or quoted(region), "array")

    # An inline list asked for membership — `[OrgType.A, OrgType.B].includes(org.orgType)`.
    for match in re.finditer(r"\[", masked):
        if in_comment(masked, match.start()):
            continue
        region = balanced(masked, match.start(), "[", "]")
        if region is None:
            continue
        tail = masked[region[1]:region[1] + 12]
        if not re.match(r"\s*\.\s*(includes|has)\s*\(", tail):
            continue
        report(region, members(region) or quoted(region), "list")

    return out


def check(path, source):
    """Every finding a script can see in the text this file would hold."""
    masked = mask(source)
    out = []
    if is_seed(path):
        out += seed_findings(path, source, masked, module_of(path, source))
    if is_authz(path):
        out += authz_findings(path, source, masked)
    if is_authz(path) or is_service(path):
        out += org_type_findings(path, source, masked)
    return out


# ---------------------------------------------------------------- the hook

def resulting_text(tool_input, path):
    """The text the write would produce, and the text it ADDS.

    A Write carries the whole file. An Edit carries only its replacement, so the replacement is
    applied to what is on disk — scoring the fragment alone is how a hook reports green having
    checked nothing.
    """
    content = tool_input.get("content")
    if content is not None:
        return content, content
    fragment = tool_input.get("new_string")
    if fragment is None:
        return None, None
    try:
        with open(path, encoding="utf8") as handle:
            disk = handle.read()
    except OSError:
        return fragment, fragment
    old = tool_input.get("old_string")
    if old and old in disk:
        count = -1 if tool_input.get("replace_all") else 1
        return disk.replace(old, fragment, count), fragment
    return disk + "\n" + fragment, fragment


def introduced(source, region, added):
    """Whether this write is what puts the offending text there.

    Any substantial line of the offending region appearing in the added text is the signal. It
    keeps a pre-existing violation elsewhere in the file from blocking an unrelated edit, without
    letting a multi-line shape through because only one of its lines moved.
    """
    if added is None:
        return True
    for line in source[region[0]:region[1]].splitlines():
        line = line.strip()
        if len(line) >= 6 and line in added:
            return True
    return False


def deny(reason):
    json.dump({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }}, sys.stdout)
    sys.exit(0)


def run_stdin():
    try:
        event = json.load(sys.stdin)
    except Exception:
        return 0                                  # unparsable input allows, as the sibling hooks do
    tool_input = event.get("tool_input") or {}
    path = tool_input.get("file_path") or ""
    if not path.endswith(".ts") or not watched(path):
        return 0
    source, added = resulting_text(tool_input, path)
    if source is None:
        return 0
    try:
        found = [f for f in check(path, source) if introduced(source, f["region"], added)]
    except Exception:
        return 0                                  # a parse this script cannot do allows, never blocks
    if not found:
        return 0
    lines = [f"Denied — the enablement grammar. {len(found)} finding(s) in {os.path.basename(path)}:"]
    for item in found:
        lines.append(f"  [{item['rule']}] {item['message']}")
    lines.append(f"  {REF}")
    deny("\n".join(lines))
    return 0


SKIP = {"node_modules", "dist", "build", ".git", ".nx", "coverage"}


def run_scan(paths):
    total = 0
    for root in paths:
        targets = [root] if os.path.isfile(root) else []
        for base, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if d not in SKIP]
            targets += [os.path.join(base, f) for f in files]
        for target in sorted(set(targets)):
            if not target.endswith(".ts") or not watched(target):
                continue
            try:
                with open(target, encoding="utf8") as handle:
                    source = handle.read()
            except OSError:
                continue
            for item in check(target, source):
                total += 1
                print(f"{target}: [{item['rule']}] {item['message']}")
    print(f"\n{total} enablement-grammar finding(s)")
    return 1 if total else 0


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--stdin"]
    sys.exit(run_stdin() if "--stdin" in sys.argv else run_scan(args or ["."]))
