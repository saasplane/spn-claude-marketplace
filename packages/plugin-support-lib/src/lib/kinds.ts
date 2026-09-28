// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/06-tests/README.md § Kind decides the tier
// The chapter is the source of truth; a change is made there first, then here, in the same change.

// This table lives once, in the shared support-lib folder; spn-devex and spn-apps each import it by
// relative path. In the builder workspace a case holds it to the toolchain's own kind table, member
// for member.

/** The tiers each kind owes — a floor, never a ceiling. A kind absent here owes nothing this tool can name. */
export const OWED_TIERS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  TOOLCHAIN: ["UNIT"],
  SUPPORT_UNIVERSAL: ["UNIT"],
  SUPPORT_SERVER: ["UNIT", "INTEGRATION"],
  SUPPORT_WEB: ["UNIT", "COMPONENT"],
  MODULE_SERVER: ["UNIT"],
  MODULE_WEB: ["UNIT"],
  APP_SERVER: ["CONTRACT", "JOURNEY"],
  APP_WEB: ["JOURNEY", "COMPONENT"],
  APP_UTILITY: ["UNIT", "INTEGRATION"],
  CLIENT_API: ["INTEGRATION"],
});

/** The tier ladder, in the book's order. A measurement lists tiers in this order. */
export const TIERS = Object.freeze(["UNIT", "INTEGRATION", "CONTRACT", "COMPONENT", "JOURNEY"]);

/** What a kind owes, or nothing for a kind this table does not name. */
export const owedBy = (kind: string | null): readonly string[] => (kind === null ? [] : OWED_TIERS[kind] ?? []);
