/**
 * History Recording Service
 * Centralizes history recording logic extracted from stores
 */

import type { HistoryEntryType } from "../../types/history";
import { recordHistoryEntry as recordHistoryEntryUtil } from "../../utils/history/recorder";
import { createLogger } from "../../utils/logger";

const logger = createLogger("HistoryRecordingService");

/**
 * History recording parameters
 */
export interface HistoryRecordingParams {
  type: HistoryEntryType;
  description: string;
  before: unknown;
  after: unknown;
  affectedNodes?: string[];
}

/**
 * Record a history entry
 */
export function recordHistoryEntry(params: HistoryRecordingParams): void {
  try {
    recordHistoryEntryUtil(
      params.type,
      params.description,
      params.before,
      params.after,
      params.affectedNodes
    );
  } catch (error) {
    logger.error("Failed to record history entry", error);
  }
}

/**
 * Settings history recording helper
 */
export interface SettingsHistoryParams {
  description: string;
  before: unknown;
  after: unknown;
}

export function recordSettingsHistory(params: SettingsHistoryParams): void {
  recordHistoryEntry({
    type: "settings",
    description: params.description,
    before: params.before,
    after: params.after,
  });
}

/**
 * Plan history recording helper
 */
export interface PlanHistoryParams {
  description: string;
  before: unknown;
  after: unknown;
}

export function recordPlanHistory(params: PlanHistoryParams): void {
  recordHistoryEntry({
    type: "plan",
    description: params.description,
    before: params.before,
    after: params.after,
  });
}

/**
 * Power generation history recording helper
 */
export interface PowerGenerationHistoryParams {
  description: string;
  before: unknown;
  after: unknown;
}

export function recordPowerGenerationHistory(params: PowerGenerationHistoryParams): void {
  recordHistoryEntry({
    type: "powerGeneration",
    description: params.description,
    before: params.before,
    after: params.after,
  });
}

/**
 * Node override history recording helper
 */
export interface NodeOverrideHistoryParams {
  description: string;
  before: unknown;
  after: unknown;
  affectedNodes?: string[];
}

export function recordNodeOverrideHistory(params: NodeOverrideHistoryParams): void {
  recordHistoryEntry({
    type: "nodeOverride",
    description: params.description,
    before: params.before,
    after: params.after,
    affectedNodes: params.affectedNodes,
  });
}
