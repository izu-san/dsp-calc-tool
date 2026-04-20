import { useEffect } from "react";
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
  }, [
    selectedRecipe,
    targetQuantity,
    data,
    settings,
    nodeOverrides,
    nodeOverridesVersion,
    miningSettings,
    setCalculationResult,
  ]);
}
