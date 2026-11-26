// The recipes of the app categories (DASHBOARD for a team, PORTAL for an individual): panels, lists, forms and the widgets of an app, with the
// words of a sample product, Lumen Labs. A page of an app is a layout holding panels; a recipe returns the panels, and the layout is the kind's.
import { U, badge, btn, col, grid, item, muted, row, slot, table as plainTable, txt, vl } from "./kit.ts";
import { BRIEFS } from "./site-words.ts";
import { siteContainer } from "./site.ts";
import type { Tree } from "./types.ts";

export type W = {
  who: string; title: string; description: string; action: string; search: string; heads: string[]; rows: unknown[][]; count: string; total: number;
  filters: Array<[string, string, string[]]>; record: string; recordLine: string; permission: string; kind: "DASHBOARD" | "PORTAL";
};
const dash = (): unknown[][] => [["Dana Lee", "dana@lumenlabs.example", "Owner", "", "Today"], ["Ravi Shah", "ravi@lumenlabs.example", "Admin", "", "Today"], ["Mei Tan", "mei@lumenlabs.example", "Editor", "", "Yesterday"], ["Joao Costa", "joao@lumenlabs.example", "Editor", badge("Invited"), "Not yet"], ["Aisha Khan", "aisha@lumenlabs.example", "Viewer", "", "22 Nov 2026"], ["Priya Nair", "priya@lumenlabs.example", "Admin", "", "22 Nov 2026"], ["Omar Haddad", "omar@lumenlabs.example", "Viewer", badge("Invited"), "Not yet"], ["Sofia Rossi", "sofia@lumenlabs.example", "Editor", "", "21 Nov 2026"], ["Lena Fischer", "lena@lumenlabs.example", "Viewer", badge("Suspended", "ERROR"), "3 Nov 2026"]];
const port = (): unknown[][] => [["#1052", "20 Nov 2026", "Lumen Cable", "$18.00", badge("Processing", "INFO")], ["#1048", "12 Nov 2026", "Lumen Lamp x2", "$84.00", badge("On its way", "INFO")], ["#1041", "29 Oct 2026", "Lumen Desk", "$212.50", ""], ["#1033", "3 Oct 2026", "Lumen Bulb", "$19.00", ""], ["#1027", "18 Sep 2026", "Lumen Shade", "$64.20", badge("Returned")], ["#1019", "2 Sep 2026", "Lumen Stand", "$38.00", ""], ["#1012", "21 Aug 2026", "Lumen Chair", "$129.00", ""], ["#1005", "9 Aug 2026", "Lumen Lamp", "$47.80", badge("Returned")]];
export const WORDS: Record<string, W> = {
  DASHBOARD: { who: "Team", title: "Members", description: "Everyone in Lumen Labs and the role each person holds", action: "Invite member", search: "Search members", heads: ["Name", "Email", "Role", "State", "Last active"], rows: dash(), count: "1 to 9 of 24", total: 24, filters: [["role", "Role", ["Owner", "Admin", "Editor", "Viewer"]], ["state", "State", ["Active", "Invited", "Suspended"]]], record: "Billing app", recordLine: "App · billing · owned by Dana Lee", permission: "Editor", kind: "DASHBOARD" },
  PORTAL: { who: "Individual", title: "Your orders", description: "What you bought from Lumen Labs and where it is", action: "Start a return", search: "Search orders", heads: ["Order", "Placed", "Items", "Total", "State"], rows: port(), count: "1 to 8 of 31", total: 31, filters: [["state", "State", ["Processing", "On its way", "Delivered", "Returned"]], ["year", "Placed in", ["2026", "2025", "2024"]]], record: "Order #1048", recordLine: "Placed 12 Nov 2026 · Lumen Lamp, 2 items", permission: "Household", kind: "PORTAL" },
};

const field = (label: string, value: unknown, kind = "input", text?: string): Tree => {
  const control = kind === "switch" ? U("DSSwitch", { label: text ?? label, valueLink: vl(value) }) : kind === "check" ? U("DSCheckbox", { label: text ?? label, valueLink: vl(value) }) : kind === "area" ? U("DSTextarea", { valueLink: vl(value), rows: 4 }) : U("DSInput", { valueLink: vl(value) });
  return U("DSForm.Field", { label: kind === "switch" || kind === "check" ? "" : label, validators: [], attributeLink: vl(value) }, [control]);
};
const form = (fields: Tree[]): Tree => U("DSForm", { size: "MD" }, [col(fields)]);
const lineItem = (title: string, description?: string | null, level = "CONTENT", end?: unknown, extra: Tree = {}): Tree => item(title, description, level, end, extra);

