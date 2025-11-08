import type { HistoryEntry } from "../../types/history";
import { useGameDataStore } from "../../stores/gameDataStore";
import {
  generateProliferatorDescription,
  generateMachineRankDescription,
  generateConveyorBeltDescription,
  generateSorterDescription,
  generateAlternativeRecipeDescription,
  generateMiningSpeedResearchDescription,
  generateProliferatorMultiplierDescription,
  generatePowerGenerationTemplateDescription,
  generateManualPowerGeneratorDescription,
  generateManualPowerFuelDescription,
  generatePowerFuelProliferatorDescription,
  generateNodeOverrideDescription,
  generateNodeOverrideResetDescription,
  generateRecipeSelectionDescription,
  generateTargetQuantityDescription,
  generateTemplateDescription,
} from "./formatters";
import i18n from "../../i18n";

/**
 * Regenerate history description in current locale
 *
 * This function attempts to regenerate a history entry's description
 * in the current locale based on the changes and previousChanges.
 * If the entry was created in a different locale, it will be translated.
 */
export function regenerateHistoryDescription(entry: HistoryEntry): string {
  // If locale matches or is missing, return original description
  const currentLocale = i18n.language;
  if (!entry.locale || entry.locale === currentLocale) {
    return entry.description;
  }

  // Attempt to regenerate description based on entry type
  try {
    switch (entry.type) {
      case "settings":
        return regenerateSettingsDescription(entry, currentLocale);
      case "nodeOverride":
        return regenerateNodeOverrideDescription(entry, currentLocale);
      case "powerGeneration":
        return regeneratePowerGenerationDescription(entry, currentLocale);
      case "plan":
        return regeneratePlanDescription(entry, currentLocale);
      default:
        return entry.description;
    }
  } catch (error) {
    // If regeneration fails, return original description
    console.warn("Failed to regenerate history description:", error);
    return entry.description;
  }
}

/**
 * Regenerate settings description
 */
function regenerateSettingsDescription(entry: HistoryEntry, locale: string): string {
  const t = (key: string) => i18n.t(key);
  const data = useGameDataStore.getState().data;

  // Try to match based on common change patterns
  const changes = entry.changes;
  const previousChanges = entry.previousChanges || {};

  // Check for template application first (highest priority for batch operations)
  if (changes.selectedTemplate) {
    const afterTemplate = changes.selectedTemplate as string;
    return generateTemplateDescription(afterTemplate, t, locale);
  }

  // Check for proliferator changes
  if (changes["settings.proliferator"]) {
    const prolifChanges = changes["settings.proliferator"] as Record<string, unknown>;
    const prolifPrev = (previousChanges["settings.proliferator"] as Record<string, unknown>) || {};

    if (prolifChanges.type || prolifChanges.mode) {
      const before = {
        type: (prolifPrev.type as string) || "none",
        mode: (prolifPrev.mode as string) || "speed",
      };
      const after = {
        type: (prolifChanges.type as string) || before.type,
        mode: (prolifChanges.mode as string) || before.mode,
      };
      return generateProliferatorDescription(before, after, t, locale);
    }
  }

  // Check for machine rank changes
  for (const key of Object.keys(changes)) {
    if (key.startsWith("settings.machineRank.")) {
      const recipeType = key.split(".")[2];
      const beforeRank = (previousChanges[key] as string) || "";
      const afterRank = (changes[key] as string) || "";
      if (recipeType && beforeRank && afterRank) {
        return generateMachineRankDescription(recipeType, beforeRank, afterRank, t, locale);
      }
    }
  }

  // Check for conveyor belt changes
  if (changes["settings.conveyorBelt"]) {
    const beltChanges = changes["settings.conveyorBelt"] as Record<string, unknown>;
    const beltPrev = (previousChanges["settings.conveyorBelt"] as Record<string, unknown>) || {};

    const before = {
      tier: (beltPrev.tier as string) || "mk1",
      stackCount: (beltPrev.stackCount as number) || 1,
    };
    const after = {
      tier: (beltChanges.tier as string) || before.tier,
      stackCount: (beltChanges.stackCount as number) || before.stackCount,
    };
    return generateConveyorBeltDescription(before, after, t, locale);
  }

  // Check for sorter changes
  if (changes["settings.sorter"]) {
    const sorterChanges = changes["settings.sorter"] as Record<string, unknown>;
    const sorterPrev = (previousChanges["settings.sorter"] as Record<string, unknown>) || {};

    const before = {
      tier: (sorterPrev.tier as string) || "mk1",
    };
    const after = {
      tier: (sorterChanges.tier as string) || before.tier,
    };
    return generateSorterDescription(before, after, t, locale);
  }

  // Check for alternative recipe changes
  if (changes["settings.alternativeRecipes"]) {
    const altRecipesChanges = changes["settings.alternativeRecipes"] as Record<string, unknown>;

    for (const itemIdStr of Object.keys(altRecipesChanges)) {
      const itemId = Number(itemIdStr);
      const beforeRecipeSID = previousChanges["settings.alternativeRecipes"]
        ? ((previousChanges["settings.alternativeRecipes"] as Record<string, unknown>)[
            itemIdStr
          ] as number | undefined)
        : undefined;
      const afterRecipeSID = altRecipesChanges[itemIdStr] as number;
      const itemName =
        data?.items.get(itemId)?.name || (locale === "ja" ? `アイテム${itemId}` : `Item ${itemId}`);
      return generateAlternativeRecipeDescription(
        itemId,
        itemName,
        beforeRecipeSID,
        afterRecipeSID,
        data,
        t,
        locale
      );
    }
  }

  // Check for mining speed research changes
  if (changes["settings.miningSpeedResearch"]) {
    const before = (previousChanges["settings.miningSpeedResearch"] as number) || 100;
    const after = (changes["settings.miningSpeedResearch"] as number) || 100;
    return generateMiningSpeedResearchDescription(before, after, t, locale);
  }

  // Check for proliferator multiplier changes
  if (changes["settings.proliferatorMultiplier"]) {
    const multChanges = changes["settings.proliferatorMultiplier"] as Record<string, unknown>;
    const production = (multChanges.production as number) || 1;
    const speed = (multChanges.speed as number) || 1;
    return generateProliferatorMultiplierDescription(production, speed, t, locale);
  }

  // If we can't regenerate, return original
  return entry.description;
}

