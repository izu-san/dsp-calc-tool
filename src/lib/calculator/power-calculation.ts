import type { Recipe, Machine, ProliferatorConfig } from '../../types';
import { getEffectiveBonuses } from '../proliferator';

/**
 * Calculate power consumption for machines
 * @internal - Exported for testing
 */
export function calculateMachinePower(
  machine: Machine,
  machineCount: number,
  proliferator: ProliferatorConfig,
  proliferatorMultiplier: { production: number; speed: number }
): number {
  const basePower = (machine.workEnergyPerTick * 60) / 1000; // Convert to kW
  const { effectivePowerIncrease } = getEffectiveBonuses(proliferator, proliferatorMultiplier);
  
  const powerMultiplier = 1 + effectivePowerIncrease;
  return basePower * powerMultiplier * machineCount;
}

/**
 * Calculate sorter power consumption
 * Formula: ソーター1台あたりの消費電力 * (Inputsアイテム種別数 + Outputsアイテム種別数) * マシン台数
 * @internal - Exported for testing
 */
export function calculateSorterPower(
  recipe: Recipe,
  machineCount: number,
  sorterPowerPerUnit: number
): number {
  // ソーター数 = Inputsアイテム種別数 + Outputsアイテム種別数
  const inputItemTypes = recipe.Items.length;
  const outputItemTypes = recipe.Results.length;
  const sortersPerMachine = inputItemTypes + outputItemTypes;
  
  // 消費電力 = ソーター1台あたりの消費電力 * (Inputsアイテム種別数 + Outputsアイテム種別数)
  return sorterPowerPerUnit * sortersPerMachine * machineCount;
}

