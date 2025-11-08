import type { GameData } from "../../types";
import {
  getProliferatorTypeLabel,
  getProliferatorModeLabel,
  getMachineRankLabel,
  getConveyorBeltLabel,
  getSorterLabel,
  getAlternativeRecipeName,
} from "./description";
import { POWER_GENERATORS, FUEL_ITEMS } from "../../constants/powerGeneration";

/**
 * Helper function to format history description with locale-aware syntax
 */
function formatDescription(item: string, from: string | null, to: string, locale: string): string {
  const isJa = locale === "ja";

  if (from === null) {
    // Initial setting
    return isJa ? `${item}を${to}に設定` : `${item} set to ${to}`;
  } else {
    // Change
    return isJa ? `${item}を${from}から${to}に変更` : `${item} changed from ${from} to ${to}`;
  }
}

/**
 * Generate description for proliferator change
 */
export function generateProliferatorDescription(
  before: { type: string; mode: string },
  after: { type: string; mode: string },
  t: (key: string) => string,
  locale: string
): string {
  const item = t("proliferator");
  const beforeLabel =
    before.type === "none"
      ? getProliferatorTypeLabel(before.type, t)
      : `${getProliferatorTypeLabel(before.type, t)}（${getProliferatorModeLabel(before.mode, t)}）`;
  const afterLabel =
    after.type === "none"
      ? getProliferatorTypeLabel(after.type, t)
      : `${getProliferatorTypeLabel(after.type, t)}（${getProliferatorModeLabel(after.mode, t)}）`;

  return formatDescription(item, beforeLabel, afterLabel, locale);
}

/**
 * Generate description for machine rank change
 */
export function generateMachineRankDescription(
  recipeType: string,
  beforeRank: string,
  afterRank: string,
  t: (key: string) => string,
  locale: string
): string {
  const recipeTypeLabels: Record<string, string> = {
    Smelt: t("smelter"),
    Assemble: t("assembler"),
    Chemical: t("chemicalPlant"),
    Research: t("matrixLab"),
    Refine: t("oilRefinery"),
    Particle: t("particleCollider"),
  };
  const recipeTypeLabel = recipeTypeLabels[recipeType] || recipeType;
  const beforeMachineName = getMachineRankLabel(recipeType, beforeRank);
  const afterMachineName = getMachineRankLabel(recipeType, afterRank);

  return formatDescription(recipeTypeLabel, beforeMachineName, afterMachineName, locale);
}

/**
 * Generate description for conveyor belt change
 */
export function generateConveyorBeltDescription(
  before: { tier: string; stackCount: number },
  after: { tier: string; stackCount: number },
  t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";

  if (before.tier !== after.tier) {
    const item = t("conveyorBelt");
    const beforeLabel = getConveyorBeltLabel(before.tier);
    const afterLabel = getConveyorBeltLabel(after.tier);
    return formatDescription(item, beforeLabel, afterLabel, locale);
  } else if (before.stackCount !== after.stackCount) {
    // Only stackCount changed
    const tierLabel = getConveyorBeltLabel(after.tier);
    if (isJa) {
      return `${t("conveyorBelt")}（${tierLabel}）の${t("stackCount")}を${before.stackCount}から${after.stackCount}に変更`;
    } else {
      return `${t("conveyorBelt")} (${tierLabel}) ${t("stackCount")} changed from ${before.stackCount} to ${after.stackCount}`;
    }
  } else {
    const item = t("conveyorBelt");
    const afterLabel = getConveyorBeltLabel(after.tier);
    return formatDescription(item, null, afterLabel, locale);
  }
}

/**
 * Generate description for sorter change
 */
export function generateSorterDescription(
  before: { tier: string },
  after: { tier: string },
  t: (key: string) => string,
  locale: string
): string {
  const item = t("sorter");
  const beforeLabel = getSorterLabel(before.tier, t);
  const afterLabel = getSorterLabel(after.tier, t);
  return formatDescription(item, beforeLabel, afterLabel, locale);
}

/**
 * Generate description for alternative recipe change
 */
export function generateAlternativeRecipeDescription(
  itemId: number,
  itemName: string,
  beforeRecipeSID: number | undefined,
  afterRecipeSID: number,
  data: GameData | null,
  t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  const beforeRecipeName =
    beforeRecipeSID !== undefined
      ? getAlternativeRecipeName(itemId, beforeRecipeSID, data, t)
      : null;
  const afterRecipeName = getAlternativeRecipeName(itemId, afterRecipeSID, data, t);

  if (isJa) {
    if (beforeRecipeName !== null) {
      return `${itemName}の${t("recipe")}を${beforeRecipeName}から${afterRecipeName}に変更`;
    } else {
      return `${itemName}の${t("recipe")}を${afterRecipeName}に設定`;
    }
  } else {
    if (beforeRecipeName !== null) {
      return `${itemName} ${t("recipe")} changed from ${beforeRecipeName} to ${afterRecipeName}`;
    } else {
      return `${itemName} ${t("recipe")} set to ${afterRecipeName}`;
    }
  }
}

