import type { SavedPlan, GameData } from "../types";
import { getMachineRankLabel } from "./history/description";

/**
 * Types of changes in a plan
 */
export type PlanDiffType = "add" | "remove" | "change";

/**
 * Single change entry in a plan
 */
export interface PlanDiffEntry {
  /** Property path (e.g., "settings.proliferator.type") */
  path: string;
  /** Type of change */
  type: PlanDiffType;
  /** Value before change */
  before?: unknown;
  /** Value after change */
  after?: unknown;
}

/**
 * Compare two plans and return the differences
 * @param beforePlan - Older version of the plan
 * @param afterPlan - Newer version of the plan
 * @returns Array of differences
 */
export function calculatePlanDiff(beforePlan: SavedPlan, afterPlan: SavedPlan): PlanDiffEntry[] {
  const diffs: PlanDiffEntry[] = [];

  // Compare basic fields
  compareField("name", beforePlan.name, afterPlan.name, diffs);
  compareField("recipeSID", beforePlan.recipeSID, afterPlan.recipeSID, diffs);
  compareField("targetQuantity", beforePlan.targetQuantity, afterPlan.targetQuantity, diffs);
  compareField("description", beforePlan.description, afterPlan.description, diffs);

  // Compare settings (excluding derived values)
  compareSettingsObject(beforePlan.settings, afterPlan.settings, diffs);

  // Compare alternative recipes
  compareAlternativeRecipesObject(
    beforePlan.alternativeRecipes,
    afterPlan.alternativeRecipes,
    diffs
  );

  // Compare node overrides
  compareObject("nodeOverrides", beforePlan.nodeOverrides, afterPlan.nodeOverrides, diffs);

  // Compare power generation settings
  if (beforePlan.powerGenerationSettings || afterPlan.powerGenerationSettings) {
    compareObject(
      "powerGenerationSettings",
      beforePlan.powerGenerationSettings,
      afterPlan.powerGenerationSettings,
      diffs
    );
  }

  return diffs;
}

/**
 * Compare settings object excluding derived values
 */
function compareSettingsObject(before: unknown, after: unknown, diffs: PlanDiffEntry[]): void {
  if (
    typeof before !== "object" ||
    before === null ||
    typeof after !== "object" ||
    after === null
  ) {
    return;
  }

  const beforeObj = before as Record<string, unknown>;
  const afterObj = after as Record<string, unknown>;

  const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

  for (const key of allKeys) {
    const beforeValue = beforeObj[key];
    const afterValue = afterObj[key];

    // Handle proliferator (exclude derived values)
    if (key === "proliferator") {
      compareProliferatorObject("settings.proliferator", beforeValue, afterValue, diffs);
    } else if (key === "conveyorBelt") {
      // Only compare tier, exclude speed and stackCount
      compareConveyorBeltObject("settings.conveyorBelt", beforeValue, afterValue, diffs);
    } else if (key === "sorter") {
      // Only compare tier, exclude powerConsumption
      compareSorterObject("settings.sorter", beforeValue, afterValue, diffs);
    } else {
      // Regular object comparison
      const path = `settings.${key}`;
      if (
        typeof beforeValue === "object" &&
        beforeValue !== null &&
        typeof afterValue === "object" &&
        afterValue !== null
      ) {
        compareObject(path, beforeValue, afterValue, diffs);
      } else {
        compareField(path, beforeValue, afterValue, diffs);
      }
    }
  }
}

/**
 * Compare proliferator object excluding derived values
 */
function compareProliferatorObject(
  basePath: string,
  before: unknown,
  after: unknown,
  diffs: PlanDiffEntry[]
): void {
  if (
    typeof before !== "object" ||
    before === null ||
    typeof after !== "object" ||
    after === null
  ) {
    return;
  }

  const beforeObj = before as Record<string, unknown>;
  const afterObj = after as Record<string, unknown>;

  // Only compare type and mode, exclude derived values
  const keysToCompare = ["type", "mode"];

  for (const key of keysToCompare) {
    const path = `${basePath}.${key}`;
    compareField(path, beforeObj[key], afterObj[key], diffs);
  }
}

