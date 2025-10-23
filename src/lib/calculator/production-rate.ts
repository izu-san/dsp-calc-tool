import type { Recipe, Machine, ProliferatorConfig } from '../../types';
import { getEffectiveBonuses } from '../proliferator';

/**
 * Calculate production rate for a recipe with given settings
 * 
 * Production mode: Increases output per craft (more items per recipe execution)
 * Speed mode: Reduces time per craft (faster recipe execution)
 * @internal - Exported for testing
 */
export function calculateProductionRate(
  recipe: Recipe,
  machine: Machine,
  proliferator: ProliferatorConfig,
  proliferatorMultiplier: { production: number; speed: number }
): number {
  const baseTime = recipe.TimeSpend / 60; // Convert ticks to seconds
  
  // Some machines (like Matrix Lab) have assemblerSpeed = 0, treat as 100%
  let machineSpeedMultiplier = machine.assemblerSpeed / 10000; // 10000 = 100%
  if (machineSpeedMultiplier === 0) {
    machineSpeedMultiplier = 1.0; // Default to 100% for special machines
  }
  
  // Speed mode: reduces time per craft (apply effective speed bonus)
  const { effectiveProductionBonus, effectiveSpeedBonus } = getEffectiveBonuses(proliferator, proliferatorMultiplier);
  const speedBonus = proliferator.mode === 'speed' ? 1 + effectiveSpeedBonus : 1;
  
  // Time per craft in seconds
  const timePerCraft = baseTime / machineSpeedMultiplier / speedBonus;
  
  // Production mode: increases output per craft
  const baseOutput = recipe.Results[0]?.count || 1;
  const productionBonus = proliferator.mode === 'production' ? 1 + effectiveProductionBonus : 1;
  const outputPerCraft = baseOutput * productionBonus;
  
  return outputPerCraft / timePerCraft;
}

