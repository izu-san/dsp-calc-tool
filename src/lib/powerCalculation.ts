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
  let totalSorterPower = 0; // Track total sorter power separately
  let totalSorterCount = 0; // Track total sorter count

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
    
    // Skip Ray Receivers (γ線レシーバー) - they use Dyson Sphere power, not regular power plants
    if (machine.id === 2208) {
      // Still track sorter power and count for Ray Receivers
      totalSorterPower += node.power.sorters;
      
      // Calculate sorter count for this node
      if (node.recipe) {
        const inputItems = node.recipe.Items?.length || 0;
        const outputItems = node.recipe.Results?.length || 0;
        const sortersPerMachine = inputItems + outputItems;
        totalSorterCount += Math.ceil(node.machineCount) * sortersPerMachine;
      }
      
      node.children.forEach(child => traverse(child));
      return;
    }

    // Calculate power per machine including proliferator power increase
    let powerPerMachine = (machine.workEnergyPerTick || 0) * 60 / 1000; // kW
    
    // Apply proliferator power increase if present
    if (node.proliferator && node.proliferator.type !== 'none') {
      const powerIncrease = node.proliferator.powerIncrease || 0;
      powerPerMachine *= (1 + powerIncrease);
    }

    // Add or update power map
    if (powerMap.has(machineId)) {
      const existing = powerMap.get(machineId)!;
      existing.count += machineCount;
      // Update power per machine to the higher value (in case different proliferator settings)
      existing.powerPerMachine = Math.max(existing.powerPerMachine, powerPerMachine);
    } else {
      powerMap.set(machineId, {
        name: machineName,
        count: machineCount,
        powerPerMachine,
      });
    }

    // Track sorter power and count separately (all sorters consume power)
    totalSorterPower += node.power.sorters;
    
    // Calculate sorter count for this node
    if (node.recipe) {
      const inputItems = node.recipe.Items?.length || 0;
      const outputItems = node.recipe.Results?.length || 0;
      const sortersPerMachine = inputItems + outputItems;
      totalSorterCount += Math.ceil(node.machineCount) * sortersPerMachine;
    }

    // Traverse children
    node.children.forEach(child => traverse(child));
  }

  traverse(rootNode);

  // Convert map to array and calculate totals
  const byMachine: PowerConsumption[] = [];
  let totalMachinePower = 0;

  powerMap.forEach((data, machineId) => {
    const total = data.count * data.powerPerMachine;
    totalMachinePower += total;
    byMachine.push({
      machineId,
      machineName: data.name,
      machineCount: data.count,
      powerPerMachine: data.powerPerMachine,
      totalPower: total,
      percentage: 0, // Will calculate after we know total
    });
  });

  // Add sorters as a separate entry in the breakdown
  if (totalSorterPower > 0) {
    const powerPerSorter = totalSorterCount > 0 ? totalSorterPower / totalSorterCount : 0;
    byMachine.push({
      machineId: -1, // Special ID for sorters
      machineName: 'ソーター',
      machineCount: totalSorterCount,
      powerPerMachine: powerPerSorter,
      totalPower: totalSorterPower,
      percentage: 0, // Will calculate after we know total
    });
  }

  // Total power = machines + sorters (excluding dysonSphere)
  const totalPower = totalMachinePower + totalSorterPower;

  // Calculate percentages based on total power and sort by power consumption (descending)
  byMachine.forEach(item => {
    item.percentage = totalPower > 0 ? (item.totalPower / totalPower) * 100 : 0;
  });

  byMachine.sort((a, b) => b.totalPower - a.totalPower);

  return {
    total: totalPower,
    byMachine,
  };
}
