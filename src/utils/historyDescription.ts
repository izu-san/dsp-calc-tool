import type { GameData } from "../types";
import { getMachineById } from "../stores/gameDataStore";

/**
 * Get human-readable label for proliferator type
 */
export function getProliferatorTypeLabel(type: string, t: (key: string) => string): string {
  if (type === "none") return t("none");
  if (type === "mk1") return t("proliferatorMK1");
  if (type === "mk2") return t("proliferatorMK2");
  if (type === "mk3") return t("proliferatorMK3");
  return type;
}

/**
 * Get human-readable label for proliferator mode
 */
export function getProliferatorModeLabel(mode: string, t: (key: string) => string): string {
  if (mode === "speed") return t("speedMode");
  if (mode === "production") return t("productionMode");
  return mode;
}

/**
 * Get human-readable label for machine rank
 */
export function getMachineRankLabel(recipeType: string, rank: string): string {
  // Get machine name from iconId
  const machineMap: Record<string, { iconId: number }> = {
    arc: { iconId: 2302 },
    plane: { iconId: 2315 },
    negentropy: { iconId: 2319 },
    mk1: { iconId: 2303 },
    mk2: { iconId: 2304 },
    mk3: { iconId: 2305 },
    recomposing: { iconId: 2318 },
    standard:
      recipeType === "Research"
        ? { iconId: 2901 }
        : recipeType === "Chemical"
          ? { iconId: 2309 }
          : { iconId: 2309 },
    "self-evolution": { iconId: 2902 },
    quantum: { iconId: 2317 },
  };

  const machineInfo = machineMap[rank];
  if (machineInfo) {
    const machine = getMachineById(machineInfo.iconId);
    if (machine) {
      return machine.name;
    }
  }

  return rank;
}

/**
 * Get human-readable label for conveyor belt tier
 */
export function getConveyorBeltLabel(tier: string): string {
  if (tier === "mk1") return "Mk.I";
  if (tier === "mk2") return "Mk.II";
  if (tier === "mk3") return "Mk.III";
  return tier;
}

/**
 * Get human-readable label for sorter tier
 */
export function getSorterLabel(tier: string, t: (key: string) => string): string {
  if (tier === "mk1") return t("sorterMkI");
  if (tier === "mk2") return t("sorterMkII");
  if (tier === "mk3") return t("sorterMkIII");
  if (tier === "pile") return t("pilingSorter");
  return tier;
}

/**
 * Get human-readable label for alternative recipe
 */
export function getAlternativeRecipeLabel(
  itemId: number,
  recipeSID: number,
  data: GameData | null,
  t: (key: string) => string
): string {
  const itemName = data?.items.get(itemId)?.name || `アイテム${itemId}`;
  const recipeName = data?.recipes.get(recipeSID)?.name || t("unknownRecipe");
  return `${itemName}: ${recipeName}`;
}

/**
 * Get recipe name only for alternative recipe (for history description)
 */
export function getAlternativeRecipeName(
  _itemId: number,
  recipeSID: number,
  data: GameData | null,
  t: (key: string) => string
): string {
  // recipeSID === -1 means mining
  if (recipeSID === -1) {
    return t("mining");
  }
  const recipeName = data?.recipes.get(recipeSID)?.name;
  return recipeName || t("unknownRecipe");
}

/**
 * Generate history description with before/after values
 */
export function generateHistoryDescription(
  action: string,
  beforeValue: unknown,
  afterValue: unknown,
  t: (key: string) => string,
  data: GameData | null
): string {
  switch (action) {
    case "setProliferator": {
      const before = beforeValue as { type: string; mode: string };
      const after = afterValue as { type: string; mode: string };
      const beforeLabel = `${getProliferatorTypeLabel(before.type, t)}（${getProliferatorModeLabel(before.mode, t)}）`;
      const afterLabel = `${getProliferatorTypeLabel(after.type, t)}（${getProliferatorModeLabel(after.mode, t)}）`;
      return `${t("proliferator")}を${beforeLabel}から${afterLabel}に変更`;
    }
    case "setMachineRank": {
      const before = beforeValue as string;
      const after = afterValue as string;
      // recipeType is passed in the description, so we need to extract it
      // For now, use a generic format
      const beforeLabel = before;
      const afterLabel = after;
      return `設備ランクを${beforeLabel}から${afterLabel}に変更`;
    }
    case "setConveyorBelt": {
      const before = beforeValue as { tier: string };
      const after = afterValue as { tier: string };
      const beforeLabel = getConveyorBeltLabel(before.tier);
      const afterLabel = getConveyorBeltLabel(after.tier);
      return `${t("conveyorBelt")}を${beforeLabel}から${afterLabel}に変更`;
    }
    case "setSorter": {
      const before = beforeValue as { tier: string };
      const after = afterValue as { tier: string };
      const beforeLabel = getSorterLabel(before.tier, t);
      const afterLabel = getSorterLabel(after.tier, t);
      return `${t("sorter")}を${beforeLabel}から${afterLabel}に変更`;
    }
    case "setAlternativeRecipe": {
      // beforeValue and afterValue are itemId/recipeSID pairs
      const before = beforeValue as { itemId: number; recipeSID: number } | undefined;
      const after = afterValue as { itemId: number; recipeSID: number };
      if (before) {
        const beforeLabel = getAlternativeRecipeLabel(before.itemId, before.recipeSID, data, t);
        const afterLabel = getAlternativeRecipeLabel(after.itemId, after.recipeSID, data, t);
        return `${t("alternativeRecipe")}を${beforeLabel}から${afterLabel}に変更`;
      } else {
        const afterLabel = getAlternativeRecipeLabel(after.itemId, after.recipeSID, data, t);
        return `${t("alternativeRecipe")}を${afterLabel}に設定`;
      }
    }
    case "setMiningSpeedResearch": {
      const before = beforeValue as number;
      const after = afterValue as number;
      return `${t("miningSpeedResearch")}を${before}%から${after}%に変更`;
    }
    case "setTargetQuantity": {
      const before = beforeValue as number;
      const after = afterValue as number;
      return `${t("target")}を${before} ${t("itemPerSecond")}から${after} ${t("itemPerSecond")}に変更`;
    }
    case "setSelectedRecipe": {
      const before = beforeValue as { name: string } | null;
      const after = afterValue as { name: string } | null;
      if (before && after) {
        return `${t("recipe")}を${before.name}から${after.name}に変更`;
      } else if (after) {
        return `${t("recipe")}を${after.name}に変更`;
      } else if (before) {
        return `${t("recipe")}を${before.name}から削除`;
      }
      return `${t("recipe")}を変更`;
    }
    default:
      return `${action}を変更`;
  }
}
