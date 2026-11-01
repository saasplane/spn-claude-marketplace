// This file is the plugins' COPY of the telemetry values spnutils' contract holds (spn-support-ts
// `apps/utility-ts/src/contract/states/spdevex.ts` and `sptests.ts`), which the book states in the workspace
// construct's telemetry row. The hooks that write telemetry cannot load spnutils' contract when they run, so
// the values sit here, beside the writer `timing.ts`, in the contract's structure: one frozen object for each
// enum, named and spelled as the contract names it, and a type of the same name for its values.
//
// Nothing here is authored. toolchain-ts' `telemetry-copy.mjs` reads this file and the contract as text and
// holds them to each other enum for enum and value for value; a change to a value is made in the contract
// first. The stage mapping and the field patterns below are the two things the contract's book states beside
// the enums, and the plugins carry them here so the writer and the readers share one copy of each.

export const SPDevExWorkstreamWorkType = Object.freeze({
  DOCS: 'DOCS',
  CODE: 'CODE',
  GENERATED: 'GENERATED',
  DESIGN: 'DESIGN',
  TEST: 'TEST',
  RELEASE: 'RELEASE',
  PROOF: 'PROOF',
});
export type SPDevExWorkstreamWorkType = (typeof SPDevExWorkstreamWorkType)[keyof typeof SPDevExWorkstreamWorkType];

export const SPDevExAgentHookVerdictType = Object.freeze({
  PASS: 'PASS',
  NOTE: 'NOTE',
  DENY: 'DENY',
});
export type SPDevExAgentHookVerdictType = (typeof SPDevExAgentHookVerdictType)[keyof typeof SPDevExAgentHookVerdictType];

export const SPDevExWorkspaceTelemetryEventType = Object.freeze({
  SESSION_START: 'SessionStart',
  USER_PROMPT_SUBMIT: 'UserPromptSubmit',
  PRE_TOOL_USE: 'PreToolUse',
  POST_TOOL_USE: 'PostToolUse',
  POST_TOOL_USE_FAILURE: 'PostToolUseFailure',
  SUBAGENT_STOP: 'SubagentStop',
  STOP: 'Stop',
  COMMAND: 'command',
});
export type SPDevExWorkspaceTelemetryEventType = (typeof SPDevExWorkspaceTelemetryEventType)[keyof typeof SPDevExWorkspaceTelemetryEventType];

export const SPDevExAgentSkillType = Object.freeze({
  DEVEX_BOOTSTRAP: 'DEVEX_BOOTSTRAP',
  DEVEX_SCM: 'DEVEX_SCM',
  DEVEX_IDEATE: 'DEVEX_IDEATE',
  DEVEX_DEVELOP: 'DEVEX_DEVELOP',
  DEVEX_TEST: 'DEVEX_TEST',
  DEVEX_PROVISION: 'DEVEX_PROVISION',
  DEVEX_DELIVER: 'DEVEX_DELIVER',
  DEVEX_OPERATE: 'DEVEX_OPERATE',
  DEVEX_CHECK: 'DEVEX_CHECK',
  DEVEX_REPORT: 'DEVEX_REPORT',
  DEVEX_EXECUTE: 'DEVEX_EXECUTE',
  SURFACE_DESIGN: 'SURFACE_DESIGN',
  APPS_NEW: 'APPS_NEW',
  APPS_IMPLEMENT: 'APPS_IMPLEMENT',
  APPS_REVIEW: 'APPS_REVIEW',
  APPS_RUN: 'APPS_RUN',
  APPS_VERIFY: 'APPS_VERIFY',
  APPS_RELEASE: 'APPS_RELEASE',
  INFRA_NEW: 'INFRA_NEW',
  INFRA_IMPLEMENT: 'INFRA_IMPLEMENT',
  INFRA_REVIEW: 'INFRA_REVIEW',
  INFRA_RUN: 'INFRA_RUN',
  INFRA_VERIFY: 'INFRA_VERIFY',
  INFRA_RELEASE: 'INFRA_RELEASE',
});
export type SPDevExAgentSkillType = (typeof SPDevExAgentSkillType)[keyof typeof SPDevExAgentSkillType];

