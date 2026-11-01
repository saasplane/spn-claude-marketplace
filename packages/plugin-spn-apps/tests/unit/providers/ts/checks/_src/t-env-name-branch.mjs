// `env-name-branch` (MKT.HOOKS.391) — a comparison of env, APP_ENV or NODE_ENV against a literal environment name is refused.
import { one, done, tree } from "../../../../../helpers/harness.mjs";

const FILE = "apps/web-dmo/src/app/config.ts";
const deny = (label, content, says = "isDebug") =>
  one(`[MKT.HOOKS.391] ${label}`, { script: "env-name-branch", root: tree({ [FILE]: "" }), input: { file_path: FILE, content }, expect: "deny", says });
const quiet = (label, content, file = FILE) =>
  one(`[MKT.HOOKS.391] ${label}`, { script: "env-name-branch", root: tree({ [file]: "" }), input: { file_path: file, content }, expect: "" });

console.log("=== env-name-branch — known-bad");
deny("env equals production", "export const live = this.appConfig.env === 'production';\n");
deny("APP_ENV not equal dev", "if (APP_ENV !== \"dev\") { start(); }\n");
deny("process.env.NODE_ENV against staging", "const s = process.env.NODE_ENV == `staging`;\n");
deny("the literal first", "const p = 'production' === env;\n");
deny("the refusal names the corrected form", "const p = env === 'production';\n", "named for what it does");

console.log("\n=== env-name-branch — untouched");
quiet("a setting named for what it does", "export const isDebug = config.isDebug;\n");
quiet("a comparison against a variable", "const same = env === otherEnv;\n");
quiet("another setting against a literal", "const a = mode === 'production';\n");
quiet("a comparison quoted in a comment", "// never write env === 'production'\nconst x = 1;\n");
quiet("a file outside src", "const p = env === 'production';\n", "apps/web-dmo/vite.config.ts");
quiet("a test file", "const p = env === 'production';\n", "apps/web-dmo/src/app/config.test.ts");

done("env-name-branch");
