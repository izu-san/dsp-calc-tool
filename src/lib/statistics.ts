import type { RecipeTreeNode } from '../types';
import type { MiningCalculation } from './miningCalculation';

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
  // Mining-related statistics
  totalMiningMachines: number;
  totalMiningPower: number;
  totalOrbitalCollectors: number;
}

/**
 * Calculate item statistics from recipe tree
 */
export function calculateItemStatistics(rootNode: RecipeTreeNode, miningCalculation?: MiningCalculation): ProductionStatistics {
  const itemStats = new Map<number, ItemStatistics>();
  let totalMachines = 0;
  let totalPower = 0;
  
  // Mining-related totals
  let totalMiningMachines = 0;
  let totalMiningPower = 0;
  let totalOrbitalCollectors = 0;
  
  // Add mining statistics if provided
  if (miningCalculation) {
    totalMiningMachines = miningCalculation.totalMiners;
    totalOrbitalCollectors = miningCalculation.totalOrbitalCollectors;
    
    // Calculate mining power consumption
    // Mining Machine: 420 kW base
    // Advanced Mining Machine: 630 kW base
    // Power multiplier applies to Advanced Mining Machine based on work speed
    miningCalculation.rawMaterials.forEach(material => {
      if (material.orbitCollectorsNeeded) {
        // Orbital collectors don't consume power (they're passive)
        return;
      }
      
      // Calculate power per miner based on machine type and work speed
      const basePowerPerMiner = material.machineType === 'Advanced Mining Machine' ? 630 : 420;
      const powerPerMiner = basePowerPerMiner * material.powerMultiplier;
      const minersPower = material.minersNeeded * powerPerMiner;
      totalMiningPower += minersPower;
    });
  }

  // Recursive function to traverse the tree
  function traverse(node: RecipeTreeNode) {
    // Add machine count
    totalMachines += node.machineCount;
    
    // Add power consumption: machines + sorters (always consumed by power plants)
    // Note: dysonSphere power is NOT included (it's provided by Dyson Sphere, not power plants)
    // Skip Ray Receivers (γ線レシーバー) - they use Dyson Sphere power, not regular power plants
    if (node.machine?.id !== 2208) {
      totalPower += node.power.machines + node.power.sorters;
    } else {
      // For Ray Receivers, only count sorter power (machines use Dyson Sphere power)
      totalPower += node.power.sorters;
    }

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
      // Get item IDs from parent's inputs to detect double counting
      const parentInputIds = new Set(node.inputs?.map(i => i.itemId) || []);
      
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
          
          // Mark as raw material
          const stats = itemStats.get(itemId)!;
          stats.isRawMaterial = true;
          
          // Only add consumption if this item is NOT already counted in parent's inputs
          // This prevents double counting for circular dependencies
          if (!parentInputIds.has(itemId)) {
            stats.totalConsumption += requiredRate;
          }
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
    totalMiningMachines,
    totalMiningPower,
    totalOrbitalCollectors,
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
 * Get final products (produced but not consumed, plus raw materials with net positive production)
 * - Items produced but never consumed are always final products
 * - Raw materials with net positive production are final products (e.g., X-ray cracking hydrogen)
 * - Non-raw intermediate products (both produced and consumed) are excluded
 */
export function getFinalProducts(statistics: ProductionStatistics): ItemStatistics[] {
  return Array.from(statistics.items.values())
    .filter(item => {
      // Must have production
      if (item.totalProduction === 0) return false;
      
      // If not consumed at all, it's definitely a final product
      if (item.totalConsumption === 0) return true;
      
      // If it's a raw material with net positive production, it's a final product
      // (e.g., hydrogen in X-ray cracking: input 1.3/s, output 2.0/s, net +0.7/s)
      if (item.isRawMaterial && item.netProduction > 0) return true;
      
      // Otherwise, it's an intermediate product
      return false;
    })
    .sort((a, b) => b.totalProduction - a.totalProduction);
}
