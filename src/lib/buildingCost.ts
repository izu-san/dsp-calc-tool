import type { RecipeTreeNode } from "../types/calculation";

export interface BuildingRequirement {
  machineId: number;
  machineName?: string; // Optional, will be resolved at display time
  count: number;
}

export interface BuildingCost {
  machines: BuildingRequirement[];
  sorters: number; // Total sorters needed
  belts: number; // Total conveyor belts needed
}

/**
 * Calculate building costs for a production chain
 */
export function calculateBuildingCost(rootNode: RecipeTreeNode): BuildingCost {
  const machineMap = new Map<number, BuildingRequirement>();
  let totalSorters = 0;
  let totalBelts = 0;

  function traverse(node: RecipeTreeNode) {
    // Add machines (exclude logistics machines like sorters)
    if (node.machine && node.machineCount > 0 && node.machine.Type !== "Logistics") {
      const existing = machineMap.get(node.machine.id);
      if (existing) {
        existing.count += Math.ceil(node.machineCount);
      } else {
        machineMap.set(node.machine.id, {
          machineId: node.machine.id,
          count: Math.ceil(node.machineCount),
        });
      }
    }

    // Add sorters (Input + Output items per machine)
    if (node.recipe) {
      const inputItems = node.recipe.Items?.length || 0;
      const outputItems = node.recipe.Results?.length || 0;
      const sortersPerMachine = inputItems + outputItems;
      totalSorters += Math.ceil(node.machineCount) * sortersPerMachine;
    }

    // Add belts
    if (node.conveyorBelts) {
      totalBelts += node.conveyorBelts.total;
    }

    // Traverse children
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(rootNode);

  const result = {
    machines: Array.from(machineMap.values()).sort((a, b) => a.machineId - b.machineId),
    sorters: totalSorters,
    belts: totalBelts,
  };

  return result;
}
