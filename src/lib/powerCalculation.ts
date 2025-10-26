import type { RecipeTreeNode } from '../types/calculation';

export interface PowerConsumption {
  machineId: number;
  machineName: string;
  machineCount: number;
  powerPerMachine: number; // kW
  totalPower: number; // kW
  percentage: number;
}

export interface PowerBreakdown {
  total: number; // Total power in kW
  byMachine: PowerConsumption[];
}

/**
 * Calculate power consumption breakdown from production tree
 */
export function calculatePowerConsumption(rootNode: RecipeTreeNode | null): PowerBreakdown {
  if (!rootNode) {
    return { total: 0, byMachine: [] };
  }

  // Map to accumulate power by machine ID
  const powerMap = new Map<number, { name: string; count: number; powerPerMachine: number }>();

  // Recursive function to traverse the tree
  function traverse(node: RecipeTreeNode) {
    // Skip raw material leaf nodes
    if (!node.recipe || !node.machine) {
      node.children.forEach(child => traverse(child));
      return;
    }

    const machine = node.machine;
    const machineId = machine.id;
    const machineName = machine.name || 'Unknown Machine';
    const machineCount = node.machineCount;
    
    // ダイソンスフィア電力の場合は node.power.dysonSphere を使用
    // 通常電力の場合は workEnergyPerTick から計算
    let powerPerMachine: number;
    if (node.power.dysonSphere > 0) {
      // ダイソンスフィア電力: node.power.dysonSphere / machineCount
      powerPerMachine = machineCount > 0 ? node.power.dysonSphere / machineCount : 0;
    } else {
      // 通常電力: workEnergyPerTick * 60 / 1000
      powerPerMachine = (machine.workEnergyPerTick || 0) * 60 / 1000; // Convert to kW
    }

    // Add or update power map
    if (powerMap.has(machineId)) {
      const existing = powerMap.get(machineId)!;
      existing.count += machineCount;
    } else {
      powerMap.set(machineId, {
        name: machineName,
        count: machineCount,
        powerPerMachine,
      });
    }

    // Traverse children
    node.children.forEach(child => traverse(child));
  }

  traverse(rootNode);

  // Convert map to array and calculate totals
  const byMachine: PowerConsumption[] = [];
  let totalPower = 0;

  powerMap.forEach((data, machineId) => {
    const total = data.count * data.powerPerMachine;
    totalPower += total;
    byMachine.push({
      machineId,
      machineName: data.name,
      machineCount: data.count,
      powerPerMachine: data.powerPerMachine,
      totalPower: total,
      percentage: 0, // Will calculate after we know total
    });
  });

  // Calculate percentages and sort by power consumption (descending)
  byMachine.forEach(item => {
    item.percentage = totalPower > 0 ? (item.totalPower / totalPower) * 100 : 0;
  });

  byMachine.sort((a, b) => b.totalPower - a.totalPower);

  return {
    total: totalPower,
    byMachine,
  };
}
