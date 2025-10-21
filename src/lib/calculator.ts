import Decimal from 'decimal.js';
import type {
  Recipe,
  Machine,
  GameData,
  GlobalSettings,
  RecipeTreeNode,
  CalculationResult,
  PowerConsumption,
  ConveyorBeltRequirement,
  ProliferatorConfig,
  NodeOverrideSettings,
} from '../types';
import { isRawMaterial } from '../constants/rawMaterials';
import { MACHINE_IDS_BY_RECIPE_TYPE, getMachineForRecipe as getMachineForRecipeFromConstants } from '../constants/machines';
import { getEffectiveBonuses } from './proliferator';



/**
 * Calculate production rate for a recipe with given settings
 * 
 * Production mode: Increases output per craft (more items per recipe execution)
 * Speed mode: Reduces time per craft (faster recipe execution)
 * @internal - Exported for testing
 */
export function calculateProductionRate(
  recipe: Recipe,
  machine: Machine,
  proliferator: ProliferatorConfig,
  proliferatorMultiplier: { production: number; speed: number }
): number {
  const baseTime = recipe.TimeSpend / 60; // Convert ticks to seconds
  
  // Some machines (like Matrix Lab) have assemblerSpeed = 0, treat as 100%
  let machineSpeedMultiplier = machine.assemblerSpeed / 10000; // 10000 = 100%
  if (machineSpeedMultiplier === 0) {
    machineSpeedMultiplier = 1.0; // Default to 100% for special machines
  }
  
  // Speed mode: reduces time per craft (apply effective speed bonus)
  const { effectiveProductionBonus, effectiveSpeedBonus } = getEffectiveBonuses(proliferator, proliferatorMultiplier);
  const speedBonus = proliferator.mode === 'speed' ? 1 + effectiveSpeedBonus : 1;
  
  // Time per craft in seconds
  const timePerCraft = baseTime / machineSpeedMultiplier / speedBonus;
  
  // Production mode: increases output per craft
  const baseOutput = recipe.Results[0]?.count || 1;
  const productionBonus = proliferator.mode === 'production' ? 1 + effectiveProductionBonus : 1;
  const outputPerCraft = baseOutput * productionBonus;
  
  return outputPerCraft / timePerCraft;
}

/**
 * Calculate power consumption for machines
 * @internal - Exported for testing
 */
export function calculateMachinePower(
  machine: Machine,
  machineCount: number,
  proliferator: ProliferatorConfig,
  proliferatorMultiplier: { production: number; speed: number }
): number {
  const basePower = (machine.workEnergyPerTick * 60) / 1000; // Convert to kW
  const { effectivePowerIncrease } = getEffectiveBonuses(proliferator, proliferatorMultiplier);
  
  const powerMultiplier = 1 + effectivePowerIncrease;
  return basePower * powerMultiplier * machineCount;
}

/**
 * Calculate sorter power consumption
 * Formula: ソーター1台あたりの消費電力 * (Inputsアイテム種別数 + Outputsアイテム種別数) * マシン台数
 * @internal - Exported for testing
 */
export function calculateSorterPower(
  recipe: Recipe,
  machineCount: number,
  sorterPowerPerUnit: number
): number {
  // ソーター数 = Inputsアイテム種別数 + Outputsアイテム種別数
  const inputItemTypes = recipe.Items.length;
  const outputItemTypes = recipe.Results.length;
  const sortersPerMachine = inputItemTypes + outputItemTypes;
  
  // 消費電力 = ソーター1台あたりの消費電力 * (Inputsアイテム種別数 + Outputsアイテム種別数)
  return sorterPowerPerUnit * sortersPerMachine * machineCount;
}

/**
 * Calculate required conveyor belts
 * Formula: Number of belts = ceil(items per second / belt speed)
 * @internal - Exported for testing
 */
export function calculateConveyorBelts(
  targetOutputRate: number,
  inputs: { itemId: number; itemName: string; requiredRate: number }[],
  beltSpeed: number
): ConveyorBeltRequirement {
  // Check for invalid belt speed
  if (!beltSpeed || beltSpeed <= 0) {
    return {
      inputs: 0,
      outputs: 0,
      total: 0,
      saturation: 0,
      bottleneckType: undefined,
    };
  }
  
  // Calculate output belts (for the main product)
  const outputBelts = Math.ceil(targetOutputRate / beltSpeed);
  
  // Calculate input belts (sum of all input items)
  const inputBelts = inputs.reduce((total, input) => {
    return total + Math.ceil(input.requiredRate / beltSpeed);
  }, 0);
  
  // Calculate saturation (how close we are to belt capacity)
  const outputSaturation = (targetOutputRate / (outputBelts * beltSpeed)) * 100;
  const inputSaturation = inputs.reduce((max, input) => {
    const beltsNeeded = Math.ceil(input.requiredRate / beltSpeed);
    const saturation = (input.requiredRate / (beltsNeeded * beltSpeed)) * 100;
    return Math.max(max, saturation);
  }, 0);
  
  const maxSaturation = Math.max(outputSaturation, inputSaturation);
  const bottleneckType = outputSaturation > inputSaturation ? 'output' : 'input';
  
  return {
    inputs: inputBelts,
    outputs: outputBelts,
    total: inputBelts + outputBelts,
    saturation: maxSaturation,
    bottleneckType: maxSaturation > 80 ? bottleneckType : undefined,
  };
}