export const SPDevExAgentLensType = Object.freeze({
  STRATEGY: 'STRATEGY',
  LEAD: 'LEAD',
  ARCHITECT: 'ARCHITECT',
  SERVER_DEV: 'SERVER_DEV',
  WEB_DEV: 'WEB_DEV',
  QA: 'QA',
  INFRA: 'INFRA',
  PRODUCT: 'PRODUCT',
  UX: 'UX',
  UI: 'UI',
  MARKETING: 'MARKETING',
  VOICE: 'VOICE',
  SALES: 'SALES',
  BUSINESS: 'BUSINESS',
  GROWTH: 'GROWTH',
  SUPPORT: 'SUPPORT',
  FINANCE: 'FINANCE',
  TRUST: 'TRUST',
  DATA: 'DATA',
  AI: 'AI',
  PARTNER: 'PARTNER',
});
export type SPDevExAgentLensType = (typeof SPDevExAgentLensType)[keyof typeof SPDevExAgentLensType];

export const SPDevExAgentPanelVerdictType = Object.freeze({
  PASS: 'PASS',
  PASS_WITH_ADVICE: 'PASS_WITH_ADVICE',
  BLOCKED: 'BLOCKED',
});
export type SPDevExAgentPanelVerdictType = (typeof SPDevExAgentPanelVerdictType)[keyof typeof SPDevExAgentPanelVerdictType];

export const SPDevExStageType = Object.freeze({
  BOOTSTRAP: 'BOOTSTRAP',
  SCM: 'SCM',
  IDEATE: 'IDEATE',
  DEVELOP: 'DEVELOP',
  TEST: 'TEST',
  PROVISION: 'PROVISION',
  DELIVER: 'DELIVER',
  OPERATE: 'OPERATE',
});
export type SPDevExStageType = (typeof SPDevExStageType)[keyof typeof SPDevExStageType];

export const SPTestTierType = Object.freeze({
  UNIT: 'UNIT',
  INTEGRATION: 'INTEGRATION',
  CONTRACT: 'CONTRACT',
  COMPONENT: 'COMPONENT',
  JOURNEY: 'JOURNEY',
});
export type SPTestTierType = (typeof SPTestTierType)[keyof typeof SPTestTierType];

export const SPDocBehaviourStatusType = Object.freeze({
  PLANNED: 'PLANNED',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  MANUAL: 'MANUAL',
});
export type SPDocBehaviourStatusType = (typeof SPDocBehaviourStatusType)[keyof typeof SPDocBehaviourStatusType];

export const SPDevExWorkspaceTelemetryRowType = Object.freeze({
  TURN: 'TURN',
  CHECK: 'CHECK',
  COMMAND: 'COMMAND',
  TEST: 'TEST',
  PANEL: 'PANEL',
});
export type SPDevExWorkspaceTelemetryRowType = (typeof SPDevExWorkspaceTelemetryRowType)[keyof typeof SPDevExWorkspaceTelemetryRowType];

export const SPDevExWorkspaceTelemetryVersionType = Object.freeze({
  V1: 1,
});
export type SPDevExWorkspaceTelemetryVersionType = (typeof SPDevExWorkspaceTelemetryVersionType)[keyof typeof SPDevExWorkspaceTelemetryVersionType];


/** The workstream, arc, part and retry patterns a row's free-text fields are held to; the first three are the contract's own. */
export const WORKSTREAM_PATTERN = /^\d{3}-[a-z0-9][a-z0-9-]*$/;
export const ARC_PATTERN = /^N\d{3}$/;
export const PART_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
/** A row's id, or the id of the row a retry points at: a message id or a short random id. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/** A hook check's name, and a test run's project id. */
export const CHECK_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
export const NODE_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** The value where it matches the pattern, else null: a value that does not look like what its field holds is never written. */
export function held(value: unknown, pattern: RegExp): string | null {
  return typeof value === "string" && pattern.test(value) ? value : null;
}

