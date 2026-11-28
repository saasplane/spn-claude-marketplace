// The shapes the samples command passes between its parts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tree = Record<string, any>;

/** One section of a sample page: what it shows, in which case, the one sentence of its note, and the node the render draws. */
export type Entry = { kind: string; case: string; note: string; node: Tree; planned: boolean; heading?: boolean };

/** One whole screen of a page that shows several, a tab of its Case switch: a layout and its cases, a page kind's cases, or a Common screen. */
export type PageCase = { code: string; title: string; entries: Entry[]; layout: string };

/** One sample page, before it is drawn: where it goes, what it is called, and the entries it holds in order. */
export type Page = {
  /** The path under the samples home, such as `02-site/01-marketing/02-pages/01-home.html`. */
  file: string;
  /** The page's short name, at most three words. */
  title: string;
  category: string;
  part: string;
  /** The catalogue codes the page shows. */
  kinds: string[];
  entries: Entry[];
  /** The question the page answers, one sentence, for the index. */
  ask: string;
  /** The layout the entries stand in. */
  layout: string;
  /** The whole screens the page shows on its Case switch, the default first; the page's entries and layout are the first's. */
  cases?: PageCase[];
};

/** One kind of the catalogue, as the samples read it. */
export type CatCase = { code: string; when?: string; status?: string; missing?: string; units?: unknown; order?: Array<string | { kind: string; case?: string }> };
export type CatKind = {
  code: string; title: string; description: string; status: string; missing?: string;
  cases?: CatCase[]; defaultCase?: string; style?: unknown; order?: Array<string | { kind: string; case?: string }>; units?: unknown; placement?: unknown;
};
