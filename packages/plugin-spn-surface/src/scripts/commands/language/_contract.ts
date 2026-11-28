// The contract's validators for a language folder, bundled into this plugin at build from @saasplane/support-contract-ts, so a
// language is read exactly as Support reads it. An absent key reads as null, as every SaaS Plane reader takes a document.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  SPSurfaceDataFileSchema,
  SPSurfaceDataIndexSchema,
  SPSurfaceDataSourcesSchema,
  SPSurfaceDataTypesSchema,
  SPSurfaceLanguageSchema,
  SPSurfaceSamplesSchema,
} from "@saasplane/support-contract-ts";
import { prepareZodDocument } from "@saasplane/support-ts";

type Schema = Parameters<typeof prepareZodDocument>[1];

/** One file against its state: the problems, each naming the file and the path, or none. */
function read(file: string, label: string, schema: Schema): string[] {
  let raw: unknown;
  try { raw = JSON.parse(readFileSync(file, "utf8")); } catch (error) { return [`${label} is not JSON: ${(error as Error).message}`]; }
  const parsed = prepareZodDocument(raw, schema);
  return parsed.success ? [] : parsed.error.issues.map((issue) => `${label}: ${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`);
}

/** Each file a language folder holds, read against the contract's state for it. */
export function readContractProblems(folder: string): string[] {
  const problems: string[] = [];
  const at = (relative: string): string => join(folder, relative);
  problems.push(...read(at("spdl.json"), "spdl.json", SPSurfaceLanguageSchema));
  if (existsSync(at("types.json"))) problems.push(...read(at("types.json"), "types.json", SPSurfaceDataTypesSchema));
  if (existsSync(at("samples.json"))) problems.push(...read(at("samples.json"), "samples.json", SPSurfaceSamplesSchema));
  if (existsSync(at("assets/sources.json"))) problems.push(...read(at("assets/sources.json"), "assets/sources.json", SPSurfaceDataSourcesSchema));
  if (existsSync(at("data"))) {
    if (existsSync(at("data/index.json"))) problems.push(...read(at("data/index.json"), "data/index.json", SPSurfaceDataIndexSchema));
    for (const file of readdirSync(at("data")).filter((one) => one.endsWith(".json") && one !== "index.json").sort())
      problems.push(...read(at(join("data", file)), `data/${file}`, SPSurfaceDataFileSchema));
  }
  return problems;
}