/** A panel: its header's item, an optional bar, its content and its footer. */
export function panel(title: string, description: string | null, content: unknown[], opts: { footer?: unknown[]; end?: unknown; full?: boolean; flush?: boolean; back?: boolean; bar?: unknown[] } = {}): Tree {
  const head = lineItem(title, description, opts.full ? "PAGE" : "CONTAINER", opts.end, opts.back ? { backAnchor: { href: "#back" } } : {});
  const parts: unknown[] = [U("DSPanelContainer.Header", {}, [head])];
  if (opts.bar) parts.push(U("DSPanelContainer.Content", {}, opts.bar));
  parts.push(U("DSPanelContainer.Content", opts.flush ? { flush: true } : {}, content));
  if (opts.footer) parts.push(U("DSPanelContainer.Footer", {}, opts.footer));
  return U("DSPanelContainer", opts.full ? { fullPage: true } : {}, parts);
}
const dataTable = (heads: string[], rows: unknown[][], withAction = true): Tree => {
  const hs = [...heads.map((h) => U("DSTable.HCell", {}, [h])), ...(withAction ? [U("DSTable.HCell", {}, [""])] : [])];
  const body = rows.map((r) => U("DSTable.Row", {}, [...r.map((c, i) => U("DSTable.DCell", { marked: i === 0 }, c === "" ? [] : [c])), ...(withAction ? [U("DSTable.DCell", { alignment: "END" }, [btn(null, undefined, "GHOST", "MORE_HORIZONTAL", `Actions for ${String(typeof r[0] === "string" ? r[0] : "row")}`)])] : [])]));
  return U("DSTable", { hoverable: true }, [U("DSTable.Head", {}, [U("DSTable.Row", {}, hs)]), U("DSTable.Body", {}, body)]);
};
const paging = (total: number, per = 12): Tree => U("DSPagination", { totalRecords: total, valueLink: vl({ page: 1, recordsPerPage: per }), recordsPerPageOptions: [12, 25, 50] });
const filterBar = (w: W, extra = true): Tree => U("DSFilterBar", { fields: [{ mtype: "TEXT", key: "q", label: w.search, placeholder: w.search, primary: true, valueLink: vl("") }, ...(extra ? w.filters.map(([key, label, opts]) => ({ mtype: "SELECT", key, label, primary: true, options: opts.map((o) => ({ key: o.toLowerCase(), label: o })), valueLink: vl(null) })) : [])] });
const chips = (tags: string[]): Tree => row([U("DSTagGroup", { tags: tags.map((k) => ({ key: k.toLowerCase(), label: k })) }), btn("Clear all", undefined, "GHOST")]);
const actions = (w: W): Tree => (w.kind === "DASHBOARD" ? U("DSButtonGroup", {}, [btn("Export", undefined, "OUTLINE"), btn(w.action, "PRIMARY", "SOLID", "PLUS")]) : btn(w.action, "PRIMARY", "SOLID", "PLUS"));
const listPanel = (w: W, applied?: string[]): Tree => panel(w.title, w.description, [dataTable(w.heads, w.rows)], { footer: [muted(w.count), paging(w.total)], end: actions(w), full: true, bar: [filterBar(w), ...(applied ? [chips(applied)] : [])], flush: true });
const stat = (label: string, value: string, note: string, goto: string): Tree => U("DSCardWidget", { parts: [{ mtype: "FREE", key: "s", node: col([muted(label, "TITLE_SM"), txt(value, "HEADING_MD"), muted(note, "CONTENT_XS"), U("DSLink", { label: goto, anchor: { href: "#list" }, size: "SM" })], "XS") }] });
const recent = (w: W): Tree => panel("Recent activity", w.kind === "DASHBOARD" ? "What changed this week" : "What happened lately", (w.kind === "DASHBOARD" ? [["Dana Lee changed a role", "Ravi Shah is now an Admin", "2 hours ago"], ["Joao Costa was invited", "As an Editor", "Yesterday"], ["Billing app updated", "Owner is now Dana Lee", "Mon"]] : [["Order #1048 shipped", "Lumen Post, LP-88213", "Today"], ["Payment received", "$18.00 by card ending 4242", "Yesterday"], ["Address changed", "14 Harbour Lane", "Mon"]]).map(([t, d, when]) => lineItem(t, d, "CONTENT", muted(when))));

/** A layout kind drawn holding a page. */
export const layoutBody = (w: W): Tree[] => [col([listPanel(w), recent(w)], "LG")];

const bk = (): Tree => btn("Save changes", "PRIMARY", "SOLID");
const dis = (): Tree => btn("Discard", undefined, "OUTLINE");
const danger = (what: string, line: string): Tree => panel(`Delete ${what}`, line, [muted("Export its data first if you need a copy.")], { end: btn(`Delete ${what}`, "ERROR", "OUTLINE") });

function setup(w: W, c: string): Tree[] {
  if (w.kind === "DASHBOARD") return [col([lineItem(w.record, "App · billing · owned by Dana Lee · Mumbai", "PAGE", btn("Open app", undefined, "OUTLINE"), { media: { mtype: "ICON", node: "APP_WINDOW" }, backAnchor: { href: "#back" } }),
    panel("Details", "Name, owner and region", [form([field("Name", "Billing app"), field("Slug", "billing"), field("Owner", "Dana Lee"), field("Region", "Mumbai")])], { footer: [bk(), dis()] }),
    panel("Sign-in", "Who may open the app", [form([field("a", true, "switch", "Require two-step sign-in"), field("b", true, "switch", "Allow sign-in with a link"), field("c", false, "switch", "Let members stay signed in")])]),
    c === "CURRENT_PLAN" ? U("DSCardWidget", { header: { title: "Team plan", description: "$49 a month, billed yearly" }, parts: [{ mtype: "ITEMS", key: "p", items: [{ key: "a", title: "Renews", description: "12 March 2027" }, { key: "b", title: "Seats", description: "24 of 50 used" }] }], footer: btn("Change plan", undefined, "OUTLINE") }) : panel("Access", "Which roles open it", ["Admins", "Editors", "Viewers"].map((r, i) => lineItem(r, [`3 members · can change settings`, `9 members · can edit content`, `12 members · can read only`][i], "CONTENT", btn("Change", undefined, "OUTLINE")))),
    danger("app", "Removes the app and its data. It cannot be undone.")], "LG")];
  return [col([lineItem("Dana Lee", "dana@lumenlabs.example · Member since March 2024", "PAGE", undefined, { media: { mtype: "AVATAR", title: "Dana Lee" } }),
    panel("Profile", "What others see", [form([field("Display name", "Dana Lee"), field("Time zone", "Asia/Kolkata"), field("Language", "English")])], { footer: [bk(), dis()] }),
    c === "CURRENT_PLAN" ? U("DSCardWidget", { header: { title: "Lumen Plus", description: "$9 a month" }, parts: [{ mtype: "ITEMS", key: "p", items: [{ key: "a", title: "Renews", description: "12 March 2027" }, { key: "b", title: "Free delivery", description: "On every order" }] }], footer: btn("Change plan", undefined, "OUTLINE") }) : panel("Sign-in", "How you get into your account", [lineItem("Password", "Changed 3 months ago", "CONTENT", btn("Change password", undefined, "OUTLINE")), lineItem("Two-step check", "Asks for a code from your phone", "CONTENT", btn("Set up", undefined, "OUTLINE"))]),
    panel("Notifications", "Choose what reaches your inbox", [form([field("a", true, "switch", "Email me when someone signs in on a new device"), field("b", false, "switch", "Email me a summary each week")])]),
    danger("account", "Removes your profile and access. It cannot be undone.")], "LG")];
}

