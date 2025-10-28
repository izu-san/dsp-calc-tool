import Decimal from 'decimal.js';
import type {
  Recipe,
  Machine,
  GameData,
  GlobalSettings,
  RecipeTreeNode,
  PowerConsumption,
  ProliferatorConfig,
  NodeOverrideSettings,
} from '../../types';
import { calculateMiningRequirements } from '../miningCalculation';
import { isRawMaterial } from '../../constants/rawMaterials';
import { MACHINE_IDS_BY_RECIPE_TYPE, getMachineForRecipe as getMachineForRecipeFromConstants } from '../../constants/machines';
import { calculateProductionRate } from './production-rate';
import { calculateMachinePower, calculateSorterPower } from './power-calculation';
import { calculateConveyorBelts } from './belt-calculation';

/**
 * Find the appropriate machine for a recipe type
 */
const getMachineForRecipe = getMachineForRecipeFromConstants;

/**
 * Resolve proliferator mode for a specific recipe
 * Applies smart mode selection based on recipe capabilities
 * @internal - Exported for testing
 */
export function resolveProliferatorMode(
  recipe: Recipe,
  settings: GlobalSettings,
  override: NodeOverrideSettings | undefined
): ProliferatorConfig {
  const supportsProduction = recipe.productive === true;
  let proliferator = override?.proliferator || settings.proliferator;
  
  // Apply smart mode selection based on recipe capabilities
  if (settings.proliferator && settings.proliferator.type !== 'none') {
    // If global setting is production mode but this recipe doesn't support it, use speed mode
    if (settings.proliferator.mode === 'production' && !supportsProduction) {
      proliferator = {
        ...proliferator,
        mode: 'speed'
      };
    }
    // Note: Removed automatic switching to production mode to respect user's choice
    // Users can manually select production mode if they want it
  }
  
  return proliferator;
}

/**
 * Resolve machine by rank override
 * @internal - Exported for testing
 */
export function resolveMachineByRank(
  recipe: Recipe,
  machineRank: string,
  gameData: GameData
): Machine | undefined {
  const ids = MACHINE_IDS_BY_RECIPE_TYPE[recipe.Type] || [];
  let targetId = ids[0];

  switch (recipe.Type) {
    case 'Smelt':
      targetId = machineRank === 'arc' ? ids[0]
        : machineRank === 'plane' ? ids[1]
        : ids[2];
      break;
    case 'Assemble':
      targetId = machineRank === 'mk1' ? ids[0]
        : machineRank === 'mk2' ? ids[1]
        : machineRank === 'mk3' ? ids[2]
        : ids[3]; // recomposing
      break;
    case 'Chemical':
      targetId = machineRank === 'standard' ? ids[0] : ids[1];
      break;
    case 'Research':
      targetId = machineRank === 'standard' ? ids[0]
        : ids[1]; // matrixLab/self-evolution
      break;
    case 'Refine':
    case 'Particle':
      // Only one option; keep default
      break;
    default:
      break;
  }

  return gameData.machines.get(targetId);
}

/**
 * Resolve machine for a recipe, considering overrides
 * @internal - Exported for testing
 */
export function resolveMachine(
  recipe: Recipe,
  gameData: GameData,
  settings: GlobalSettings,
  override: NodeOverrideSettings | undefined
): Machine {
  if (override?.machineRank) {
    const foundMachine = resolveMachineByRank(recipe, override.machineRank, gameData);
    if (foundMachine) {
      return foundMachine;
    }
  }
  if (!recipe.Type) {
    throw new Error(`Recipe type is undefined for recipe: ${recipe.name || 'Unknown'}`);
  }
  return getMachineForRecipe(recipe.Type, gameData.machines, settings);
}

/**
 * Create a raw material node
 * @internal - Exported for testing
 */
