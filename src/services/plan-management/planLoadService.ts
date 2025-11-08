/**
 * Plan Load Service
 * Handles loading plans with history recording
 */

import i18n from "../../i18n";
import { setInternal } from "../../utils/history/recorder";
import { HISTORY_VERSION } from "../../utils/history/events";
import { useHistoryStore } from "../../stores/historyStore";
import type { SavedPlan, NodeOverrideSettings } from "../../types";
import type { Recipe } from "../../types/game-data";
import { restorePlanToState, type PlanRestorationCallbacks } from "./planRestorationService";
import { createLogger } from "../../utils/logger";

const logger = createLogger("PlanLoadService");

export interface PlanLoadParams {
  plan: SavedPlan;
  recipe: Recipe;
  callbacks: PlanRestorationCallbacks;
  mergeOverrides?: boolean;
  currentOverrides?: Map<string, NodeOverrideSettings>;
  historyDescription?: string;
  historyMetadata?: Record<string, unknown>;
}

/**
 * Load a plan with history recording
 */
export function loadPlanWithHistory(params: PlanLoadParams): void {
  const { pushEntry } = useHistoryStore.getState();

  try {
    // Suppress automatic history recording
    setInternal(true);

    // Restore plan to state
    restorePlanToState({
      plan: params.plan,
      recipe: params.recipe,
      callbacks: params.callbacks,
      mergeOverrides: params.mergeOverrides,
      currentOverrides: params.currentOverrides,
    });

    // Record detailed load history
    const description =
      params.historyDescription ||
      i18n.t("planLoadedFromBrowser", {
        planName: params.plan.name,
        version: params.plan.version || 1,
      });

    pushEntry({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "plan",
      description,
      changes: params.historyMetadata || {},
      previousChanges: {},
      version: HISTORY_VERSION,
      planSnapshot: params.plan,
      locale: i18n.language,
    });

    // Re-enable automatic history recording
    setInternal(false);
  } catch (error) {
    // Re-enable automatic history recording in case of error
    setInternal(false);
    logger.error("Failed to load plan with history", error);
    throw error;
  }
}