const mei = (): { head: Tree; lists: Tree[] } => {
  const lst = (rows: string[][], what: string): Tree => U("DSList", { divided: true }, rows.map(([r, d]) => U("DSList.Item", { content: lineItem(r, d), endNode: btn(null, undefined, "GHOST", "X", `Remove ${r} ${what}`) })));
  return { head: lineItem("Mei Tan", "mei@lumenlabs.example · Editor · Joined 3 March 2024", "PAGE", U("DSButtonGroup", {}, [btn("Suspend", undefined, "OUTLINE"), btn("Edit", undefined, "OUTLINE")]), { media: { mtype: "AVATAR", title: "Mei Tan" }, backAnchor: { href: "#back" } }),
    lists: [panel("Roles", "What Mei Tan may do", [lst([["Editor", "Since 3 Mar 2024"], ["Reviewer", "Since 12 Sep 2025"]], "role")], { end: btn("Add role", undefined, "OUTLINE", "PLUS") }),
      panel("Sites", "Where Mei Tan publishes", [lst([["docs.lumenlabs.example", "Docs site"], ["www.lumenlabs.example", "Marketing site"]], "site")], { end: btn("Add site", undefined, "OUTLINE", "PLUS") }),
      panel("Apps", "What Mei Tan opens", [lst([["Billing app", "Editor"], ["Support desk", "Viewer"]], "app")], { end: btn("Add app", undefined, "OUTLINE", "PLUS") }),
      panel("Recent activity", "The last things Mei Tan did", [U("DSList", { divided: true }, [["Published a site", "docs.lumenlabs.example", "Today, 08:40"], ["Changed a page", "Roles and permissions", "Yesterday"]].map(([t, d, when]) => U("DSList.Item", { content: lineItem(t, d, "CONTENT", muted(when)) })))])] };
};
function belongs(w: W, c: string): Tree[] {
  const { head, lists } = mei();
  if (c === "WITH_PROPERTIES_BESIDE") return [col([head, grid([col([lists[0], lists[1], lists[2], lists[3]], "LG"), panel("Properties", null, [col([["Email", "mei@lumenlabs.example"], ["Role", "Editor"], ["Joined", "3 Mar 2024"], ["Two-step", "On"]].map(([l, v]) => U("DSDataUnit", { label: l, node: v })), "SM")])], 2, 1, 1)], "LG")];
  if (c === "TABBED") return [col([head, U("DSTabs", { options: ["Roles", "Sites", "Apps", "Keys", "Activity"].map((l) => ({ key: l.toLowerCase(), label: l, anchor: { href: `#${l.toLowerCase()}` } })), activeKey: "roles", type: "LINE" }), lists[0]], "LG")];
  return [col([head, grid([lists[0], lists[1]], 2, 1, 1), lists[2], lists[3]], "LG")];
}

const eventRows = (w: W): unknown[][] => (w.kind === "DASHBOARD" ? [["24 Nov 2026, 09:12", "Role changed", "Dana Lee", "Ravi Shah is now an Admin"], ["24 Nov 2026, 08:40", "Site published", "Mei Tan", "docs.lumenlabs.example"], ["23 Nov 2026, 17:05", "Member invited", "Dana Lee", "Omar Haddad as Viewer"], ["22 Nov 2026, 10:01", "Sign-in changed", "Priya Nair", "Two-step now required"]] : [["24 Nov 2026, 09:12", "Order shipped", "#1048", "Lumen Post, LP-88213"], ["21 Nov 2026, 14:03", "Payment received", "#1052", "$18.00 by card ending 4242"], ["19 Nov 2026, 10:25", "Address changed", "Home", "14 Harbour Lane"], ["10 Nov 2026, 08:45", "Sign-in from a new device", "Phone", "Pune, India"]]);
function find(w: W, c: string): Tree[] {
  if (c !== "DATED_EVENTS") return [listPanel(w)];
  const rows = eventRows(w);
  const f = [{ mtype: "DATE_RANGE", key: "when", label: "Time range", primary: true, valueLink: vl({ start: null, end: null }) }, { mtype: "TEXT", key: "q", label: "Search events", placeholder: "Search events", primary: true, valueLink: vl("") }];
  return [panel(w.kind === "DASHBOARD" ? "Activity" : "Account activity", "Everything that changed, newest first", [dataTable(w.kind === "DASHBOARD" ? ["When", "Event", "By", "Detail"] : ["When", "Event", "About", "Detail"], rows, false)], { footer: [muted("1 to 4 of 186 events"), paging(186)], full: true, bar: [U("DSFilterBar", { fields: f })], flush: true })];
}
const waiting = (w: W): Tree => w.kind === "DASHBOARD" ? panel("Needs you", "3 things are waiting", [["Approve Joao Costa", "Invited 2 days ago as an Editor", "Open"], ["Finish site setup", "docs.lumenlabs.example has no 404 page", "Open"], ["Renew the card", "Visa ending 4242 expires in December", "Open"]].map(([t, d, a]) => lineItem(t, d, "CONTENT", btn(a, undefined, "OUTLINE")))) : panel("Needs you", "2 things are waiting", [["Order #1048", "Arrives Thursday", "Track"], ["Rate Lumen Lamp", "Delivered 3 Nov", "Rate"]].map(([t, d, a]) => lineItem(t, d, "CONTENT", btn(a, undefined, "OUTLINE"))));
const statsOf = (w: W): Tree[] => (w.kind === "DASHBOARD" ? [["Members", "24", "+2 this week", "See members"], ["Sites", "5", "all live", "See sites"], ["Apps", "9", "1 needs setup", "See apps"], ["Invites", "3", "waiting", "See invites"]] : [["Open orders", "2", "1 on its way", "See orders"], ["Spent this year", "$418", "since January", "See invoices"], ["Saved addresses", "2", "home, work", "See addresses"], ["Points", "340", "60 to next", "See rewards"]]).map(([a, b, d, e]) => stat(a, b, d, e));
function overview(w: W): Tree[] {
  return [col([lineItem("Overview", "Good morning, Dana", "PAGE"), ...(w.kind === "DASHBOARD" ? [checklist(3)] : []), waiting(w), grid(statsOf(w), 4, 2, 2), recent(w)], "LG")];
}
const checklist = (done = 3): Tree => panel("Finish setting up", `${done} of 5 steps done`, [col([U("DSProgress", { value: done, max: 5, size: "SM" }), ...[["Name your organization", "Lumen Labs"], ["Invite your team", "24 members joined"], ["Connect a sign-in", "Email and password"], ["Publish a site", "Put a page on your own domain"], ["Set up billing", "Add a card to keep your sites live"]].map(([t, d], i) => lineItem(t, d, "CONTENT", i < done ? undefined : btn("Start", undefined, "OUTLINE"), { media: { mtype: "ICON", node: i < done ? "CHECK" : "CIRCLE" } }))], "SM")], { end: btn("Dismiss", undefined, "GHOST") });

