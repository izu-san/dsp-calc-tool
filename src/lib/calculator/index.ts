import type {
  Recipe,
  GameData,
  GlobalSettings,
  CalculationResult,
  NodeOverrideSettings,
  MultiOutputResult,
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
  // For root node, set targetItemId to the first result (primary output)
  if (!recipe.Results || recipe.Results.length === 0) {
    throw new Error(`Recipe ${recipe.name} has no results`);
  }
  const targetItemId = recipe.Results[0].id;
  
  const rootNode = buildRecipeTree(
    recipe,
    targetRate,
    gameData,
    settings,
    nodeOverrides,
    0,
    20,
    `r-${recipe.SID}`,
    new Set(),
    targetItemId
  );
  const totalPower = calculateTotalPower(rootNode);
  const totalMachines = calculateTotalMachines(rootNode);
  const rawMaterials = calculateRawMaterials(rootNode);

  // Calculate multi-output results if recipe has multiple outputs
  const multiOutputResults = recipe.Results.length > 1 
    ? calculateMultiOutputResults(recipe, targetRate)
    : undefined;

  return {
    rootNode,
    totalPower,
    totalMachines,
    rawMaterials,
    multiOutputResults,
  };
}

/**
 * Calculate production rates for all output items in multi-output recipes
 */
function calculateMultiOutputResults(
  recipe: Recipe,
  targetRate: number
): MultiOutputResult[] {
  const mainOutput = recipe.Results[0];
  const mainOutputRate = targetRate; // Target rate is for the main output
  
  return recipe.Results.map(result => {
    const ratio = result.count / mainOutput.count;
    const productionRate = mainOutputRate * ratio;
    
    return {
      itemId: result.id,
      itemName: result.name,
      productionRate,
      count: result.count,
    };
  });
}

