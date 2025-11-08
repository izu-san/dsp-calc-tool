import { useEffect, useMemo } from "react";
import { tryCalculateProductionChain } from "../lib/calculator";
import type {
  CalculationResult,
  GameData,
  GlobalSettings,
  NodeOverrideSettings,
  Recipe,
} from "../types";
import { handleError } from "../utils/errorHandler";

/**
 * 生産チェーンの計算を管理するカスタムフック
 */
export function useProductionCalculation(
  selectedRecipe: Recipe | null,
  targetQuantity: number,
  data: GameData | null,
  settings: GlobalSettings,
  nodeOverrides: Map<string, NodeOverrideSettings>,
  nodeOverridesVersion: number, // Used to trigger re-calculation when overrides change
  miningSettings: {
    machineType: "Mining Machine" | "Advanced Mining Machine";
    workSpeedMultiplier: number;
  },
  setCalculationResult: (result: CalculationResult | null) => void
) {
  // Create stable signature for settings to avoid unnecessary recalculations
  // Only recalculate when settings actually change (by value, not reference)
  const settingsSignature = useMemo(() => createSettingsSignature(settings), [settings]);

  useEffect(() => {
    if (selectedRecipe && data && targetQuantity > 0) {
      const result = tryCalculateProductionChain(
        selectedRecipe,
        targetQuantity,
        data,
        settings,
        nodeOverrides,
        miningSettings
      );

      if (result.ok) {
        setCalculationResult(result.value);
      } else {
        handleError(result.error, "Calculation error");
        setCalculationResult(null);
      }
    } else {
      setCalculationResult(null);
    }

    // settingsSignature and nodeOverridesVersion are used to detect changes
    // without including the objects themselves in the dependency array.
    // miningSettings.machineType and workSpeedMultiplier are included individually
    // to avoid unnecessary re-renders when other miningSettings properties change.
  }, [
    selectedRecipe,
    targetQuantity,
    data,
    settingsSignature,
    nodeOverridesVersion,
    miningSettings.machineType,
    miningSettings.workSpeedMultiplier,
    setCalculationResult,
  ]);
}

function createSettingsSignature(settings: GlobalSettings): string {
  const alternativeEntries = settings.alternativeRecipes
    ? Array.from(settings.alternativeRecipes.entries()).sort(([a], [b]) => a - b)
    : [];

  return JSON.stringify({
    proliferator: settings.proliferator,
    machineRank: settings.machineRank,
    conveyorBelt: settings.conveyorBelt,
    sorter: settings.sorter,
    alternativeRecipes: alternativeEntries,
    miningSpeedResearch: settings.miningSpeedResearch,
    proliferatorMultiplier: settings.proliferatorMultiplier,
    photonGeneration: settings.photonGeneration,
  });
}