type Drawn = { children: Tree[]; layout: string | null; planned?: string };
/** The drawings a page of an app is made of, each under the code of the part it now belongs to; a page kind chooses among them by its case. */
function drawing(code: string, c: string, w: W): Drawn {
  const D = w.kind === "DASHBOARD";
  switch (code) {
    case "RECORD_HOME": return { children: find(w, c), layout: null };
    case "RECORD_VIEW_OWN": return { children: setup(w, c), layout: D ? null : "DOCK" };
    case "RECORD_VIEW": return { children: belongs(w, c), layout: null };
    case "SETUP_SECTION": return { layout: null, children: [panel("Channels", "How Lumen Labs reaches people", [grid([["Email", "MAIL_OPEN", "Postmark", "Connected · 12,400 sent"], ["SMS", "MESSAGE_CIRCLE", "No provider yet", "Not connected"], ["Push", "BELL", "Firebase", "Connected · 3,100 sent"]].map(([k, ic, pr, st]) => U("DSCardWidget", { header: { title: k, pageLevel: "WIDGET", media: { mtype: "ICON", node: ic } }, parts: [{ mtype: "ITEMS", key: "p", items: [{ key: "p1", title: pr, description: st, endNode: btn("Manage", undefined, "OUTLINE") }] }] })), 3, 2, 1)], { full: true })] };
    case "SETUP_COMPARE": {
      const subj = ["Owner", "Admin", "Editor", "Viewer"].map((k) => ({ key: k.toLowerCase(), title: k }));
      const rows: Array<[string, string, boolean[]]> = [["invite", "Invite people", [true, true, false, false]], ["publish", "Publish a site", [true, true, true, false]], ["billing", "See billing", [true, true, false, false]]];
      return { layout: null, children: [panel("Role permissions", "What each role can do", [U("DSComparison", { subjects: subj, groups: [{ key: "g", rows: rows.map(([k, l, v]) => ({ mtype: "FIELD", key: k, config: { mtype: "BOOLEAN", key: k, label: l }, values: Object.fromEntries(["owner", "admin", "editor", "viewer"].map((s, i) => [s, { mtype: "BOOLEAN", value: v[i] }])) })) }] })], { full: true })] };
    }
    case "LISTING_CHOOSE": return { layout: null, children: [panel(`Permissions for ${w.permission}`, "Choose what this " + (D ? "role" : "person") + " can do", [form([grid(["View members", "Invite members", "Remove members", "Edit roles", "Publish sites", "See billing"].map((p, i) => field(p, i % 2 === 0, "check")), 3, 3, 1)])], { footer: [btn("Save", "PRIMARY", "SOLID"), btn("Cancel", undefined, "OUTLINE")], full: true, back: true })] };
    case "ENTRY_PREVIEW": return { layout: null, children: [panel("Invite email", "What a new member receives", [form([field("Subject", "You are invited to Lumen Labs"), grid([field("Message", "Hi {name}, your invite to Lumen Labs is ready.", "area"), U("DSCard", {}, [U("DSCard.Content", {}, [muted("Preview", "TITLE_SM"), txt("Hi Dana, your invite to Lumen Labs is ready.")])])], 2, 1, 1)])], { footer: [btn("Save", "PRIMARY", "SOLID"), btn("Cancel", undefined, "OUTLINE")], full: true, back: true })] };
    case "ENTRY_OVER": return { layout: null, children: [grid([panel(w.title, null, [dataTable(w.heads, w.rows.slice(0, 4))], { full: true }), panel(String(w.rows[1][0]), "Opened from the list", [form([field(w.heads[1], String(w.rows[1][1])), field(w.heads[2], String(w.rows[1][2]))])], { footer: [btn("Save", "PRIMARY", "SOLID"), btn("Cancel", undefined, "OUTLINE")], end: btn(null, undefined, "GHOST", "X", "Close") })], 2, 1, 1)] };
    case "SETUP_INHERITED": return { layout: null, children: [col([lineItem(w.record, "Settings it inherits or overrides", "PAGE", undefined, { backAnchor: { href: "#back" } }), ...[["Sign-in", "Follows the organization default", [["Method", "Email and password"], ["Session", "12 hours"], ["Two-step", "Required"]], "Set its own"], ["Notifications", "Holds its own values", [["Digest", "Weekly"], ["Quiet hours", "22:00 to 07:00"], ["Channel", "Email"]], "Follow the default"]].map(([t, d, vs, a]) => panel(t as string, d as string, [grid((vs as string[][]).map(([l, v]) => U("DSDataUnit", { label: l, node: v })), 3, 2, 1)], { end: btn(a as string, undefined, "OUTLINE") }))], "LG")] };
    case "LISTING_GROUPS": return { layout: null, children: [col([lineItem("Notifications", "What Lumen Labs tells people", "PAGE"), ...[["Account", ["Password changed", "New sign-in"]], ["Billing", ["Invoice ready", "Payment failed"]]].map(([g, acts]) => panel(g as string, null, [U("DSList", { divided: true }, (acts as string[]).map((a) => U("DSList.Item", { content: col([txt(a, "TITLE_MD"), muted("Email · Push", "CONTENT_XS")], "XS"), endNode: btn("Edit", undefined, "OUTLINE") })))]))], "LG")] };
    case "HOME_APP": return { layout: null, children: overview(w) };
    case "RECORD_STEPS": {
      const steps = D ? [["Invited", "DONE"], ["Accepted", "DONE"], ["Verified", "WORKING"], ["Active", ""]] : [["Placed", "DONE"], ["Packed", "DONE"], ["On its way", "WORKING"], ["Delivered", ""]];
      const checks = D ? [["Email", "Confirmed"], ["Two-step", "Not set up"], ["Terms", "Accepted"]] : [["Carrier", "Lumen Post"], ["Tracking", "LP-88213"], ["Arrives", "Thursday"]];
      return { layout: null, children: [col([lineItem(D ? "Joao Costa" : w.record, D ? "Invited 22 Nov" : w.recordLine, "PAGE", btn(D ? "Resend invite" : "Track order", "PRIMARY", "SOLID"), { backAnchor: { href: "#back" } }), panel("Where it is", null, [U("DSStepper", { items: steps.map(([l, s], i) => ({ key: `s${i}`, label: l, ...(s ? { taskState: s } : {}) })), activeKey: "s2", type: "NUMBER" })]), panel("Checks", null, [grid(checks.map(([l, v]) => U("DSDataUnit", { label: l, node: v })), 3, 2, 1)])], "LG")] };
    }
    case "ENTRY_FORM": {
      const parts: Array<[string, Tree[]]> = D ? [["Details", [field("Name", "Docs site"), field("Address", "docs.lumenlabs.example")]], ["Access", [field("a", true, "switch", "Visible to everyone"), field("b", false, "switch", "Let search engines list it")]]] : [["Delivery", [field("Name", "Dana Lee"), field("Address", "14 Harbour Lane")]], ["Contact", [field("Phone", "+1 555 0100"), field("Email", "dana@lumenlabs.example")]]];
      if (c === "DONE") return { layout: null, children: [panel(D ? "Site created" : "Address saved", null, [col([U("DSAlert", { color: "SUCCESS", text: D ? "docs.lumenlabs.example is live" : "14 Harbour Lane is saved", description: "You can change it any time." }), row([btn(D ? "Open the site" : "Back to orders", "PRIMARY", "SOLID"), btn("Add another", undefined, "OUTLINE")])], "MD")], { full: true })] };
      return { layout: null, children: [panel(D ? "New site" : "New address", null, parts.flatMap(([t, fs]) => [txt(t, "TITLE_LG"), form(fs)]), { footer: [btn("Save", "PRIMARY", "SOLID"), btn("Cancel", undefined, "OUTLINE")], full: true, back: true })] };
    }
    case "LISTING_EDIT": return { layout: null, children: [panel("Texts", "Change one where it stands", [filterBar(w, false), plainTable(["Text", "Translation", ""], [["Welcome", "Welcome back", ""], ["Sign out", U("DSInput", { valueLink: vl("Log out") }), row([btn("Save", "PRIMARY", "SOLID", undefined), btn("Cancel", undefined, "OUTLINE")])], ["Invite", "Invite someone", ""]])], { footer: [muted("1 to 3 of 48 texts")], full: true })] };
    case "COMMON_NOT_FOUND": return { layout: null, children: [col([lineItem("We could not find that page", "The address may have changed. Go back, or search for what you were looking for.", "PAGE", btn("Back to home", "PRIMARY", "SOLID"))])] };
    case "COMMON_NO_ACCESS": return { layout: null, children: [col([lineItem("You do not have access to this page", `Ask an owner of ${w.record === "Order #1048" ? "your account" : "Lumen Labs"} to give you a role that opens it.`, "PAGE", btn("Ask for access", "PRIMARY", "SOLID"))])] };
    case "COMMON_SERVER_ERROR": return { layout: "CANVAS", children: [col([lineItem("Something went wrong on our side", "We have been told. Try again in a minute, or tell us what you were doing.", "PAGE", btn("Try again", "PRIMARY", "SOLID"))])] };
    case "COMMON_MAINTENANCE": return { layout: "CANVAS", children: [col([lineItem("We are updating Lumen Labs", "It will be back by 10:30 IST. Nothing you saved is lost.", "PAGE")])] };
    default: return { layout: null, children: [], planned: code };
  }
}