/**
 * Find the appropriate machine for a recipe type
 */
const getMachineForRecipe = getMachineForRecipeFromConstants;

/**
 * Build recipe tree recursively
 * @internal - Exported for testing purposes only
 */
export function buildRecipeTree(
  recipe: Recipe,
  targetRate: number,
  gameData: GameData,
  settings: GlobalSettings,
  nodeOverrides: Map<string, NodeOverrideSettings>,
  depth: number = 0,
  maxDepth: number = 20,
  nodePath: string = `r-${recipe.SID}`
): RecipeTreeNode {
  if (depth > maxDepth) {
    throw new Error('Maximum recursion depth reached');
  }

  // Stable path-based node ID
  const nodeId = nodePath;

  // Check for node-specific overrides
  const override = nodeOverrides.get(nodeId);
  
  // Determine optimal proliferator mode for this specific recipe
  const supportsProduction = recipe.productive === true;
  let proliferator = override?.proliferator || settings.proliferator;
  
  // Apply smart mode selection based on recipe capabilities
  if (settings.proliferator && settings.proliferator.type !== 'none') {
    // If global setting is production mode but this recipe doesn't support it, use speed mode
    if (settings.proliferator && settings.proliferator.mode === 'production' && !supportsProduction) {
      proliferator = {
        ...proliferator,
        mode: 'speed'
      };
    }
    // If global setting is speed mode but this recipe supports production, use production mode
    else if (settings.proliferator && settings.proliferator.mode === 'speed' && supportsProduction) {
      proliferator = {
        ...proliferator,
        mode: 'production'
      };
    }
  }
  
  // Apply machine rank override or use global settings
  let machine: Machine;
  if (override?.machineRank) {
    // Resolve by language-independent IDs instead of localized names
    const ids = MACHINE_IDS_BY_RECIPE_TYPE[recipe.Type] || [];
    let targetId = ids[0];

    switch (recipe.Type) {
      case 'Smelt':
        targetId = override.machineRank === 'arc' ? ids[0]
          : override.machineRank === 'plane' ? ids[1]
          : ids[2];
        break;
      case 'Assemble':
        targetId = override.machineRank === 'mk1' ? ids[0]
          : override.machineRank === 'mk2' ? ids[1]
          : override.machineRank === 'mk3' ? ids[2]
          : ids[3]; // recomposing
        break;
      case 'Chemical':
        targetId = override.machineRank === 'standard' ? ids[0] : ids[1];
        break;
      case 'Research':
        targetId = override.machineRank === 'standard' ? ids[0]
          : ids[1]; // matrixLab/self-evolution
        break;
      case 'Refine':
      case 'Particle':
        // Only one option; keep default
        break;
      default:
        break;
    }

    const foundMachine = gameData.machines.get(targetId);
    machine = foundMachine || getMachineForRecipe(recipe.Type, gameData.machines, settings);
  } else {
    machine = getMachineForRecipe(recipe.Type, gameData.machines, settings);
  }

  // Calculate production rate per machine
  const ratePerMachine = calculateProductionRate(recipe, machine, proliferator, settings.proliferatorMultiplier);

  // Calculate required machines
  const machineCount = new Decimal(targetRate).div(ratePerMachine).toDecimalPlaces(2).toNumber();

  // Calculate power
  const machinePower = calculateMachinePower(machine, machineCount, proliferator, settings.proliferatorMultiplier);
  const sorterPower = calculateSorterPower(recipe, machineCount, settings.sorter.powerConsumption);
  const power: PowerConsumption = {
    machines: machinePower,
    sorters: sorterPower,
    total: machinePower + sorterPower,
  };

  // Build input requirements
  // Production mode reduces input consumption (more output from same input)
  // Speed mode doesn't affect input ratios, just reduces machine count
  // Apply multiplier to production bonus (with fallback for old saved data)
  const prodMult = settings.proliferatorMultiplier?.production ?? 1;
  const effectiveProductionBonus = proliferator.productionBonus * prodMult;
  const inputMultiplier = proliferator.mode === 'production' 
    ? 1 / (1 + effectiveProductionBonus)  // e.g., +25% production means 80% input (1/1.25)
    : 1;
  
  const inputs = recipe.Items.map(item => ({
    itemId: item.id,
    itemName: item.name,
    requiredRate: new Decimal(item.count)
      .mul(targetRate)
      .div(recipe.Results[0]?.count || 1)
      .mul(inputMultiplier)  // Apply production bonus to reduce input
      .toNumber(),
  }));

  // Calculate conveyor belts
  const totalBeltSpeed = settings.conveyorBelt.speed * settings.conveyorBelt.stackCount;
  const conveyorBelts = calculateConveyorBelts(
    targetRate,
    inputs,
    totalBeltSpeed
  );

  // Recursively build child nodes for all inputs
  const children: RecipeTreeNode[] = [];
  for (const input of inputs) {
    const inputItem = gameData.allItems.get(input.itemId);
    if (!inputItem) continue;
    
    // Check for alternative recipe preference (-1 means mining)
    const preferredRecipeId = settings.alternativeRecipes.get(input.itemId);
    const forceMining = preferredRecipeId === -1;
    const forceRecipe = preferredRecipeId && preferredRecipeId > 0;
    
    if ((isRawMaterial(input.itemId) && !forceRecipe) || forceMining) {
      // Create a leaf node for raw material
      const rawNodeId = `${nodeId}/raw-${input.itemId}`;
      const totalBeltSpeed = settings.conveyorBelt.speed * settings.conveyorBelt.stackCount;
      const rawNode: RecipeTreeNode = {
        isRawMaterial: true,
        itemId: input.itemId,
        itemName: input.itemName,
        miningFrom: inputItem.miningFrom || 'Unknown Source',
        targetOutputRate: input.requiredRate,
        machineCount: 0, // No machines for raw materials
        proliferator: settings.proliferator,
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: {
          inputs: 0,
          outputs: Math.ceil(input.requiredRate / totalBeltSpeed),
          total: Math.ceil(input.requiredRate / totalBeltSpeed),
        },
        inputs: [],
        children: [],
        nodeId: rawNodeId,
      };
      children.push(rawNode);
    } else {
      // Find recipe to produce this item
      const producerRecipes = gameData.recipesByItemId.get(input.itemId);
      if (producerRecipes && producerRecipes.length > 0) {
        // Use preferred recipe if specified, otherwise use first recipe
        const selectedRecipe = forceRecipe
          ? producerRecipes.find(r => r.SID === preferredRecipeId) || producerRecipes[0]
          : producerRecipes[0];

        const childNode = buildRecipeTree(
          selectedRecipe,
          input.requiredRate,
          gameData,
          settings,
          nodeOverrides,
          depth + 1,
          maxDepth,
          `${nodeId}/r-${selectedRecipe.SID}`
        );
        children.push(childNode);
      }
    }
  }

  return {
    recipe,
    targetOutputRate: targetRate,
    machineCount,
    proliferator,
    machine,
    power,
    inputs,
    children,
    conveyorBelts,
    nodeId,
  };
}

