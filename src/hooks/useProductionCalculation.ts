import { useEffect } from 'react';
import type { Recipe, GameData, GlobalSettings, NodeOverrideSettings, CalculationResult } from '../types';
import { calculateProductionChain } from '../lib/calculator';

/**
 * 生産チェーンの計算を管理するカスタムフック
 */
export function useProductionCalculation(
  selectedRecipe: Recipe | null,
  targetQuantity: number,
  data: GameData | null,
  settings: GlobalSettings,
  nodeOverrides: Map<string, NodeOverrideSettings>,
  nodeOverridesVersion: number,
  setCalculationResult: (result: CalculationResult | null) => void
) {
  useEffect(() => {
    if (selectedRecipe && data && targetQuantity > 0) {
      try {
        const result = calculateProductionChain(selectedRecipe, targetQuantity, data, settings, nodeOverrides);
        setCalculationResult(result);
      } catch (err) {
        console.error('Calculation error:', err);
        setCalculationResult(null);
      }
    } else {
      setCalculationResult(null);
    }
  }, [selectedRecipe, targetQuantity, data, settings, nodeOverrides, nodeOverridesVersion, setCalculationResult]);
}