const recordCards = (w: W): Tree => grid([0, 1, 2].map((i) => U("DSItemCard", { card: {}, item: { title: String(w.rows[i][0]), description: String(w.rows[i][1]), media: { mtype: "ICON", node: "APP_WINDOW" }, facts: [String(w.rows[i][2])], pageLevel: "WIDGET", orientation: "VERTICAL" } })), 3, 2, 1);
const lineRows = (w: W, c: string): Tree[] => w.rows.slice(0, 4).map((r, i) => lineItem(String(r[0]), String(r[1]), "CONTENT", c === "UNREAD" ? (i < 2 ? badge("New", "PRIMARY", "SOLID") : undefined) : muted(String(r[4])), c === "UNREAD" && i < 2 ? { emphasis: "UNREAD" } : {}));
const detailOf = (w: W): Tree => panel(String(w.rows[1][0]), String(w.rows[1][1]), [col([U("DSDataUnit", { label: w.heads[2], node: String(w.rows[1][2]) }), U("DSDataUnit", { label: w.heads[4], node: String(w.rows[1][4]) })], "SM")], { end: btn("Edit", undefined, "OUTLINE") });
const pickList = (w: W): Tree => panel(w.title, null, [U("DSList", { divided: true }, w.rows.slice(0, 5).map((r, i) => U("DSList.Item", { content: lineItem(String(r[0]), String(r[1]), "CONTENT"), selected: i === 1 })))], { flush: true });
const authPanel = (w: W, c: string): Tree => {
  const email = field("Email", `dana@${w.kind === "DASHBOARD" ? "lumenlabs" : "northwind"}.example`);
  const go = (label: string): unknown[] => [btn(label, "PRIMARY", "SOLID")];
  switch (c) {
    case "SIGN_UP": return panel("Create your account", "A few details, and you are in", [form([field("Name", "Dana Lee"), email, field("Password", "a long phrase")])], { footer: go("Create account") });
    case "RESET": return panel("Reset your password", "We send a link to the email you signed up with", [form([email])], { footer: go("Send reset link") });
    case "INVITE": return panel("Dana Lee invited you to Lumen Labs", "You join as an Editor", [lineItem("Lumen Labs", "24 members, 9 apps", "CONTENT", undefined, { media: { mtype: "ICON", node: "APP_WINDOW" } })], { footer: go("Accept invitation") });
    case "VERIFY": return panel("Check your email", "We sent a six-digit code to dana@lumenlabs.example", [form([field("Code", "482 913")])], { footer: [...go("Verify"), btn("Send it again", undefined, "OUTLINE")] });
    case "CALLBACK": return panel("Signing you in", "Finishing with your provider", [U("DSSpinner", { label: "Finishing sign-in" })]);
    default: return panel("Sign in to Lumen Labs", "Use the email you signed up with", [form([email, field("Password", "a long phrase")])], { footer: go("Sign in") });
  }
};
const entrySteps = (w: W): Tree => panel(D(w) ? "New site" : "New address", null, [U("DSStepper", { items: [{ key: "a", label: "Details", taskState: "DONE" }, { key: "b", label: "Access", taskState: "WORKING" }, { key: "c", label: "Review" }], activeKey: "b", type: "NUMBER" }), form([field("a", true, "switch", D(w) ? "Visible to everyone" : "Use as the billing address"), field("b", false, "switch", D(w) ? "Let search engines list it" : "Leave at the door")])], { footer: [btn("Back", undefined, "OUTLINE"), btn("Continue", "PRIMARY", "SOLID")], full: true, back: true });

