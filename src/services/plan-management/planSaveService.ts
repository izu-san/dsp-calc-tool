/**
 * Plan Save Service
 * Handles saving plans with version management and history recording
 */

import type { SavedPlan } from "../../types";
import { useHistoryStore } from "../../stores/historyStore";
import { savePlanToStorage, cleanupDuplicatePlans } from "./planStorageService";
import { createLogger } from "../../utils/logger";

const logger = createLogger("PlanSaveService");

export interface PlanSaveParams {
  plan: SavedPlan;
  existingPlanId?: string;
}

/**
 * Save plan with version management and storage
 */
export function savePlanWithVersion(params: PlanSaveParams): string {
  const { plan, existingPlanId } = params;
  const { savePlanVersion } = useHistoryStore.getState();

  // Save to version management with existing planId if found
  const planId = savePlanVersion(plan, existingPlanId);

  // Update plan with planId for localStorage storage
  const planWithId: SavedPlan = {
    ...plan,
    planId,
  };

  try {
    // Save to localStorage
    savePlanToStorage(planWithId);

    // Clean up duplicate plans
    cleanupDuplicatePlans(plan.name);

    return planId;
  } catch (error) {
    logger.error("Failed to save plan with version", error);
    throw error;
  }
}

/**
 * Get default plan name from recipe or timestamp
 */
export function getDefaultPlanName(recipeName?: string): string {
  if (recipeName) {
    return recipeName;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `Plan_${year}-${month}-${day}_${hours}-${minutes}`;
}

/**
 * Create SavedPlan from current state
 */
export interface CreatePlanParams {
  name: string;
  recipeSID: number;
  targetQuantity: number;
  settings: unknown;
  alternativeRecipes: Map<number, number>;
  nodeOverrides: Map<string, unknown>;
  includeOverrides: boolean;
}

export function createPlanFromState(params: CreatePlanParams): SavedPlan {
  return {
    name: params.name,
    timestamp: Date.now(),
    recipeSID: params.recipeSID,
    targetQuantity: params.targetQuantity,
    settings: params.settings as SavedPlan["settings"],
    alternativeRecipes: Object.fromEntries(params.alternativeRecipes),
    nodeOverrides: params.includeOverrides ? Object.fromEntries(params.nodeOverrides) : {},
  };
}
