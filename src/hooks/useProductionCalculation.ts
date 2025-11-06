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
  _nodeOverridesVersion: number, // Used by caller to trigger re-calculation
  miningSettings: {
    machineType: "Mining Machine" | "Advanced Mining Machine";
    workSpeedMultiplier: number;
  },
  setCalculationResult: (result: CalculationResult | null) => void
) {
  const settingsSignature = useMemo(() => createSettingsSignature(settings), [settings]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- settingsSignatureで依存管理
  const memoizedSettings = useMemo(() => settings, [settingsSignature]);
  const memoizedNodeOverrides = useMemo(() => nodeOverrides, [nodeOverrides]);
  const miningSettingsSignature = `${miningSettings.machineType}:${miningSettings.workSpeedMultiplier}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- miningSettingsSignatureで依存管理
  const memoizedMiningSettings = useMemo(() => miningSettings, [miningSettingsSignature]);

  useEffect(() => {
    if (selectedRecipe && data && targetQuantity > 0) {
      const result = tryCalculateProductionChain(
        selectedRecipe,
        targetQuantity,
        data,
        memoizedSettings,
        memoizedNodeOverrides,
        memoizedMiningSettings
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
  }, [
    selectedRecipe,
    targetQuantity,
    data,
    memoizedSettings,
    memoizedNodeOverrides,
    _nodeOverridesVersion,
    memoizedMiningSettings,
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
