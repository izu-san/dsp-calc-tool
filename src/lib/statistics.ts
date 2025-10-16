import type { RecipeTreeNode } from '../types';

/**
 * Item statistics for production chain
 */
export interface ItemStatistics {
  itemId: number;
  itemName?: string; // Optional, will be resolved at display time
  totalProduction: number; // Total production rate (items/s)
  totalConsumption: number; // Total consumption rate (items/s)
  netProduction: number; // Net production (production - consumption)
  isRawMaterial: boolean;
}

/**
 * Overall production statistics
 */
export interface ProductionStatistics {
  items: Map<number, ItemStatistics>;
  totalMachines: number;
  totalPower: number;
}

/**
 * Calculate item statistics from recipe tree
 */
export function calculateItemStatistics(rootNode: RecipeTreeNode): ProductionStatistics {
  const itemStats = new Map<number, ItemStatistics>();
  let totalMachines = 0;
  let totalPower = 0;

  // Recursive function to traverse the tree
  function traverse(node: RecipeTreeNode) {
    // Add machine count and power
    totalMachines += node.machineCount;
    totalPower += node.power.total;

    // Process outputs (production)
    if (node.recipe?.Results) {
      node.recipe.Results.forEach((result) => {
        const itemId = result.id;
        if (!itemStats.has(itemId)) {
          itemStats.set(itemId, {
            itemId,
            totalProduction: 0,
            totalConsumption: 0,
            netProduction: 0,
            isRawMaterial: false,
          });
        }
        const stats = itemStats.get(itemId)!;
        
        // Calculate production rate for this specific result item
        // targetOutputRate is for the main output (Results[0])
        // For other outputs, we need to calculate proportionally
        if (node.recipe) {
          const mainOutput = node.recipe.Results[0];
          const thisOutput = node.recipe.Results.find(r => r.id === itemId);
          
          if (mainOutput && thisOutput) {
            // If this is the main output, use targetOutputRate directly
            if (thisOutput.id === mainOutput.id) {
              stats.totalProduction += node.targetOutputRate;
            } else {
              // For secondary outputs, calculate proportionally
              // Production rate = targetOutputRate * (thisOutput.count / mainOutput.count)
              const ratio = thisOutput.count / mainOutput.count;
              stats.totalProduction += node.targetOutputRate * ratio;
            }
          }
        }
      });
    }

    // Process inputs (consumption)
    if (node.inputs) {
      node.inputs.forEach((input) => {
        const itemId = input.itemId;
        if (!itemStats.has(itemId)) {
          itemStats.set(itemId, {
            itemId,
            totalProduction: 0,
            totalConsumption: 0,
            netProduction: 0,
            isRawMaterial: false,
          });
        }
        const stats = itemStats.get(itemId)!;
        stats.totalConsumption += input.requiredRate;
      });
    }

    // Process children (recursively)
    if (node.children) {
      node.children.forEach((child) => {
        // Handle raw materials (nodes without recipe)
        if (!child.recipe && child.isRawMaterial) {
          // Raw material node: use itemId and targetOutputRate
          const itemId = child.itemId!;
          const requiredRate = child.targetOutputRate;
          
          // Create entry if not exists
          if (!itemStats.has(itemId)) {
            itemStats.set(itemId, {
              itemId,
              totalProduction: 0,
              totalConsumption: 0,
              netProduction: 0,
              isRawMaterial: true,
            });
          }
          
          // Mark as raw material and add consumption
          const stats = itemStats.get(itemId)!;
          stats.isRawMaterial = true;
          stats.totalConsumption += requiredRate;
        } else if (child.recipe) {
          // Regular recipe node: traverse recursively
          traverse(child);
        }
      });
    }
  }

  traverse(rootNode);

  // Calculate net production for each item
  itemStats.forEach((stats) => {
    stats.netProduction = stats.totalProduction - stats.totalConsumption;
  });

  return {
    items: itemStats,
    totalMachines,
    totalPower,
  };
}

/**
 * Get items sorted by net production (descending)
 */
export function getSortedItems(statistics: ProductionStatistics): ItemStatistics[] {
  return Array.from(statistics.items.values()).sort((a, b) => {
    // Raw materials first
    if (a.isRawMaterial !== b.isRawMaterial) {
      return a.isRawMaterial ? -1 : 1;
    }
    // Then by absolute net production
    return Math.abs(b.netProduction) - Math.abs(a.netProduction);
  });
}

/**
 * Get only raw materials
 */
export function getRawMaterials(statistics: ProductionStatistics): ItemStatistics[] {
  return Array.from(statistics.items.values())
    .filter(item => item.isRawMaterial)
    .sort((a, b) => b.totalConsumption - a.totalConsumption);
}

/**
 * Get intermediate products (produced and consumed)
 */
export function getIntermediateProducts(statistics: ProductionStatistics): ItemStatistics[] {
  return Array.from(statistics.items.values())
    .filter(item => !item.isRawMaterial && item.totalProduction > 0 && item.totalConsumption > 0)
    .sort((a, b) => b.totalProduction - a.totalProduction);
}

/**
 * Get final products (produced but not consumed)
 */
export function getFinalProducts(statistics: ProductionStatistics): ItemStatistics[] {
  return Array.from(statistics.items.values())
    .filter(item => item.totalProduction > 0 && item.totalConsumption === 0)
    .sort((a, b) => b.totalProduction - a.totalProduction);
}