function recordHome(w: W, c: string): Drawn {
  const out = (children: Tree[]): Drawn => ({ children, layout: null });
  switch (c) {
    case "WITH_STATS": return out([col([grid(statsOf(w), 4, 2, 2), listPanel(w)], "LG")]);
    case "WITH_SUMMARY": return out([col([panel("Summary", null, [row([txt(String(w.total), "HEADING_MD"), muted(`${w.title.toLowerCase()} in all, ${w.count.toLowerCase()} shown`)], "MD")]), listPanel(w)], "LG")]);
    case "SAVED": return out([panel("Saved for later", "What you kept to come back to", [recordCards(w)], { full: true })]);
    case "ASIDE": return out([U("DSPageFrameAside", { main: listPanel(w), aside: col(statsOf(w).slice(0, 2), "MD") })]);
    case "LIST_DETAIL": return out([U("DSPageFrameListDetail", { list: pickList(w), detail: detailOf(w), backAnchor: { href: "#list" } })]);
    case "GROUPS": return out([U("DSPageFrameGroups", { groups: U("DSNavList", { nodes: ["Account", "Billing"].map((g, i) => ({ type: "ITEM", key: g.toLowerCase(), label: g, anchor: { href: `#${g.toLowerCase()}` }, ...(i === 0 ? { selected: true } : {}) })) }), list: pickList(w), detail: detailOf(w), groupsAnchor: { href: "#groups" }, backAnchor: { href: "#list" } })]);
    case "BY_DAY": return out([col(["Today", "Yesterday"].map((day, i) => panel(`${day} · ${3 - i} events`, null, [U("DSList", { divided: true }, eventRows(w).slice(i * 2, i * 2 + 2).map((r) => U("DSList.Item", { content: lineItem(String(r[1]), String(r[3]), "CONTENT", muted(String(r[0]).slice(-5)), { media: { mtype: "AVATAR", title: String(r[2]) } }) })))])), "LG")]);
    default: return drawing("RECORD_HOME", c, w);
  }
}

function recordView(w: W, c: string): Drawn {
  const { head, lists } = mei();
  switch (c) {
    case "ASIDE": return drawing("RECORD_VIEW", "WITH_PROPERTIES_BESIDE", w);
    case "TABS": case "SUB_PAGES": return drawing("RECORD_VIEW", "TABBED", w);
    case "LIST_DETAIL": return { layout: null, children: [col([head, U("DSPageFrameListDetail", { list: lists[0], detail: lists[1], backAnchor: { href: "#back" } })], "LG")] };
    case "OWN": return drawing("RECORD_VIEW_OWN", "CURRENT_PLAN", w);
    case "SHEET": return drawing("ENTRY_OVER", "", w);
    default: return drawing("RECORD_VIEW", c, w);
  }
}

function recordEntry(w: W, c: string): Drawn {
  switch (c) {
    case "DIALOG": case "SHEET": return drawing("ENTRY_OVER", "", w);
    case "STEPS": return { layout: null, children: [entrySteps(w)] };
    case "WITH_PREVIEW": return drawing("ENTRY_PREVIEW", "", w);
    case "RESUMABLE": return { layout: null, children: [...drawing("ENTRY_FORM", "", w).children, muted("Draft saved a minute ago. Come back any time and it opens where you left it.")] };
    case "REVEAL": case "STEP_UP": return { layout: null, children: [], planned: c };
    default: return drawing("ENTRY_FORM", c === "DONE" ? c : "", w);
  }
}

/** The page of an app a kind draws, by its case. */
export function appPage(code: string, c: string, w: W): Drawn {
  switch (code) {
    case "HOME_APP": return c === "FIRST_USE" ? { layout: null, children: [col([lineItem("Overview", "Welcome to Lumen Labs, Dana", "PAGE"), checklist(1)], "LG")] } : drawing("HOME_APP", c, w);
    case "RECORD_HOME": return recordHome(w, c);
    case "RECORD_VIEW": return recordView(w, c);
    case "RECORD_ENTRY": return recordEntry(w, c);
    case "AUTH_FLOW": return { layout: "CANVAS", children: [col([authPanel(w, c)])] };
    default: return drawing(code, c, w);
  }
}