/**
 * Regenerate node override description
 */
function regenerateNodeOverrideDescription(entry: HistoryEntry, locale: string): string {
  const t = (key: string) => i18n.t(key);

  const changes = entry.changes;
  const previousChanges = entry.previousChanges || {};

  // Try to find nodeId from affectedNodes
  const nodeId = entry.affectedNodes?.[0] || "";

  // Check for proliferator changes
  if (changes[`nodeOverrides.${nodeId}.proliferator`]) {
    const prolifChanges = changes[`nodeOverrides.${nodeId}.proliferator`] as Record<
      string,
      unknown
    >;
    const prolifPrev =
      (previousChanges[`nodeOverrides.${nodeId}.proliferator`] as Record<string, unknown>) || {};

    const before = {
      type: (prolifPrev.type as string) || "none",
      mode: (prolifPrev.mode as string) || "speed",
    };
    const after = {
      type: (prolifChanges.type as string) || before.type,
      mode: (prolifChanges.mode as string) || before.mode,
    };
    return generateProliferatorDescription(before, after, t, locale);
  }

  // Check for node reset
  if (
    changes[`nodeOverrides.${nodeId}`] === undefined &&
    previousChanges[`nodeOverrides.${nodeId}`]
  ) {
    return generateNodeOverrideResetDescription(nodeId, t, locale);
  }

  // Generic node override change
  if (nodeId) {
    return generateNodeOverrideDescription(nodeId, t, locale);
  }

  // Fallback
  return entry.description;
}

/**
 * Regenerate power generation description
 */
function regeneratePowerGenerationDescription(entry: HistoryEntry, locale: string): string {
  const t = (key: string) => i18n.t(key);
  const data = useGameDataStore.getState().data;

  const changes = entry.changes;
  const previousChanges = entry.previousChanges || {};

  // Check for template changes
  if (changes["powerGenerationTemplate"]) {
    const before = (previousChanges["powerGenerationTemplate"] as string) || "default";
    const after = (changes["powerGenerationTemplate"] as string) || "default";
    return generatePowerGenerationTemplateDescription(before, after, t, locale);
  }

  // Check for manual power generator changes
  if (changes["manualPowerGenerator"]) {
    const before = previousChanges["manualPowerGenerator"] as string | null;
    const after = changes["manualPowerGenerator"] as string | null;
    return generateManualPowerGeneratorDescription(before, after, t, locale, data);
  }

  // Check for manual fuel changes
  if (changes["manualPowerFuel"]) {
    const before = previousChanges["manualPowerFuel"] as string | null;
    const after = changes["manualPowerFuel"] as string | null;
    return generateManualPowerFuelDescription(before, after, t, locale, data);
  }

  // Check for fuel proliferator changes
  if (changes["powerFuelProliferator.type"] || changes["powerFuelProliferator.mode"]) {
    const before = {
      type: (previousChanges["powerFuelProliferator.type"] as string) || "none",
      mode: (previousChanges["powerFuelProliferator.mode"] as string) || "speed",
    };
    const after = {
      type: (changes["powerFuelProliferator.type"] as string) || before.type,
      mode: (changes["powerFuelProliferator.mode"] as string) || before.mode,
    };
    return generatePowerFuelProliferatorDescription(before, after, t, locale);
  }

  // Fallback
  return entry.description;
}

/**
 * Regenerate plan description
 */
function regeneratePlanDescription(entry: HistoryEntry, locale: string): string {
  const t = (key: string, params?: Record<string, unknown>) => i18n.t(key, params);
  const data = useGameDataStore.getState().data;

  const changes = entry.changes;
  const previousChanges = entry.previousChanges || {};

  // Check for recipe selection changes
  if (changes["selectedRecipe.recipeSID"]) {
    const beforeSID = previousChanges["selectedRecipe.recipeSID"] as number | undefined;
    const afterSID = changes["selectedRecipe.recipeSID"] as number | undefined;

    // Get recipe names from GameData
    const beforeRecipe = beforeSID !== undefined ? (data?.recipes.get(beforeSID) ?? null) : null;
    const afterRecipe = afterSID !== undefined ? (data?.recipes.get(afterSID) ?? null) : null;

    return generateRecipeSelectionDescription(beforeRecipe, afterRecipe, t, locale);
  }

  // Check for target quantity changes
  if (changes["targetQuantity"]) {
    const before = (previousChanges["targetQuantity"] as number) || 0;
    const after = (changes["targetQuantity"] as number) || 0;
    return generateTargetQuantityDescription(before, after, t, locale);
  }

  // Check for plan load (from file or browser)
  // This is for plan load operations where changes is empty or only has fileName
  if (entry.planSnapshot) {
    const plan = entry.planSnapshot;

    // Check for file load (has fileName in changes)
    if (changes.fileName) {
      return t("planLoadedFromFile", { fileName: changes.fileName as string });
    }

    // Check for browser/version load (has version in plan but no fileName)
    if (plan.version && plan.version > 0 && !changes.fileName) {
      return t("planLoadedFromBrowser", { planName: plan.name, version: plan.version });
    }
  }

  // Fallback
  return entry.description;
}
