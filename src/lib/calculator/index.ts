import type {
  Recipe,
  GameData,
  GlobalSettings,
  CalculationResult,
  NodeOverrideSettings,
} from '../../types';
import { buildRecipeTree } from './tree-builder';
import { calculateTotalPower, calculateTotalMachines, calculateRawMaterials } from './aggregations';

// Re-export all public functions
export { calculateProductionRate } from './production-rate';
export { calculateMachinePower, calculateSorterPower } from './power-calculation';
export { calculateConveyorBelts } from './belt-calculation';
export {
  buildRecipeTree,
  resolveProliferatorMode,
  resolveMachineByRank,
  resolveMachine,
  createRawMaterialNode,
  buildChildNodes,
} from './tree-builder';
export { calculateTotalPower, calculateTotalMachines, calculateRawMaterials } from './aggregations';

/**
 * Main calculation function
 */
export function calculateProductionChain(
  recipe: Recipe,
  targetRate: number,
  gameData: GameData,
  settings: GlobalSettings,
  nodeOverrides: Map<string, NodeOverrideSettings> = new Map()
): CalculationResult {
  const rootNode = buildRecipeTree(recipe, targetRate, gameData, settings, nodeOverrides, 0, 20, `r-${recipe.SID}`);
  const totalPower = calculateTotalPower(rootNode);
  const totalMachines = calculateTotalMachines(rootNode);
  const rawMaterials = calculateRawMaterials(rootNode);

  return {
    rootNode,
    totalPower,
    totalMachines,
    rawMaterials,
  };
}

