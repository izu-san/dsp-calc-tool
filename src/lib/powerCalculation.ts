import type { RecipeTreeNode } from '../types/calculation';
import type { GlobalSettings } from '../types/settings';
import type { MiningCalculation } from './miningCalculation';
import type { GameData } from '../types/game-data';
import { ICONS } from '../constants/icons';

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
export function calculatePowerConsumption(rootNode: RecipeTreeNode | null, settings?: GlobalSettings, miningCalculation?: MiningCalculation, gameData?: GameData): PowerBreakdown {
  // If no root node and no mining calculation, return empty result
  if (!rootNode && !miningCalculation) {
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

  // Only traverse if we have a root node
  if (rootNode) {
    traverse(rootNode);
  }

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
    const sorterTier = settings?.sorter.tier || 'mk1';
    const sorterIconId = ICONS.sorter[sorterTier];
    
    // Get proper sorter name from game data based on tier
    let sorterName = 'ソーター'; // fallback
    if (gameData?.machines) {
      const sorterMachine = gameData.machines.get(sorterIconId);
      if (sorterMachine?.name) {
        sorterName = sorterMachine.name;
      }
    }
    
    byMachine.push({
      machineId: sorterIconId, // Use actual sorter icon ID instead of -1
      machineName: sorterName,
      machineCount: totalSorterCount,
      powerPerMachine: powerPerSorter,
      totalPower: totalSorterPower,
      percentage: 0, // Will calculate after we know total
    });
  }

  // Add mining machines to power breakdown
  if (miningCalculation && miningCalculation.totalMiners > 0) {
    // Group mining machines by type and work speed
    const miningMachineGroups = new Map<string, { count: number; powerPerMachine: number; machineName: string }>();
    
    miningCalculation.rawMaterials.forEach(material => {
      if (material.orbitCollectorsNeeded) {
        // Orbital collectors don't consume power
        return;
      }
      
      const basePowerPerMiner = material.machineType === 'Advanced Mining Machine' ? 630 : 420;
      const powerPerMiner = basePowerPerMiner * material.powerMultiplier;
      const key = `${material.machineType}-${material.workSpeedMultiplier}%`;
      
      if (miningMachineGroups.has(key)) {
        const existing = miningMachineGroups.get(key)!;
        existing.count += material.minersNeeded;
      } else {
        miningMachineGroups.set(key, {
          count: material.minersNeeded,
          powerPerMachine: powerPerMiner,
          machineName: `${material.machineType} (${material.workSpeedMultiplier}%)`,
        });
      }
    });
    
    // Add mining machines to breakdown
    miningMachineGroups.forEach((data) => {
      const totalPower = data.count * data.powerPerMachine;
      
      // Get proper Japanese machine name from game data
      const machineId = data.machineName.includes('Advanced') ? 2316 : 2301; // 高度採掘機 or 採掘機 ID
      const baseMachineName = gameData?.machines.get(machineId)?.name || data.machineName;
      
      // Only show work speed for Advanced Mining Machine (and not for 100%)
      let displayMachineName = baseMachineName;
      if (data.machineName.includes('Advanced')) {
        const workSpeedMatch = data.machineName.match(/\((\d+)%\)/);
        if (workSpeedMatch && workSpeedMatch[1] !== '100') {
          displayMachineName = `${baseMachineName} (${workSpeedMatch[1]}%)`;
        }
      }
      
      byMachine.push({
        machineId,
        machineName: displayMachineName,
        machineCount: data.count,
        powerPerMachine: data.powerPerMachine,
        totalPower,
        percentage: 0, // Will calculate after we know total
      });
    });
  }

  // Calculate total mining power
  let totalMiningPower = 0;
  if (miningCalculation && miningCalculation.totalMiners > 0) {
    totalMiningPower = miningCalculation.rawMaterials.reduce((sum, material) => {
      if (material.orbitCollectorsNeeded) return sum;
      const basePowerPerMiner = material.machineType === 'Advanced Mining Machine' ? 630 : 420;
      return sum + (material.minersNeeded * basePowerPerMiner * material.powerMultiplier);
    }, 0);
  }

  // Total power = machines + sorters + mining machines (excluding dysonSphere)
  const totalPower = totalMachinePower + totalSorterPower + totalMiningPower;

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
