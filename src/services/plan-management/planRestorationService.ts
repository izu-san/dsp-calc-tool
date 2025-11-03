/**
 * Plan Restoration Service
 * Handles restoring plans to application state
 */

import { restorePlan } from "../../utils/planExport";
import type { SavedPlan, GlobalSettings, NodeOverrideSettings } from "../../types";
import type { Recipe } from "../../types/game-data";
import { createLogger } from "../../utils/logger";

const logger = createLogger("PlanRestorationService");

export interface PlanRestorationCallbacks {
  setRecipe: (recipe: Recipe) => void;
  setTargetQuantity: (quantity: number) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
  setNodeOverrides: (overrides: Map<string, NodeOverrideSettings>) => void;
}

export interface PlanRestorationParams {
  plan: SavedPlan;
  recipe: Recipe;
  callbacks: PlanRestorationCallbacks;
  mergeOverrides?: boolean;
  currentOverrides?: Map<string, NodeOverrideSettings>;
}

/**
 * Restore a plan to application state
 */
export function restorePlanToState(params: PlanRestorationParams): void {
  try {
    if (params.mergeOverrides && params.currentOverrides) {
      // Merge overrides: imported wins
      const merged = new Map(params.currentOverrides);
      Object.entries(params.plan.nodeOverrides).forEach(([k, v]) => merged.set(k, v));

      // Restore plan
      restorePlan(
        params.plan,
        () => params.callbacks.setRecipe(params.recipe),
        params.callbacks.setTargetQuantity,
        params.callbacks.updateSettings,
        params.callbacks.setNodeOverrides
      );

      // Apply merged overrides after restoration
      params.callbacks.setNodeOverrides(merged);
    } else {
      // Restore plan without merging
      restorePlan(
        params.plan,
        () => params.callbacks.setRecipe(params.recipe),
        params.callbacks.setTargetQuantity,
        params.callbacks.updateSettings,
        params.callbacks.setNodeOverrides
      );
    }
  } catch (error) {
    logger.error("Failed to restore plan to state", error);
    throw error;
  }
}