/** The part of a page an app container kind draws, or null where no piece of the language fits it. */
export function appContainer(code: string, c: string, w: W): Tree[] | null {
  const { lists } = mei();
  switch (code) {
    case "HEAD_PAGE": return [U("DSPageHead", { header: { title: w.title, description: w.description }, headerActions: actions(w) })];
    case "HEAD_RECORD": return [U("DSPageHead", { header: { title: w.record, description: w.recordLine, media: { mtype: "ICON", node: "APP_WINDOW" } }, headerActions: btn("Edit", undefined, "OUTLINE"), backAnchor: { href: "#back" }, backLabel: w.title })];
    case "HEAD_GREETING": return [U("DSPageHead", { header: { title: "Good morning, Dana", description: D(w) ? "Here is what needs you today" : "Here is where your orders stand" } })];
    case "HEAD_PART": return [row([txt("Roles", "TITLE_LG"), btn("Add role", undefined, "OUTLINE", "PLUS")], "MD")];
    case "HOME_WAITING": return [waiting(w)];
    case "HOME_SETUP": return [checklist(3)];
    case "HOME_AREAS": return [grid(["Orders", "Invoices", "Help"].map((t, i) => U("DSCardWidget", { header: { title: t, description: ["What you bought", "What you paid", "Ask us anything"][i] }, parts: [{ mtype: "FREE", key: "go", node: U("DSLink", { label: `Open ${t.toLowerCase()}`, anchor: { href: `#${t.toLowerCase()}` }, size: "SM" }) }] })), 3, 2, 1)];
    case "MEASURE_TILES": return [grid(statsOf(w), 4, 2, 2)];
    case "MEASURE_RANKED": return [panel("Most active", "Who did the most this week", [U("DSList", { divided: true }, w.rows.slice(0, 4).map((r, i) => U("DSList.Item", { content: lineItem(String(r[0]), String(r[1]), "CONTENT", U("DSProgress", { value: 90 - i * 20, max: 100, size: "SM" })) })))])];
    case "MEASURE_PROGRESS": return [panel("Storage", "14 of 20 GB used", [U("DSProgress", { value: 14, max: 20, size: "SM" })])];
    case "LISTING_TABLE":
      if (c === "CHOOSE") return drawing("LISTING_CHOOSE", "", w).children;
      if (c === "EDIT_IN_PLACE") return drawing("LISTING_EDIT", "", w).children;
      if (c === "REORDER") return null;
      return [listPanel(w, c === "" ? undefined : ["Active"])];
    case "LISTING_LIST":
      if (c === "UNREAD" || c === "RECENT") return [panel(w.title, w.description, [U("DSList", { divided: true }, lineRows(w, c).map((r) => U("DSList.Item", { content: r })))], { flush: true })];
      if (c !== "") return null;
      return [panel(w.title, w.description, [dataTable(w.heads, w.rows.slice(0, 5))], { flush: true })];
    case "LISTING_GRID": return [panel(w.title, w.description, [recordCards(w)])];
    case "LISTING_GROUPS": return drawing("LISTING_GROUPS", "", w).children;
    case "RECORD_FACTS": return [panel(w.record, w.recordLine, [col([["Owner", "Dana Lee"], ["Region", "Mumbai"], ["Created", "3 Mar 2024"]].map(([l, v]) => U("DSDataUnit", { label: l, node: v })), "SM")], { footer: [bk()], end: btn("Edit", undefined, "OUTLINE") })];
    case "RECORD_RELATED": return [c === "FIND_AND_ADD" ? col([U("DSAutocomplete", { placeholder: "Find a role to add", options: ["Editor", "Reviewer", "Publisher"].map((k) => ({ key: k.toLowerCase(), label: k })), valueLink: vl(null) }), lists[0]], "MD") : lists[0]];
    case "RECORD_EDIT": return [panel("Details", "Name, owner and region", [form([field("Name", w.record), field("Owner", "Dana Lee"), field("Region", "Mumbai")])], { footer: [bk(), dis()] })];
    case "RECORD_STEPS": return appWidget("PROGRESS_STEPS", "", w);
    case "RECORD_PREVIEW": return [panel("Preview", "What a new member receives", [U("DSCard", {}, [U("DSCard.Content", {}, [txt("Hi Dana, your invite to Lumen Labs is ready.")])])])];
    case "RECORD_DISCUSSION": return [panel("Discussion", "What the team wrote about it", [col([U("DSList", { divided: true }, [["Mei Tan", "Moved it to the Pune team."], ["Ravi Shah", "Checked the owner."]].map(([n, t]) => U("DSList.Item", { content: lineItem(n, t, "CONTENT", undefined, { media: { mtype: "AVATAR", title: n } }) }))), U("DSTextarea", { valueLink: vl(""), rows: 3, placeholder: "Write a note" })], "MD")])];
    case "RECORD_DANGER": return [danger(D(w) ? "app" : "account", "Removes it and its data. It cannot be undone.")];
    case "SETUP_SECTION": return drawing(c === "INHERITED" ? "SETUP_INHERITED" : "SETUP_SECTION", "", w).children;
    case "SETUP_COMPARISON": return drawing("SETUP_COMPARE", "", w).children;
    case "ENTRY_FORM": return drawing("ENTRY_FORM", "", w).children;
    case "ENTRY_STEPS": return [entrySteps(w)];
    case "ENTRY_PREVIEW": return drawing("ENTRY_PREVIEW", "", w).children;
    case "AUTH_PANEL": return [authPanel(w, "SIGN_IN")];
    case "COMMON_FLOOR": return [col([U("DSEmpty", { title: "We could not find that page", description: "The address may have changed. Go back, or search for what you were looking for.", icon: "SEARCH", bordered: true }), btn("Back to home", "PRIMARY", "SOLID")])];
    case "COMMON_FOOTER": return [siteContainer("COMMON_FOOTER", "SHORT", BRIEFS.MARKETING) as Tree];
    default: return null;
  }
}
const D = (w: W): boolean => w.kind === "DASHBOARD";