/** The contract's value of an enum for `value`, or null where the enum holds none like it. */
export function known<T extends string>(values: Readonly<Record<string, T | number>>, value: unknown): T | null {
  return typeof value === "string" && (Object.values(values) as unknown[]).includes(value) ? value as T : null;
}

/** The skill a Skill call names (`spn-devex:execute`, or a bare `execute`) as its value of SPDevExAgentSkillType; null for one the copy does not know. */
export function skillValue(name: unknown): SPDevExAgentSkillType | null {
  if (typeof name !== "string") return null;
  const bare = name.trim().replace(/^\//, "");
  const [plugin, folder] = bare.includes(":") ? bare.split(":", 2) : ["spn-devex", bare];
  const domain = plugin.replace(/^spn-/, "").toUpperCase();
  return known(SPDevExAgentSkillType, `${domain}_${folder.toUpperCase().replace(/-/g, "_")}`);
}

/**
 * The one mapping from a row's skill and work to a DevEx stage, read when rows are read and never stored (the
 * skills construct). A devex stage skill gives its own stage; a provider's NEW gives SCM, VERIFY TEST, IMPLEMENT,
 * REVIEW and RUN DEVELOP, RELEASE DELIVER, and SURFACE_DESIGN IDEATE; DEVEX_CHECK, DEVEX_REPORT and DEVEX_EXECUTE
 * take it from the work: DOCS, CODE and GENERATED are DEVELOP, TEST and PROOF are TEST, RELEASE is DELIVER; no
 * work, no stage.
 */
export function stageOf(skill: string | null | undefined, work: string | null | undefined): SPDevExStageType | null {
  const S = SPDevExStageType;
  switch (skill) {
    case "DEVEX_BOOTSTRAP": return S.BOOTSTRAP;
    case "DEVEX_SCM": return S.SCM;
    case "DEVEX_IDEATE": return S.IDEATE;
    case "DEVEX_DEVELOP": return S.DEVELOP;
    case "DEVEX_TEST": return S.TEST;
    case "DEVEX_PROVISION": return S.PROVISION;
    case "DEVEX_DELIVER": return S.DELIVER;
    case "DEVEX_OPERATE": return S.OPERATE;
    case "APPS_NEW": case "INFRA_NEW": return S.SCM;
    case "APPS_VERIFY": case "INFRA_VERIFY": return S.TEST;
    case "APPS_IMPLEMENT": case "INFRA_IMPLEMENT": case "APPS_REVIEW": case "INFRA_REVIEW": case "APPS_RUN": case "INFRA_RUN": return S.DEVELOP;
    case "APPS_RELEASE": case "INFRA_RELEASE": return S.DELIVER;
    case "SURFACE_DESIGN": return S.IDEATE;
    case "DEVEX_CHECK": case "DEVEX_REPORT": case "DEVEX_EXECUTE": {
      const W = SPDevExWorkstreamWorkType;
      if (work === W.DOCS || work === W.CODE || work === W.GENERATED) return S.DEVELOP;
      if (work === W.TEST || work === W.PROOF) return S.TEST;
      if (work === W.RELEASE) return S.DELIVER;
      return null;
    }
    default: return null;
  }
}

/** Every enum the copy holds, by the contract's name, for a reader that looks one up. */
export const TELEMETRY_VALUES = Object.freeze({
  SPDevExWorkstreamWorkType, SPDevExAgentHookVerdictType, SPDevExWorkspaceTelemetryEventType, SPDevExAgentSkillType,
  SPDevExAgentLensType, SPDevExAgentPanelVerdictType, SPDevExStageType, SPTestTierType, SPDocBehaviourStatusType,
  SPDevExWorkspaceTelemetryRowType, SPDevExWorkspaceTelemetryVersionType,
});
