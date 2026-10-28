#!/usr/bin/env node
// RESTATES: `plugin-spn-infra/src/refs/support/infra/README.md` § no hand edits to built output. The ref governs.
//
// Refuse a hand edit to a rendering, at the moment it is written.
//
// **`dist/` IS STAGED WHOLE BY `spnutils infra release` AND PUBLISHED AS IS**, so an edit there is
// overwritten by the next build. The edit does not fail — it works, ships, and disappears, taking
// whatever it was fixing with it. That is the worst shape a mistake can take, because nothing
// reports it and the symptom returns later looking new.
//
// **THIS RULE READS THE PATH ALONE AND NEEDS NO TEXT**, which is why it costs nothing to run on
// every write. It is the one rendering rule that can decide without parsing anything.
import type { Rule } from "./law.ts";

export const RULES: Rule[] = [
  {
    name: "dist-is-build-output",
    applies: (path) => path.includes("/dist/"),
    run: (path) => ({
      deny: `Denied: ${path} is under dist/ — the artifact is staged by the build (spinfrapkg.json + src/**, whole) and published as-is. Edit the source under src/ and rebuild; never hand-edit dist/.`,
    }),
  },
];