/**
 * Compare conveyor belt object, only compare tier (exclude speed and stackCount)
 */
function compareConveyorBeltObject(
  basePath: string,
  before: unknown,
  after: unknown,
  diffs: PlanDiffEntry[]
): void {
  if (
    typeof before !== "object" ||
    before === null ||
    typeof after !== "object" ||
    after === null
  ) {
    return;
  }

  const beforeObj = before as Record<string, unknown>;
  const afterObj = after as Record<string, unknown>;

  // Only compare tier, exclude speed and stackCount
  compareField(`${basePath}.tier`, beforeObj.tier, afterObj.tier, diffs);
}

/**
 * Compare sorter object, only compare tier (exclude powerConsumption)
 */
function compareSorterObject(
  basePath: string,
  before: unknown,
  after: unknown,
  diffs: PlanDiffEntry[]
): void {
  if (
    typeof before !== "object" ||
    before === null ||
    typeof after !== "object" ||
    after === null
  ) {
    return;
  }

  const beforeObj = before as Record<string, unknown>;
  const afterObj = after as Record<string, unknown>;

  // Only compare tier, exclude powerConsumption
  compareField(`${basePath}.tier`, beforeObj.tier, afterObj.tier, diffs);
}

/**
 * Compare alternative recipes object with proper formatting
 */
function compareAlternativeRecipesObject(
  before: unknown,
  after: unknown,
  diffs: PlanDiffEntry[]
): void {
  if (
    typeof before !== "object" ||
    before === null ||
    typeof after !== "object" ||
    after === null
  ) {
    return;
  }

  const beforeObj = before as Record<string, unknown>;
  const afterObj = after as Record<string, unknown>;

  const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

  for (const key of allKeys) {
    const path = `alternativeRecipes.${key}`;
    compareField(path, beforeObj[key], afterObj[key], diffs);
  }
}

/**
 * Compare a single field and add to diffs if different
 */
function compareField(path: string, before: unknown, after: unknown, diffs: PlanDiffEntry[]): void {
  if (before !== after) {
    if (before === undefined) {
      diffs.push({ path, type: "add", after });
    } else if (after === undefined) {
      diffs.push({ path, type: "remove", before });
    } else {
      diffs.push({ path, type: "change", before, after });
    }
  }
}

/**
 * Compare two objects recursively
 */
function compareObject(
  basePath: string,
  before: unknown,
  after: unknown,
  diffs: PlanDiffEntry[]
): void {
  if (before === undefined && after === undefined) {
    return;
  }

  if (before === undefined) {
    diffs.push({ path: basePath, type: "add", after });
    return;
  }

  if (after === undefined) {
    diffs.push({ path: basePath, type: "remove", before });
    return;
  }

  if (
    typeof before !== "object" ||
    before === null ||
    typeof after !== "object" ||
    after === null
  ) {
    if (before !== after) {
      diffs.push({ path: basePath, type: "change", before, after });
    }
    return;
  }

  const beforeObj = before as Record<string, unknown>;
  const afterObj = after as Record<string, unknown>;

  const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

  for (const key of allKeys) {
    const beforeValue = beforeObj[key];
    const afterValue = afterObj[key];
    const path = `${basePath}.${key}`;

    if (
      typeof beforeValue === "object" &&
      beforeValue !== null &&
      typeof afterValue === "object" &&
      afterValue !== null
    ) {
      compareObject(path, beforeValue, afterValue, diffs);
    } else {
      compareField(path, beforeValue, afterValue, diffs);
    }
  }
}

/**
 * Format a value for display in diff view
 */
