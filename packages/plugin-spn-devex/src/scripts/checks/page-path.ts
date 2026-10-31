// A page is handed over as its whole `file:///` address (RULE.DEVEX.WORKSPACE.117), because the developer opens it
// by pasting what they see. A reply that names a page by its bare name, by a path from some folder, or by a link
// whose text is not the address leaves them hunting for the file, so the turn does not end: the agent is sent back
// to write the address out. A page is an `.html` file; a whole `file:///` address, bare or as a link's own text, passes.
//
//   called by: events/stop.ts, on the turn's last reply with its fenced blocks taken out

/** A finding about the reply, in the shape every Stop check returns. */
export type PagePathFinding = { check: string; message: string };

const ADDRESS = /file:\/\/\/[^\s)\]>"'`]+/g;
const LINK = /\[([^\]]*)\]\(([^)\s]+)\)/g;
const PAGE = /[\w./~@-]*\.html\b/g;

/**
 * The page-path check: one finding that names each page the reply hands over without its whole address, or none.
 *
 * @param prose  the turn's last reply with its fenced blocks taken out
 */
export function checkPagePath(prose: string): PagePathFinding[] {
  const named: string[] = [];
  const rest = prose.replace(LINK, (whole, text: string, href: string) => {
    if (!/\.html\b/.test(href)) return whole;
    if (!text.includes("file:///")) named.push(`[${text}]`);
    return " ";
  }).replace(ADDRESS, " ");
  for (const page of rest.match(PAGE) ?? []) named.push(`\`${page}\``);
  const said = [...new Set(named)];
  if (!said.length) return [];
  return [{ check: "page-path", message:
    `This reply names ${said.length === 1 ? "a page" : "pages"} the developer cannot open by pasting what they see: ${said.join(", ")}.\n` +
    `Write ${said.length === 1 ? "it" : "each one"} as its whole \`file:///\` address, with the link's text the address itself ` +
    `(RULE.DEVEX.WORKSPACE.117).` }];
}