export function createRawMaterialNode(
  itemId: number,
  itemName: string,
  requiredRate: number,
  settings: GlobalSettings,
  gameData: GameData,
  nodeId: string,
  isCircular: boolean,
  miningSettings: { machineType: 'Mining Machine' | 'Advanced Mining Machine'; workSpeedMultiplier: number },
  sourceRecipe?: Recipe
): RecipeTreeNode {
  const totalBeltSpeed = settings.conveyorBelt.speed * settings.conveyorBelt.stackCount;
  
  // Calculate mining equipment details for non-circular raw materials
  let miningEquipment;
  if (!isCircular) {
    try {
      const miningCalc = calculateMiningRequirements(
        { rawMaterials: new Map([[itemId, requiredRate]]) } as any,
        settings.miningSpeedResearch / 100, // Convert percentage to multiplier
        miningSettings.machineType,
        miningSettings.workSpeedMultiplier,
        gameData
      );
      
      const material = miningCalc.rawMaterials.find(m => m.itemId === itemId);
      if (material && material.machineType) {
        // Calculate power consumption
        let powerPerMachine: number;
        if (material.machineType === 'Water Pump') {
          powerPerMachine = 300; // 5000 workEnergyPerTick * 60 / 1000 = 300 kW
        } else if (material.machineType === 'Oil Extractor') {
          powerPerMachine = 840; // 14000 workEnergyPerTick * 60 / 1000 = 840 kW
        } else if (material.machineType === 'Advanced Mining Machine') {
          powerPerMachine = 630 * material.powerMultiplier;
        } else {
          powerPerMachine = 420 * material.powerMultiplier;
        }
        
        miningEquipment = {
          machineName: material.machineType === 'Water Pump' ? 'ウォーターポンプ' :
                      material.machineType === 'Oil Extractor' ? 'オイル抽出器' :
                      material.machineType === 'Advanced Mining Machine' ? '高度採掘機' : '採掘機',
          machineCount: material.minersNeeded,
          powerConsumption: material.minersNeeded * powerPerMachine,
          beltOutputs: Math.ceil(requiredRate / totalBeltSpeed),
        };
      }
    } catch (error) {
      // If mining calculation fails, just skip the mining equipment details
      console.warn(`Failed to calculate mining equipment for item ${itemId}:`, error);
      console.warn('Settings:', settings);
      console.warn('GameData:', gameData);
    }
  }
  
  return {
    isRawMaterial: true,
    itemId,
    itemName,
    miningFrom: isCircular ? 'externalSupplyCircular' : 'Unknown Source',
    targetOutputRate: requiredRate,
    machineCount: 0,
    proliferator: settings.proliferator,
    power: { machines: 0, sorters: 0, dysonSphere: 0, total: 0 },
    conveyorBelts: {
      inputs: 0,
      outputs: Math.ceil(requiredRate / totalBeltSpeed),
      total: Math.ceil(requiredRate / totalBeltSpeed),
    },
    inputs: [],
    children: [],
    nodeId,
    isCircularDependency: isCircular,
    sourceRecipe,
    miningEquipment,
  };
}

/**
 * Build child nodes for all inputs
 * @internal - Exported for testing
 */
