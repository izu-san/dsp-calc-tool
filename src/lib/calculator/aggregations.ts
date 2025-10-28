import type { RecipeTreeNode, PowerConsumption } from '../../types';
import { isRawMaterial } from '../../constants/rawMaterials';

/**
 * Calculate total power consumption recursively
 */
export function calculateTotalPower(node: RecipeTreeNode): PowerConsumption {
  let totalMachines = node.power.machines;
  let totalSorters = node.power.sorters;
  let totalDysonSphere = node.power.dysonSphere || 0;

  for (const child of node.children) {
    const childPower = calculateTotalPower(child);
    totalMachines += childPower.machines;
    totalSorters += childPower.sorters;
    totalDysonSphere += childPower.dysonSphere || 0;
  }

  return {
    machines: totalMachines,
    sorters: totalSorters,
    dysonSphere: totalDysonSphere,
    total: totalMachines + totalSorters + totalDysonSphere,
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
 * Only includes materials that are actually mined (not circular dependencies)
 */
export function calculateRawMaterials(node: RecipeTreeNode): Map<number, number> {
  const rawMaterials = new Map<number, number>();

  function traverse(n: RecipeTreeNode) {
    // If this node is a raw material node AND not a circular dependency, count it
    // Circular dependencies are items produced by recipes, not mined
    if (n.isRawMaterial && n.itemId !== undefined && !n.isCircularDependency) {
      const current = rawMaterials.get(n.itemId) || 0;
      rawMaterials.set(n.itemId, current + n.targetOutputRate);
    }

    // Note: The inputs section below was removed as it was causing duplicate
    // raw material entries. The tree-builder now properly creates raw material nodes,
    // so this backwards compatibility section is no longer needed.

    for (const child of n.children) {
      traverse(child);
    }
  }

  traverse(node);
  return rawMaterials;
}

