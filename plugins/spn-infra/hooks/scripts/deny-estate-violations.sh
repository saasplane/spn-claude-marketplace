#!/usr/bin/env bash
# spn-infra PreToolUse guard: deny Write/Edit that would break the estate laws.
#
# Denies (conservative — when unsure, allow):
#   1. Any edit under */dist/*                — dist is staged by the build, published whole
#   2. Content carrying an ARN               — identifiers are discovered, never typed
#   3. Content carrying a secret shape       — access keys, private key blocks,
#                                              quoted literal credential assignments
#   4. Content pinning an account id         — account[-_ ]id keyed to 12 digits
#   5. A provider string outside a cloud     — in spestate.json: a region literal not the
#      entry                                   value of a "region" key, or an instance class
#                                              not the value of a profile capacity key
#
# On deny: print the documented PreToolUse JSON decision and exit 0.
# On anything unexpected (no jq, unparsable input, no file path): exit 0 silently — allow.

command -v jq >/dev/null 2>&1 || exit 0

INPUT=$(cat 2>/dev/null) || exit 0
[ -n "$INPUT" ] || exit 0

FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || exit 0
[ -n "$FILE_PATH" ] || exit 0

# The text this call would add: Write carries content, Edit carries new_string.
NEW_TEXT=$(printf '%s' "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty' 2>/dev/null) || exit 0

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

LAWS_HINT="See refs/laws.md in the spn-infra plugin: no secrets, ARNs or account ids at any path; every provider-assigned value is discovered by the driver and recorded as resolved state; provider strings live only inside a cloud entry."

# 1 · dist/ is build output — staged whole by 'spnutils infra release', never hand-edited.
case "$FILE_PATH" in
  */dist/*)
    deny "Denied: $FILE_PATH is under dist/ — the artifact is staged by the build (spinfrapkg.json + src/**, whole) and published as-is. Edit the source under src/ and rebuild; never hand-edit dist/."
    ;;
esac

[ -n "$NEW_TEXT" ] || exit 0

# 2 · ARNs — an identifier a person typed.
if printf '%s' "$NEW_TEXT" | grep -Eq 'arn:aws[a-z-]*:'; then
  deny "Denied: the text being written contains an ARN. $LAWS_HINT"
fi

# 3 · Secret shapes — access key ids, private key material, quoted literal credentials.
if printf '%s' "$NEW_TEXT" | grep -Eq '\b(AKIA|ASIA)[0-9A-Z]{16}\b'; then
  deny "Denied: the text being written contains an access key id. $LAWS_HINT"
fi
if printf '%s' "$NEW_TEXT" | grep -Eq -- '-----BEGIN [A-Z ]*PRIVATE KEY-----'; then
  deny "Denied: the text being written contains private key material. $LAWS_HINT"
fi
# A credential-named key assigned a quoted literal (not a ${…} reference, not empty/short).
if printf '%s' "$NEW_TEXT" | grep -Eiq '"[a-z0-9_-]*(password|secret|api[_-]?key|access[_-]?key|client[_-]?secret)[a-z0-9_-]*"[[:space:]]*[:=][[:space:]]*"[^"$][^"]{7,}"'; then
  deny "Denied: the text being written assigns a literal value to a credential-named key. A credential is never pinned in a file — it belongs in the config plane, written through the config verbs. $LAWS_HINT"
fi

# 4 · Account ids — only where a key names them; a bare 12-digit number is left alone.
if printf '%s' "$NEW_TEXT" | grep -Eiq '(account[_-]?id|accountid)["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"']?[0-9]{12}\b'; then
  deny "Denied: the text being written pins a 12-digit account id. Accounts are discovered by the tool holding the credential and recorded as resolved state. $LAWS_HINT"
fi

# 5 · Provider strings outside a cloud entry — checked only in estate manifests, where
#     the declaration's structure sanctions exactly two homes: a cloud entry's "region"
#     mapping, and a profile's capacity-override keys.
case "$FILE_PATH" in
  *spestate.json)
    SCRUBBED=$(printf '%s' "$NEW_TEXT" | sed -E \
      -e 's/"region"[[:space:]]*:[[:space:]]*"[a-z0-9-]+"//g' \
      -e 's/"(database|cache|queue|compute)"[[:space:]]*:[[:space:]]*"[^"]*"//g')
    if printf '%s' "$SCRUBBED" | grep -Eq '\b(af|ap|ca|cn|eu|il|me|sa|us|usgov)-(central|north|south|east|west|northeast|northwest|southeast|southwest)-[0-9]\b'; then
      deny "Denied: a provider region string appears in $FILE_PATH outside a cloud entry's \"region\" mapping — the only place a provider region is spelled. $LAWS_HINT"
    fi
    if printf '%s' "$SCRUBBED" | grep -Eq '"(db|cache|kafka)\.[a-z0-9]+\.[a-z0-9]+"'; then
      deny "Denied: a provider instance class appears in $FILE_PATH outside a profile's capacity keys (database/cache/queue/compute) — provider strings live only inside a cloud entry. $LAWS_HINT"
    fi
    ;;
esac

# No match — no decision; normal permission flow applies.
exit 0