/**
 * Calculate total power consumption recursively
 */
/**
 * Calculate total power consumption
 */
function calculateTotalPower(node: RecipeTreeNode): PowerConsumption {
  let totalMachines = node.power.machines;
  let totalSorters = node.power.sorters;

  for (const child of node.children) {
    const childPower = calculateTotalPower(child);
    totalMachines += childPower.machines;
    totalSorters += childPower.sorters;
  }

  return {
    machines: totalMachines,
    sorters: totalSorters,
    total: totalMachines + totalSorters,
  };
}

/**
 * Calculate total machine count
 */
function calculateTotalMachines(node: RecipeTreeNode): number {
  let total = node.machineCount;

  for (const child of node.children) {
    total += calculateTotalMachines(child);
  }

  return total;
}

/**
 * Calculate raw materials required
 */
function calculateRawMaterials(node: RecipeTreeNode): Map<number, number> {
  const rawMaterials = new Map<number, number>();

  function traverse(n: RecipeTreeNode) {
    // If this node is a raw material node, count it
    if (n.isRawMaterial && n.itemId !== undefined) {
      const current = rawMaterials.get(n.itemId) || 0;
      rawMaterials.set(n.itemId, current + n.targetOutputRate);
    }

    // Also check inputs (for backwards compatibility)
    for (const input of n.inputs) {
      if (isRawMaterial(input.itemId)) {
        const current = rawMaterials.get(input.itemId) || 0;
        rawMaterials.set(input.itemId, current + input.requiredRate);
      }
    }

    for (const child of n.children) {
      traverse(child);
    }
  }

  traverse(node);
  return rawMaterials;
}

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
