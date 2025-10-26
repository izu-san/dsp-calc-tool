import type { Recipe, Machine, ProliferatorConfig, PowerConsumption, PhotonGenerationSettings } from '../../types';
import { getEffectiveBonuses } from '../proliferator';
import {
  calculateRayTransmissionEfficiency,
  calculateReceptionEfficiency,
  getPhotonGenerationRate,
  calculateRequiredPower,
} from '../photonGenerationCalculation';

/**
 * Calculate power consumption for machines
 * @internal - Exported for testing
 */
export function calculateMachinePower(
  machine: Machine,
  machineCount: number,
  proliferator: ProliferatorConfig,
  proliferatorMultiplier: { production: number; speed: number },
  recipeType?: Recipe['Type'],
  photonSettings?: PhotonGenerationSettings
): PowerConsumption {
  // PhotonGeneration の特殊処理
  if (recipeType === 'PhotonGeneration' && photonSettings) {
    const rayTransmissionEfficiency = calculateRayTransmissionEfficiency(photonSettings.rayTransmissionEfficiency);
    const loss = 1 - rayTransmissionEfficiency;
    
    // 受信効率を計算
    const receptionEfficiency = calculateReceptionEfficiency(loss, photonSettings.continuousReception);
    
    // 重力子レンズへの増産剤効果（速度上昇のみ）
    const speedBonus = photonSettings.gravitonLensProliferator.speedBonus;
    const rateData = getPhotonGenerationRate(
      photonSettings.useGravitonLens,
      photonSettings.continuousReception,
      speedBonus
    );
    
    const requiredPower = calculateRequiredPower(rateData.theoreticalPower, receptionEfficiency);
    
    return {
      machines: 0, // 通常電力は消費しない
      sorters: 0,
      dysonSphere: requiredPower * machineCount,
      total: requiredPower * machineCount,
    };
  }
  
  // 既存の通常電力計算
  const basePower = (machine.workEnergyPerTick * 60) / 1000; // Convert to kW
  const { effectivePowerIncrease } = getEffectiveBonuses(proliferator, proliferatorMultiplier);
  
  const powerMultiplier = 1 + effectivePowerIncrease;
  const machinePower = basePower * powerMultiplier * machineCount;
  
  return {
    machines: machinePower,
    sorters: 0,
    dysonSphere: 0,
    total: machinePower,
  };
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

