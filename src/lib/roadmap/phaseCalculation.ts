import { CRITICAL_PHOTON_ITEM } from "../../constants/photonGeneration";
import i18n from "../../i18n";
import type { RecipeTreeNode } from "../../types/calculation";
import type { GameData } from "../../types/game-data";
import type { PhaseInfo, PhaseNode } from "../../types/roadmap";
import { getDataPath } from "../../utils/paths";
import type { MiningCalculation } from "../miningCalculation";

function isCriticalPhotonNode(node: RecipeTreeNode): boolean {
  if (node.itemId === CRITICAL_PHOTON_ITEM.id) {
    return true;
  }

  if (node.targetItemId === CRITICAL_PHOTON_ITEM.id) {
    return true;
  }

  if (node.recipe?.Results?.some(result => result.id === CRITICAL_PHOTON_ITEM.id)) {
    return true;
  }

  return false;
}

/**
 * Collect all raw material nodes from the tree
 * Only collect nodes that are actually mined (isRawMaterial === true)
 */
function collectRawMaterialNodes(rootNode: RecipeTreeNode): RecipeTreeNode[] {
  const rawMaterials: RecipeTreeNode[] = [];

  function traverse(node: RecipeTreeNode) {
    if (node.isRawMaterial === true || isCriticalPhotonNode(node)) {
      rawMaterials.push(node);
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(rootNode);
  return rawMaterials;
}

/**
 * Group raw material nodes by itemId and merge them
 */
function groupRawMaterialsByItemId(
  rawMaterialNodes: RecipeTreeNode[]
): Map<number, RecipeTreeNode> {
  const grouped = new Map<number, RecipeTreeNode>();

  rawMaterialNodes.forEach(node => {
    const itemId = node.itemId || node.recipe?.Results[0]?.id || 0;
    if (itemId === 0) return;

    const existing = grouped.get(itemId);

    if (existing) {
      grouped.set(itemId, {
        ...existing,
        targetOutputRate: existing.targetOutputRate + node.targetOutputRate,
        nodeId: existing.nodeId,
      });
    } else {
      grouped.set(itemId, node);
    }
  });

  return grouped;
}

/**
 * Calculate processing stage for each node
 * Stage 0: Raw materials (isRawMaterial === true) -> Phase 1
 * Stage 1: Directly made from raw materials -> Phase 2
 * Stage 2: Made from stage 1 products -> Phase 3
 * etc.
 */
function calculateProcessingStages(rootNode: RecipeTreeNode): Map<RecipeTreeNode, number> {
  const stageMap = new Map<RecipeTreeNode, number>();

  function calculateStage(node: RecipeTreeNode): number {
    // Already calculated
    if (stageMap.has(node)) {
      return stageMap.get(node)!;
    }

    // Raw material nodes (actually mined) and critical photon nodes are stage 0
    if (node.isRawMaterial === true || isCriticalPhotonNode(node)) {
      stageMap.set(node, 0);
      return 0;
    }

    // No recipe: unknown stage
    if (!node.recipe) {
      stageMap.set(node, 999);
      return 999;
    }

    // Calculate based on children (inputs)
    if (!node.children || node.children.length === 0) {
      // No inputs: this is stage 1 (directly from nothing/raw materials)
      stageMap.set(node, 1);
      return 1;
    }

    // Find maximum stage of all inputs
    let maxInputStage = -1;
    node.children.forEach(child => {
      const childStage = calculateStage(child);
      if (childStage !== 999 && childStage > maxInputStage) {
        maxInputStage = childStage;
      }
    });

    // If all inputs are raw materials (stage 0), this is stage 1
    // Otherwise, this is maxInputStage + 1
    const nodeStage = maxInputStage === -1 ? 1 : maxInputStage + 1;
    stageMap.set(node, nodeStage);
    return nodeStage;
  }

  // Calculate stages for all nodes (traverse from root)
  function traverse(node: RecipeTreeNode) {
    calculateStage(node);
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(rootNode);

  return stageMap;
}

/**
 * Group non-raw-material nodes by processing stage
 * Returns a map where key is processing stage (1 = first processing, larger = deeper)
 * Includes the root node (final product) in the appropriate stage
 */
function groupNodesByProcessingStage(rootNode: RecipeTreeNode): Map<number, RecipeTreeNode[]> {
  const stageMap = calculateProcessingStages(rootNode);
  const groupedByStage = new Map<number, RecipeTreeNode[]>();

  function traverse(node: RecipeTreeNode) {
    // Skip raw material nodes (they're in Phase 1)
    if (node.isRawMaterial === true || isCriticalPhotonNode(node)) {
      if (node.children) {
        node.children.forEach(traverse);
      }
      return;
    }

    const stage = stageMap.get(node);
    if (stage === undefined || stage === 0 || stage === 999) {
      // Skip raw materials (stage 0), unknown (stage 999), or nodes not in stageMap
      // But continue traversing children
      if (node.children) {
        node.children.forEach(traverse);
      }
      return;
    }

    // This node should be included in processing stages
    if (!groupedByStage.has(stage)) {
      groupedByStage.set(stage, []);
    }
    groupedByStage.get(stage)!.push(node);

    // Continue traversing children
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  // Start traversal from root node itself (include final product)
  traverse(rootNode);

  // Merge nodes with the same recipe within each stage
  const mergedByStage = new Map<number, RecipeTreeNode[]>();

  groupedByStage.forEach((nodes, stage) => {
    // Group by recipe SID (and targetItemId for multi-output recipes)
    const recipeGroups = new Map<string, RecipeTreeNode[]>();

    nodes.forEach(node => {
      if (!node.recipe) return;

      const key = node.targetItemId
        ? `${node.recipe.SID}-${node.targetItemId}`
        : String(node.recipe.SID);

      if (!recipeGroups.has(key)) {
        recipeGroups.set(key, []);
      }
      recipeGroups.get(key)!.push(node);
    });

    // Merge nodes with the same recipe
    const mergedNodes: RecipeTreeNode[] = [];

    recipeGroups.forEach(groupNodes => {
      if (groupNodes.length === 0) return;

      const baseNode = groupNodes[0];
      const totalMachineCount = groupNodes.reduce((sum, n) => sum + n.machineCount, 0);
      const totalTargetOutputRate = groupNodes.reduce((sum, n) => sum + n.targetOutputRate, 0);

      const mergedNode: RecipeTreeNode = {
        ...baseNode,
        machineCount: totalMachineCount,
        targetOutputRate: totalTargetOutputRate,
        nodeId: groupNodes.map(n => n.nodeId).join(","),
      };

      mergedNodes.push(mergedNode);
    });

    mergedByStage.set(stage, mergedNodes);
  });

  return mergedByStage;
}

/**
 * Sort nodes within a phase by machine type priority
 * Priority: Mining > Smelt > Assemble > Others
 */
export function sortNodesByMachineType(nodes: RecipeTreeNode[]): RecipeTreeNode[] {
  const typePriority = (node: RecipeTreeNode): number => {
    if (node.isRawMaterial) return 0;
    if (!node.recipe) return 999;

    switch (node.recipe.Type) {
      case "Smelt":
        return 1;
      case "Assemble":
        return 2;
      case "Chemical":
        return 3;
      case "Refine":
        return 4;
      case "Research":
        return 5;
      case "Particle":
        return 6;
      case "PhotonGeneration":
        return 7;
      default:
        return 999;
    }
  };

  return [...nodes].sort((a, b) => typePriority(a) - typePriority(b));
}

/**
 * Generate plan ID from recipe and settings
 */
export function generatePlanId(
  recipeSID: number,
  targetQuantity: number,
  settingsHash?: string
): string {
  const base = `${recipeSID}-${targetQuantity}`;
  return settingsHash ? `${base}-${settingsHash}` : base;
}

/**
 * Translate machine type name for mining machines
 */
function translateMachineType(machineType: string): string {
  const machineTypeMap: Record<string, string> = {
    "Mining Machine": i18n.t("roadmap.machineMiningMachine"),
    "Advanced Mining Machine": i18n.t("roadmap.machineAdvancedMiningMachine"),
    "Water Pump": i18n.t("roadmap.machineWaterPump"),
    "Oil Extractor": i18n.t("roadmap.machineOilExtractor"),
  };
  return machineTypeMap[machineType] || machineType;
}

/**
 * Create PhaseNode from RecipeTreeNode
 * For raw materials, use miningCalculation to get machine count
 */
function createPhaseNode(
  node: RecipeTreeNode,
  gameData: GameData | null,
  miningCalculation?: MiningCalculation
): PhaseNode {
  let resultItemId: number | undefined;
  let resultItemName: string | undefined;

  if (node.targetItemId && node.recipe) {
    const targetResult = node.recipe.Results.find(result => result.id === node.targetItemId);
    if (targetResult) {
      resultItemId = targetResult.id;
      resultItemName = targetResult.name;
    }
  }

  if (!resultItemId && node.recipe?.Results?.length) {
    resultItemId = node.recipe.Results[0].id;
    resultItemName = node.recipe.Results[0].name;
  }

  const itemId = resultItemId || node.itemId || 0;
  const itemName =
    resultItemName || node.itemName || gameData?.items.get(itemId)?.name || `Item ${itemId}`;

  const isMiningNode = node.isRawMaterial === true;

  let machineId = 0;
  let machineType = "";
  let machineCount = 0;

  if (isMiningNode && miningCalculation) {
    const miningReq = miningCalculation.rawMaterials.find(rm => rm.itemId === itemId);
    if (miningReq) {
      // For Hydrogen (1120) and Deuterium (1121), use orbital collectors if available
      const isHydrogenOrDeuterium = itemId === 1120 || itemId === 1121;
      const useOrbitalCollectors =
        isHydrogenOrDeuterium && miningReq.orbitCollectorsNeeded !== undefined;

      if (useOrbitalCollectors) {
        machineCount = miningReq.orbitCollectorsNeeded!;
        machineType = i18n.t("roadmap.machineOrbitalCollector");
        machineId = 2101; // Orbital Collector ID (tentative)
      } else {
        machineCount = miningReq.minersNeeded;
        machineType = translateMachineType(miningReq.machineType);

        if (gameData) {
          const machineMap: Record<string, number> = {
            "Mining Machine": 2301,
            "Advanced Mining Machine": 2316,
            "Water Pump": 2306,
            "Oil Extractor": 2307,
          };
          machineId = machineMap[miningReq.machineType] || 0;
        }
      }
    }
  } else {
    machineId = node.machine?.id || 0;
    machineType =
      node.machine?.name || gameData?.machines.get(machineId)?.name || `Machine ${machineId}`;
    machineCount = Math.ceil(node.machineCount);
  }

  const miningFrom =
    node.miningFrom || (isMiningNode ? gameData?.items.get(itemId)?.miningFrom : undefined);

  return {
    nodeId: node.nodeId,
    itemId,
    itemName,
    machineId,
    machineType,
    machineCount,
    isCompleted: false,
    isMiningNode,
    miningFrom,
    requiredRate: isMiningNode ? node.targetOutputRate : undefined,
    itemIconPath: getDataPath(`data/Items/Icons/${itemId}.png`),
    machineIconPath:
      machineId > 0 ? getDataPath(`data/Machines/Icons/${machineId}.png`) : undefined,
  };
}

/**
 * Generate phase title
 * Phase 1: Raw materials
 * Phase 2+: "PhaseX: N次加工（レシピ名、など）"
 * Last phase: "PhaseX: N次加工（レシピ名、など）【最終完成品】"
 */
function generatePhaseTitle(
  phaseNumber: number,
  nodes: RecipeTreeNode[],
  isLastPhase: boolean = false
): string {
  if (phaseNumber === 1) {
    return i18n.t("roadmap.phaseTitleRawMaterials");
  }

  // Calculate processing stage (N次加工)
  // Phase 2 = stage 1 = 1次加工, Phase 3 = stage 2 = 2次加工, etc.
  const processingStage = phaseNumber - 1;

  // Collect recipe names from nodes
  const recipeNames = new Set<string>();
  nodes.forEach(node => {
    if (node.recipe?.name) {
      recipeNames.add(node.recipe.name);
    }
  });

  // Build title: "PhaseX: N次加工（レシピ名、など）"
  const recipeNamesArray = Array.from(recipeNames).slice(0, 3); // Top 3 recipe names
  const separator = i18n.language === "ja" ? "、" : ", ";
  const recipeNamesText =
    recipeNamesArray.length > 0
      ? `（${recipeNamesArray.join(separator)}${recipeNamesArray.length < recipeNames.size ? "..." : ""}）`
      : "";

  const baseTitle = i18n.t("roadmap.phaseTitleWithStage", {
    number: phaseNumber,
    stage: processingStage,
    recipes: recipeNamesText,
  });

  // Add "最終完成品" label for last phase
  if (isLastPhase) {
    return `${baseTitle}${i18n.t("roadmap.finalProductLabel")}`;
  }

  return baseTitle;
}

/**
 * Calculate phases from recipe tree
 * Phase 1 contains all raw materials grouped by itemId
 * Phase 2+ contains non-raw-material nodes grouped by processing stage
 */
export function calculatePhases(
  rootNode: RecipeTreeNode,
  gameData: GameData | null,
  miningCalculation?: MiningCalculation
): PhaseInfo[] {
  const phases: PhaseInfo[] = [];

  // Phase 1: Collect all raw materials and group by itemId
  const rawMaterialNodes = collectRawMaterialNodes(rootNode);
  const groupedRawMaterials = groupRawMaterialsByItemId(rawMaterialNodes);

  // Always create Phase 1, even if empty (for consistent phase numbering)
  const rawMaterialPhaseNodes = Array.from(groupedRawMaterials.values()).map(node =>
    createPhaseNode(node, gameData, miningCalculation)
  );

  phases.push({
    phaseNumber: 1,
    title: i18n.t("roadmap.phaseTitleRawMaterials"),
    nodes: rawMaterialPhaseNodes,
    isCompleted: false,
    completedCount: 0,
    totalCount: rawMaterialPhaseNodes.length,
  });

  // Phase 2+: Group non-raw-material nodes by processing stage
  const stageMap = groupNodesByProcessingStage(rootNode);

  // Sort stages and create phases
  const sortedStages = Array.from(stageMap.keys()).sort((a, b) => a - b);

  sortedStages.forEach((stage, index) => {
    const nodes = stageMap.get(stage);
    if (!nodes || nodes.length === 0) return;

    // Phase number = stage + 1 (stage 1 -> Phase 2, stage 2 -> Phase 3, etc.)
    const phaseNumber = stage + 1;

    const sortedNodes = sortNodesByMachineType(nodes);
    const phaseNodes = sortedNodes.map(node => createPhaseNode(node, gameData, miningCalculation));

    // Check if this is the last phase
    const isLastPhase = index === sortedStages.length - 1;
    const title = generatePhaseTitle(phaseNumber, nodes, isLastPhase);
    const completedCount = phaseNodes.filter(n => n.isCompleted).length;
    const totalCount = phaseNodes.length;

    phases.push({
      phaseNumber,
      title,
      nodes: phaseNodes,
      isCompleted: completedCount === totalCount && totalCount > 0,
      completedCount,
      totalCount,
    });
  });

  // Sort by phase number (ascending)
  return phases.sort((a, b) => a.phaseNumber - b.phaseNumber);
}