export function formatDiffValue(
  value: unknown,
  path?: string,
  data?: GameData | null,
  t?: (key: string) => string
): string {
  if (value === undefined || value === null) {
    return "—";
  }

  // Handle machine rank values
  if (path && path.includes("machineRank")) {
    const recipeType = extractRecipeTypeFromPath(path);
    if (typeof value === "string") {
      return getMachineRankLabel(recipeType, value);
    }
  }

  // Handle recipe SID
  if (path === "recipeSID" && typeof value === "number") {
    const recipe = data?.recipes.get(value);
    if (recipe) {
      return recipe.name;
    }
  }

  // Handle alternative recipes (itemId -> recipeSID)
  if (path && path.startsWith("alternativeRecipes.") && typeof value === "number") {
    // value is recipeSID
    const recipe = data?.recipes.get(value);
    if (recipe) {
      return recipe.name;
    }
  }

  // Handle proliferator values
  if (path && path.includes("proliferator")) {
    if (typeof value === "string") {
      if (t) {
        // Handle proliferator type
        if (path.includes("type")) {
          if (value === "none") return t("none");
          if (value === "mk1") return t("proliferatorMK1");
          if (value === "mk2") return t("proliferatorMK2");
          if (value === "mk3") return t("proliferatorMK3");
        }
        // Handle proliferator mode
        if (path.includes("mode")) {
          if (value === "speed") return t("speedMode");
          if (value === "production") return t("productionMode");
          if (value === "none") return t("none");
        }
      } else {
        // Fallback for testing
        if (path.includes("mode")) {
          if (value === "speed") return "生産速度上昇";
          if (value === "production") return "追加生産";
          if (value === "none") return "なし";
        }
        if (path.includes("type") && value === "none") return "なし";
      }
    }
  }

  // Handle sorter tier values
  if (path && path.includes("sorter") && path.includes("tier")) {
    if (typeof value === "string") {
      if (t) {
        if (value === "mk1") return t("sorterMkI");
        if (value === "mk2") return t("sorterMkII");
        if (value === "mk3") return t("sorterMkIII");
        if (value === "pile") return t("pilingSorter");
      } else {
        // Fallback for testing
        if (value === "pile") return "集積ソーター";
      }
    }
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

/**
 * Extract recipe type from a path like "settings.machineRank.Smelt"
 */
function extractRecipeTypeFromPath(path: string): string {
  const parts = path.split(".");
  const lastPart = parts[parts.length - 1];
  // Map common keys to recipe types
  const recipeTypeMap: Record<string, string> = {
    Smelt: "Smelt",
    Assemble: "Assemble",
    Chemical: "Chemical",
    Research: "Research",
    Refine: "Refine",
    Particle: "Particle",
  };
  return recipeTypeMap[lastPart] || lastPart;
}

/**
 * Get human-readable path name
 */
export function getPathDisplayName(path: string, t: (key: string) => string): string {
  // Map common paths to i18n keys
  const pathMap: Record<string, string> = {
    name: "planName",
    recipeSID: "recipe",
    targetQuantity: "targetQuantity",
    description: "description",
    "settings.proliferator.type": "proliferator",
    "settings.proliferator.mode": "proliferatorMode",
    "settings.machineRank": "machineRank",
    "settings.conveyorBelt.tier": "conveyorBelt",
    "settings.sorter.tier": "sorter",
    "settings.miningSpeedResearch": "miningSpeedResearch",
    alternativeRecipes: "alternativeRecipes",
    nodeOverrides: "nodeOverrides",
    powerGenerationSettings: "powerGeneration.title",
  };

  // Handle nested paths like "settings.machineRank.Smelt"
  if (path.startsWith("settings.machineRank.")) {
    const recipeType = path.replace("settings.machineRank.", "");
    const recipeTypeMap: Record<string, string> = {
      Smelt: "smelter",
      Assemble: "assembler",
      Chemical: "chemicalPlant",
      Research: "matrixLab",
      Refine: "oilRefinery",
      Particle: "particleCollider",
    };
    return `${t("machineRank")} (${t(recipeTypeMap[recipeType] || recipeType)})`;
  }

  // Handle alternative recipes paths (alternativeRecipes.itemId)
  if (path.startsWith("alternativeRecipes.")) {
    return t("alternativeRecipe");
  }

  // Handle proliferator type and mode
  if (path.startsWith("settings.proliferator.")) {
    const part = path.replace("settings.proliferator.", "");
    if (part === "type") {
      return t("proliferator");
    }
    if (part === "mode") {
      return t("proliferatorMode");
    }
  }

  return t(pathMap[path] || path);
}
