import type { RecipeTreeNode, PowerConsumption } from '../../types';
import { isRawMaterial } from '../../constants/rawMaterials';

/**
 * Calculate total power consumption recursively
 */
export function calculateTotalPower(node: RecipeTreeNode): PowerConsumption {
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
export function calculateTotalMachines(node: RecipeTreeNode): number {
  let total = node.machineCount;

  for (const child of node.children) {
    total += calculateTotalMachines(child);
  }

  return total;
}

/**
 * Calculate raw materials required
 */
export function calculateRawMaterials(node: RecipeTreeNode): Map<number, number> {
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