export function buildChildNodes(
  inputs: { itemId: number; itemName: string; requiredRate: number }[],
  gameData: GameData,
  settings: GlobalSettings,
  nodeOverrides: Map<string, NodeOverrideSettings>,
  depth: number,
  maxDepth: number,
  nodeId: string,
  visitingItems: Set<number>,
  currentRecipe: Recipe,
  miningSettings: { machineType: 'Mining Machine' | 'Advanced Mining Machine'; workSpeedMultiplier: number }
): RecipeTreeNode[] {
  const children: RecipeTreeNode[] = [];
  
  for (const input of inputs) {
    const inputItem = gameData.allItems.get(input.itemId);
    if (!inputItem) continue;
    
    // Check for alternative recipe preference (-1 means mining)
    const preferredRecipeId = settings.alternativeRecipes.get(input.itemId);
    const forceMining = preferredRecipeId === -1;
    const forceRecipe = preferredRecipeId && preferredRecipeId > 0;
    
    // Check for circular dependency: if input item is currently being visited, treat as raw material
    const isCircular = visitingItems.has(input.itemId);
    
    // Check if this item can be produced by recipes
    const producerRecipes = gameData.recipesByItemId.get(input.itemId);
    const canBeProduced = producerRecipes && producerRecipes.length > 0;
    
    // Only treat as raw material if:
    // 1. It's a raw material AND (forced to mine OR no recipes available OR circular dependency)
    // 2. Explicitly forced to mine
    // 3. Circular dependency
    if ((isRawMaterial(input.itemId) && (forceMining || !canBeProduced || isCircular)) || forceMining || isCircular) {
      // Create a leaf node for raw material or circular dependency
      const rawNodeId = `${nodeId}/raw-${input.itemId}`;
      
      // For circular dependency, use the current recipe itself
      const rawNode = createRawMaterialNode(
        input.itemId,
        input.itemName,
        input.requiredRate,
        settings,
        gameData,
        rawNodeId,
        isCircular,
        miningSettings,
        isCircular ? currentRecipe : undefined
      );
      
      // If item has miningFrom, use it
      if (inputItem.miningFrom && !isCircular) {
        rawNode.miningFrom = inputItem.miningFrom;
      }
      
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
          `${nodeId}/r-${selectedRecipe.SID}`,
          visitingItems,
          miningSettings,
          input.itemId // Pass the target item ID
        );
        children.push(childNode);
      }
    }
  }
  
  return children;
}

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
  nodePath: string = `r-${recipe.SID}`,
  visitingItems: Set<number> = new Set(),
  miningSettings: { machineType: 'Mining Machine' | 'Advanced Mining Machine'; workSpeedMultiplier: number },
  targetItemId?: number // Which item this recipe is producing (for multi-output recipes)
): RecipeTreeNode {
  if (depth > maxDepth) {
    throw new Error('Maximum recursion depth reached');
  }
  
  // Track the output item to detect circular dependencies
  const outputItemId = recipe.Results?.[0]?.id;
  if (outputItemId && visitingItems.has(outputItemId)) {
    // Circular dependency detected - treat as raw material
    // This prevents infinite recursion for recipes like "Reforming Refine"
    // where refined oil is both input and output
  }

  // Stable path-based node ID
  const nodeId = nodePath;

  // Check for node-specific overrides
  const override = nodeOverrides.get(nodeId);
  
  // Resolve proliferator mode
  const proliferator = resolveProliferatorMode(recipe, settings, override);
  
  // Resolve machine
  const machine = resolveMachine(recipe, gameData, settings, override);
  

  // Calculate production rate per machine
  const ratePerMachine = calculateProductionRate(
    recipe,
    machine,
    proliferator,
    settings.proliferatorMultiplier,
    settings.photonGeneration
  );

  // Calculate required machines (ceiling to integer for realistic building count)
  const machineCount = Math.ceil(new Decimal(targetRate).div(ratePerMachine).toDecimalPlaces(2).toNumber());

  // Calculate power
  const machinePowerResult = calculateMachinePower(
    machine,
    machineCount,
    proliferator,
    settings.proliferatorMultiplier,
    recipe.Type,
    settings.photonGeneration
  );
  const sorterPower = calculateSorterPower(recipe, machineCount, settings.sorter.powerConsumption);
  const power: PowerConsumption = {
    machines: machinePowerResult.machines,
    sorters: sorterPower,
    dysonSphere: machinePowerResult.dysonSphere,
    total: machinePowerResult.machines + sorterPower + machinePowerResult.dysonSphere,
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

  // PhotonGeneration: 重力子レンズを使用する場合、インプットに追加
  if (recipe.Type === 'PhotonGeneration' && settings.photonGeneration.useGravitonLens) {
    const gravitonLensRate = (0.1 / 60) * machineCount; // 0.1個/分 -> 個/秒
    const gravitonLensItem = gameData.items.get(1209); // 重力子レンズ
    inputs.push({
      itemId: 1209,
      itemName: gravitonLensItem?.name || 'Graviton Lens',
      requiredRate: gravitonLensRate,
    });
  }

  // Calculate conveyor belts
  const totalBeltSpeed = settings.conveyorBelt.speed * settings.conveyorBelt.stackCount;
  const conveyorBelts = calculateConveyorBelts(
    targetRate,
    inputs,
    totalBeltSpeed
  );

  // Add current output item to visiting set to detect circular dependencies
  const newVisitingItems = new Set(visitingItems);
  if (outputItemId) {
    newVisitingItems.add(outputItemId);
  }
  
  // Build child nodes for all inputs
  const children = buildChildNodes(
    inputs,
    gameData,
    settings,
    nodeOverrides,
    depth,
    maxDepth,
    nodeId,
    newVisitingItems,
    recipe,
    miningSettings
  );

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
    targetItemId, // Which item this recipe is producing (for multi-output recipes)
  };
}