/**
 * Generate description for recipe selection change
 */
export function generateRecipeSelectionDescription(
  before: { name: string } | null,
  after: { name: string } | null,
  t: (key: string) => string,
  locale: string
): string {
  const item = t("recipe");
  const isJa = locale === "ja";

  if (before && after) {
    return isJa
      ? `${item}を${before.name}から${after.name}に変更`
      : `${item} changed from ${before.name} to ${after.name}`;
  } else if (after) {
    return isJa ? `${item}を${after.name}に設定` : `${item} set to ${after.name}`;
  } else if (before) {
    return isJa ? `${item}を${before.name}から削除` : `${item} removed from ${before.name}`;
  } else {
    return isJa ? `${item}を変更` : `${item} changed`;
  }
}

/**
 * Generate description for target quantity change
 */
export function generateTargetQuantityDescription(
  before: number,
  after: number,
  t: (key: string) => string,
  locale: string
): string {
  const item = t("target");
  const unit = t("itemPerSecond");
  const isJa = locale === "ja";

  if (isJa) {
    return `${item}を${before} ${unit}から${after} ${unit}に変更`;
  } else {
    return `${item} changed from ${before} ${unit} to ${after} ${unit}`;
  }
}

/**
 * Generate description for mining speed research change
 */
export function generateMiningSpeedResearchDescription(
  before: number,
  after: number,
  t: (key: string) => string,
  locale: string
): string {
  const item = t("miningSpeedResearch");
  return formatDescription(item, `${before}%`, `${after}%`, locale);
}

/**
 * Generate description for proliferator multiplier change
 */
export function generateProliferatorMultiplierDescription(
  production: number,
  speed: number,
  t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  if (isJa) {
    return `${t("proliferatorMultiplier")}を変更（${t("production")}:${production}x、${t("speed")}:${speed}x）`;
  } else {
    return `${t("proliferatorMultiplier")} changed (${t("production")}:${production}x, ${t("speed")}:${speed}x)`;
  }
}

/**
 * Generate description for photon generation setting change
 */
export function generatePhotonGenerationDescription(
  key: string,
  t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  const keyLabel = t(`photonGeneration.${key}`) || key;
  if (isJa) {
    return `${t("photonGeneration")}設定の${keyLabel}を変更`;
  } else {
    return `${t("photonGeneration")} setting ${keyLabel} changed`;
  }
}

/**
 * Generate description for template application
 */
export function generateTemplateDescription(
  templateId: string,
  t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  const templateLabel = t(templateId) || templateId;
  if (isJa) {
    return `テンプレート「${templateLabel}」を適用`;
  } else {
    return `Apply template "${templateLabel}"`;
  }
}

/**
 * Generate description for batch settings update
 */
export function generateBatchSettingsDescription(
  _t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  if (isJa) {
    return "設定を一括更新";
  } else {
    return "Batch settings updated";
  }
}

/**
 * Generate description for power generation template change
 */
export function generatePowerGenerationTemplateDescription(
  before: string,
  after: string,
  t: (key: string) => string,
  locale: string
): string {
  const getTemplateKey = (template: string): string => {
    if (template === "default") return "powerGeneration.templateDefault";
    const capitalized = template.charAt(0).toUpperCase() + template.slice(1);
    return `powerGeneration.template${capitalized}`;
  };
  const beforeLabel = t(getTemplateKey(before)) || before;
  const afterLabel = t(getTemplateKey(after)) || after;
  const item = t("powerGeneration.templateLabel");
  return formatDescription(item, beforeLabel, afterLabel, locale);
}

/**
 * Generate description for manual power generator change
 */
export function generateManualPowerGeneratorDescription(
  before: string | null,
  after: string | null,
  t: (key: string) => string,
  locale: string,
  data: { machines: Map<number, { name: string }> } | null
): string {
  const getGeneratorName = (generator: string | null): string => {
    if (generator === null) return t("none");

    // First try to get from GameData by machineId
    const generatorFromType = POWER_GENERATORS[generator as keyof typeof POWER_GENERATORS];
    if (generatorFromType && data) {
      const machine = data.machines.get(generatorFromType.machineId);
      if (machine?.name) return machine.name;
    }

    // Fallback: use POWER_GENERATORS
    if (generatorFromType) {
      return generatorFromType.machineName;
    }

    return generator;
  };

  const beforeLabel = getGeneratorName(before);
  const afterLabel = getGeneratorName(after);
  const item = t("powerGeneration.manualGenerator");
  return formatDescription(item, beforeLabel, afterLabel, locale);
}