export function appWidget(code: string, c: string, w: W): Tree[] | null {
  const P = (title: string, content: unknown[], end?: unknown): Tree => panel(title, null, content, { end });
  switch (code) {
    case "CARD_DEFAULT":
      if (c === "ITEMS") return [U("DSCardWidget", { header: { title: w.record, description: w.recordLine }, parts: [{ mtype: "ITEMS", key: "p", items: [{ key: "a", title: "Owner", description: "Dana Lee" }, { key: "b", title: "Region", description: "Mumbai" }, { key: "c", title: "Created", description: "3 Mar 2024" }] }], footer: btn("Open", undefined, "OUTLINE") })];
      if (c === "AREA") return appContainer("HOME_AREAS", "", w);
      return [panel(w.title, w.description, [grid([stat(w.heads[0], "24", "+2 this week", "See all"), stat(w.heads[2], "9", "1 needs setup", "See all"), stat(w.heads[4], "3", "waiting", "See all")], 3, 2, 1)])];
    case "LINE_RECORD": {
      const rows = w.rows.slice(0, 4).map((r, i) => lineItem(String(r[0]), String(r[1]), "CONTENT", c === "UNREAD" ? (i < 2 ? badge("New", "PRIMARY", "SOLID") : undefined) : muted(String(r[4])), c === "UNREAD" && i < 2 ? { emphasis: "UNREAD" } : {}));
      return [P("Lines", [c === "SIDE_LIST" ? col(rows, "SM") : U("DSList", { divided: true }, rows.map((r) => U("DSList.Item", { content: r })))])];
    }
    case "VALUE_STATE": return [P("States", [row([badge("Active", "SUCCESS"), badge("Invited", "INFO"), badge("Suspended", "ERROR"), badge("Pending", "WARNING")], "SM")])];
    case "VALUE_ENTERED": if (c === "SWITCH") return [P("Entered values", [form([field("a", true, "switch", "Require two-step sign-in"), field("b", false, "switch", "Let members stay signed in")])])];
      return [P("Entered values", [form([field("Name", w.rows[0][0] as string), field("Email", String(w.rows[0][1])), field("Note", "Joined from the Pune office.", "area")])])];
    case "VALUE_READ": return [P("Read values", [grid(w.heads.slice(0, 4).map((h, i) => U("DSDataUnit", { label: h, node: String(typeof w.rows[0][i] === "string" ? w.rows[0][i] : "Active") })), 4, 2, 1)])];
    case "BROWSE_FILTERS": {
      if (c === "SAVED_VIEWS") return [P("Filters", [row([U("DSSelect", { options: ["All members", "Admins", "Invited this week"].map((k) => ({ key: k, label: k })), valueLink: vl("Admins") }), filterBar(w)], "MD")])];
      if (c === "APPLIED_CHIPS") return [P("Filters", [filterBar(w), chips(["Admin", "Active"])])];
      if (c === "QUICK_PILLS") return [P("Filters", [row(["All", "Active", "Invited", "Suspended"].map((l, i) => btn(l, i === 0 ? "PRIMARY" : undefined, i === 0 ? "SOLID" : "OUTLINE")), "SM"), filterBar(w, false)])];
      return [P("Filters", [filterBar(w)])];
    }
    case "ACTION_BULK": return [P("Records", [row([muted("3 selected"), btn(D(w) ? "Change role" : "Return items", undefined, "OUTLINE"), btn("Export", undefined, "OUTLINE"), btn("Remove", "ERROR", "OUTLINE")], "SM"), dataTable(w.heads, w.rows.slice(0, 3))])];
    case "NOTICE_EMPTY": {
      const text = c === "NO_RESULTS" ? ["No matches", "Nothing fits the filters you set. Clear them to see everything.", "SEARCH"] : c === "ALL_DONE" ? ["All done", "Nothing is waiting for you.", "CHECK"] : c === "CONNECTION_LOST" ? ["Cannot reach the server", "Check your connection. We keep trying.", "GLOBE"] : [D(w) ? "No sites yet" : "No orders yet", D(w) ? "Create the first site" : "Your first order will appear here", "GLOBE"];
      return [P("Records", [U("DSEmpty", { title: text[0], description: text[1], icon: text[2], bordered: true })])];
    }
    case "NOTICE_DEFAULT": return [P("Notice", [U("DSAlert", { color: "WARNING", text: D(w) ? "Your card expires in December" : "Your order is delayed", description: D(w) ? "Add a new card to keep your sites live." : "It now arrives Friday." })])];
    case "ACTION_JUMP": return [P("Jump", [U("DSCommandPalette", { placeholder: "Jump to a page or a record" })])];
    case "CARD_STAT": return [grid(D(w) ? [stat("Members", "24", "+2 this week", "See members"), stat("Sites", "5", "all live", "See sites"), stat("Apps", "9", "1 needs setup", "See apps"), stat("Invites", "3", "waiting", "See invites")] : [stat("Open orders", "2", "1 on its way", "See orders"), stat("Spent this year", "$418", "since January", "See invoices"), stat("Points", "340", "60 to next", "See rewards")], 4, 2, 2)];
    case "PROGRESS_CHECKLIST": return [checklist(3)];
    case "PROGRESS_STEPS": return [P("Where it is", [U("DSStepper", { items: ["Placed", "Packed", "On its way", "Delivered"].map((l, i) => ({ key: `s${i}`, label: l, ...(i < 2 ? { taskState: "DONE" } : i === 2 ? { taskState: "WORKING" } : {}) })), activeKey: "s2", type: "NUMBER" })])];
    case "CARD_PLAN": return [grid([["Starter", 0, ["1 app", "5 members"]], ["Team", 49, ["Unlimited apps", "50 members"]], ["Company", 199, ["Single sign-on", "Support"]]].map(([n, p, fs], i) => U("DSCardWidget", { header: { title: n as string }, surface: { raised: c === "CURRENT_PLAN" && i === 1 }, parts: [{ mtype: "FREE", key: "p", node: row([U("DSFormatCurrency", { value: p as number, currencyCode: "USD" }), muted("a month")], "SM") }, { mtype: "ITEMS", key: "f", items: (fs as string[]).map((f, j) => ({ key: `f${j}`, title: f })) }, { mtype: "FREE", key: "c", node: c === "CURRENT_PLAN" && i === 1 ? badge("Current plan", "PRIMARY", "SOLID") : btn(`Choose ${n}`, undefined, "OUTLINE") }] })), 3, 2, 1)];
    case "CARD_RECORD": return [grid([0, 1, 2].map((i) => U("DSItemCard", { card: {}, item: { title: String(w.rows[i][0]), description: String(w.rows[i][1]), media: { mtype: "ICON", node: "APP_WINDOW" }, facts: [String(w.rows[i][2])], pageLevel: "WIDGET", orientation: "VERTICAL" } })), 3, 2, 1)];
    case "VALUE_ACTOR": return [P("Actors", [row([lineItem("Dana Lee", "Owner", "CONTENT", undefined, { media: { mtype: "AVATAR", title: "Dana Lee" } }), lineItem("Mei Tan", "Editor", "CONTENT", undefined, { media: { mtype: "AVATAR", title: "Mei Tan" } })], "XL")])];
    case "BROWSE_SEARCH": return [P("Search", [U("DSAutocomplete", { placeholder: w.search, options: w.rows.slice(0, 4).map((r) => ({ key: String(r[0]).toLowerCase(), label: String(r[0]) })), valueLink: vl(null) })])];
    case "BROWSE_RANGE": return [P("Range", [U("DSDateRangePicker", { valueLink: vl({ start: null, end: null }) })])];
    case "PROGRESS_METER": return [P("Progress", [U("DSProgress", { value: 14, max: 20, size: "SM" })])];
    default: return null;
  }
}
export { slot };
