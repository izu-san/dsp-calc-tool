import { useEffect } from 'react';
import type { Recipe, GameData, GlobalSettings, NodeOverrideSettings, CalculationResult } from '../types';
import { calculateProductionChain } from '../lib/calculator';
import { handleError } from '../utils/errorHandler';

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
  miningSettings: { machineType: 'Mining Machine' | 'Advanced Mining Machine'; workSpeedMultiplier: number },
  setCalculationResult: (result: CalculationResult | null) => void
) {
  useEffect(() => {
    if (selectedRecipe && data && targetQuantity > 0) {
      try {
        const result = calculateProductionChain(selectedRecipe, targetQuantity, data, settings, nodeOverrides, miningSettings);
        setCalculationResult(result);
      } catch (error) {
        handleError(error, 'Calculation error');
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
    setCalculationResult
  ]);
}

