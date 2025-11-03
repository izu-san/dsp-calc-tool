/**
 * Plan Storage Service
 * Handles localStorage operations for plans
 */

import type { SavedPlan, SerializedPlan } from "../../types";
import { createLogger } from "../../utils/logger";

const logger = createLogger("PlanStorageService");
const PLAN_VERSION = "1.0.0";

export interface RecentPlan {
  key: string;
  name: string;
  timestamp: number;
  planId?: string;
}

/**
 * Save plan to localStorage
 */
export function savePlanToStorage(plan: SavedPlan): void {
  const key = `plan_${plan.timestamp}`;
  const serialized: SerializedPlan = {
    version: PLAN_VERSION,
    plan,
  };

  try {
    localStorage.setItem(key, JSON.stringify(serialized));

    // Update recent plans list
    const recentPlans = getRecentPlans();

    // Remove old entries with the same planId to avoid duplicates
    const filteredPlans = plan.planId
      ? recentPlans.filter(p => p.planId !== plan.planId)
      : recentPlans;

    // Also remove old localStorage items for the same planId
    if (plan.planId && recentPlans.some(p => p.planId === plan.planId)) {
      recentPlans.forEach(p => {
        if (p.planId === plan.planId) {
          localStorage.removeItem(p.key);
        }
      });
    }

    filteredPlans.unshift({
      key,
      name: plan.name,
      timestamp: plan.timestamp,
      planId: plan.planId,
    });

    // Keep only last 10 plans
    const plansToKeep = filteredPlans.slice(0, 10);
    localStorage.setItem("recent_plans", JSON.stringify(plansToKeep));

    // Remove old plans
    filteredPlans.slice(10).forEach(p => {
      localStorage.removeItem(p.key);
    });
  } catch (error) {
    logger.error("Failed to save plan to localStorage", error);
    throw error;
  }
}

/**
 * Get recent plans from localStorage
 */
export function getRecentPlans(): RecentPlan[] {
  try {
    const stored = localStorage.getItem("recent_plans");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error("Failed to get recent plans from localStorage", error);
    return [];
  }
}

/**
 * Load plan from localStorage
 */
export function loadPlanFromStorage(key: string): SavedPlan | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const data: SerializedPlan = JSON.parse(stored);
    return data.plan;
  } catch (error) {
    logger.error(`Failed to load plan from localStorage (key: ${key})`, error);
    return null;
  }
}

/**
 * Delete plan from localStorage
 */
export function deletePlanFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);

    const recentPlans = getRecentPlans();
    const filtered = recentPlans.filter(p => p.key !== key);
    localStorage.setItem("recent_plans", JSON.stringify(filtered));
  } catch (error) {
    logger.error(`Failed to delete plan from localStorage (key: ${key})`, error);
    throw error;
  }
}

/**
 * Clean up duplicate plans by name
 */
export function cleanupDuplicatePlans(planName: string): void {
  try {
    const recentPlansList = getRecentPlans();
    const plansWithSameName = recentPlansList.filter(p => p.name === planName);

    if (plansWithSameName.length > 1) {
      // Keep only the most recent one
      const plansToKeep = plansWithSameName.sort((a, b) => b.timestamp - a.timestamp).slice(0, 1);
      const plansToRemove = plansWithSameName.filter(p => !plansToKeep.includes(p));

      // Remove old plans from localStorage
      plansToRemove.forEach(p => {
        localStorage.removeItem(p.key);
      });

      // Update recent plans list
      const filteredPlans = recentPlansList.filter(p => !plansToRemove.includes(p));
      localStorage.setItem("recent_plans", JSON.stringify(filteredPlans));
    }
  } catch (error) {
    logger.error("Failed to cleanup duplicate plans", error);
    throw error;
  }
}