/**
 * Generate description for manual power fuel change
 */
export function generateManualPowerFuelDescription(
  before: string | null,
  after: string | null,
  t: (key: string) => string,
  locale: string,
  data: { items: Map<number, { name: string }> } | null
): string {
  const getFuelName = (fuel: string | null): string => {
    if (fuel === null) return t("none");

    // First try to get from FUEL_ITEMS by key
    const fuelFromKey = FUEL_ITEMS[fuel as keyof typeof FUEL_ITEMS];
    if (fuelFromKey && data) {
      // Try to get from GameData by itemId
      const item = data.items.get(fuelFromKey.itemId);
      if (item?.name) return item.name;
    }

    // Fallback: use FUEL_ITEMS
    if (fuelFromKey) {
      return fuelFromKey.itemName;
    }

    // Try to parse as number and get from GameData
    const fuelId = Number(fuel);
    if (!isNaN(fuelId) && data) {
      const item = data.items.get(fuelId);
      if (item?.name) return item.name;
    }

    return fuel;
  };

  const beforeLabel = getFuelName(before);
  const afterLabel = getFuelName(after);
  const item = t("powerGeneration.manualFuel");
  return formatDescription(item, beforeLabel, afterLabel, locale);
}

/**
 * Generate description for power fuel proliferator change
 */
export function generatePowerFuelProliferatorDescription(
  before: { type: string; mode: string },
  after: { type: string; mode: string },
  t: (key: string) => string,
  locale: string
): string {
  // Only show rank changes, not mode changes
  if (before.type === after.type && before.mode !== after.mode) {
    // Mode change only - return empty string to skip recording
    return "";
  }

  const beforeLabel = getProliferatorTypeLabel(before.type, t);
  const afterLabel = getProliferatorTypeLabel(after.type, t);
  const item = t("powerGeneration.fuelProliferator");
  return formatDescription(item, beforeLabel, afterLabel, locale);
}

/**
 * Generate description for mining machine type change
 */
export function generateMiningMachineTypeDescription(
  machineType: string,
  t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  const machineLabel = t(`miningMachine.${machineType}`) || machineType;
  if (isJa) {
    return `${t("miningMachine.type")}を${machineLabel}に変更`;
  } else {
    return `${t("miningMachine.type")} changed to ${machineLabel}`;
  }
}

/**
 * Generate description for mining work speed change
 */
export function generateMiningWorkSpeedDescription(
  speed: number,
  t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  if (isJa) {
    return `${t("miningMachine.workSpeed")}を${speed}%に変更`;
  } else {
    return `${t("miningMachine.workSpeed")} changed to ${speed}%`;
  }
}

/**
 * Generate description for mining settings batch update
 */
export function generateMiningSettingsBatchDescription(
  _t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  if (isJa) {
    return "採掘設定を変更";
  } else {
    return "Mining settings updated";
  }
}

/**
 * Generate description for node override change
 */
export function generateNodeOverrideDescription(
  nodeId: string,
  _t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  if (isJa) {
    return `ノード${nodeId}の設定を変更`;
  } else {
    return `Node ${nodeId} settings changed`;
  }
}

/**
 * Generate description for custom template creation
 */
export function generateCustomTemplateCreatedDescription(
  templateName: string,
  t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  if (isJa) {
    return `${t("customTemplate")}「${templateName}」${t("created")}`;
  } else {
    return `${t("customTemplate")} "${templateName}" ${t("created")}`;
  }
}

/**
 * Generate description for custom template update
 */
export function generateCustomTemplateUpdatedDescription(
  templateName: string,
  t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  if (isJa) {
    return `${t("customTemplate")}「${templateName}」${t("updated")}`;
  } else {
    return `${t("customTemplate")} "${templateName}" ${t("updated")}`;
  }
}

/**
 * Generate description for custom template deletion
 */
export function generateCustomTemplateDeletedDescription(
  templateName: string,
  t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  if (isJa) {
    return `${t("customTemplate")}「${templateName}」${t("deleted")}`;
  } else {
    return `${t("customTemplate")} "${templateName}" ${t("deleted")}`;
  }
}

/**
 * Generate description for custom template application
 */
export function generateCustomTemplateAppliedDescription(
  templateName: string,
  t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  if (isJa) {
    return `${t("customTemplate")}「${templateName}」${t("applied")}`;
  } else {
    return `${t("customTemplate")} "${templateName}" ${t("applied")}`;
  }
}

/**
 * Generate description for node override reset
 */
export function generateNodeOverrideResetDescription(
  nodeId: string,
  _t: (key: string) => string,
  locale: string
): string {
  const isJa = locale === "ja";
  if (isJa) {
    return `ノード${nodeId}の設定をリセット`;
  } else {
    return `Node ${nodeId} settings reset`;
  }
}
