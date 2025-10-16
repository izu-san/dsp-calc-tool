import type { CalculationResult } from '../types/calculation';
import { useGameDataStore } from '../stores/gameDataStore';

export interface MiningRequirement {
  itemId: number;
  itemName: string;
  requiredRate: number; // items per second
  miningSpeedBonus: number; // Research bonus (100% = 1.0, 200% = 2.0)
  workSpeedMultiplier: number; // Advanced Mining Machine speed setting (100%-300%)
  powerMultiplier: number; // Power consumption multiplier for the speed setting
  outputPerSecond: number; // Actual output per mining machine per second
  minersNeeded: number; // Number of mining machines needed
  veinsNeeded: number; // Total number of veins needed to cover
  orbitCollectorsNeeded?: number; // Alternative: orbital collectors (Hydrogen/Deuterium only)
  orbitalCollectorSpeed?: number; // Speed per orbital collector (if applicable)
}

export interface MiningCalculation {
  rawMaterials: MiningRequirement[];
  totalMiners: number;
  totalOrbitalCollectors: number;
}

// Base mining speed per vein (items per second) - VERIFIED GAME DATA
// 
// 【ゲーム内検証済み】
// Mining Machine: 0.5 items/s per vein
// Advanced Mining Machine: 1.0 items/s per vein (100% Work Speed時)
// 
const BASE_MINING_SPEED_PER_VEIN = {
  'Mining Machine': 0.5,  // 0.5 items/s per vein
  'Advanced Mining Machine': 1.0,  // 1.0 items/s per vein (base)
};

// Orbital collector speeds (items per second per collector)
// Different for each gas type and varies by planet
const ORBITAL_COLLECTOR_SPEEDS: Record<number, number> = {
  1120: 0.84,  // Hydrogen: 0.84/s per collector
  1121: 0.03,  // Deuterium: 0.03/s per collector
};

// Power consumption multipliers for Advanced Mining Machine speed settings
// ゲーム内検証済み: 消費電力は速度の2乗に比例
// Formula: powerMultiplier = (speedPercent / 100) ^ 2
// 
// 【検証済みデータ】
// 100% speed → 100% power (1.0x)
// 150% speed → 225% power (2.25x)
// 200% speed → 400% power (4.0x)
// 250% speed → 625% power (6.25x)
// 300% speed → 900% power (9.0x)
export const POWER_MULTIPLIER_BY_SPEED: Record<number, number> = {
  100: 1.0,    // (100/100)^2 = 1.0
  150: 2.25,   // (150/100)^2 = 2.25
  200: 4.0,    // (200/100)^2 = 4.0
  250: 6.25,   // (250/100)^2 = 6.25
  300: 9.0,    // (300/100)^2 = 9.0
};

/**
 * Calculate mining machine requirements for raw materials
 * 
 * @param calculationResult - The production calculation result
 * @param miningSpeedBonus - Mining speed research bonus (1.0 = +0%, 2.0 = +100%)
 * @param machineType - Type of mining machine
 * @param workSpeedMultiplier - Speed setting for Advanced Mining Machine (100-300%)
 */
export function calculateMiningRequirements(
  calculationResult: CalculationResult | null,
  miningSpeedBonus: number = 1.0,
  machineType: 'Mining Machine' | 'Advanced Mining Machine' = 'Advanced Mining Machine',
  workSpeedMultiplier: number = 100
): MiningCalculation {
  if (!calculationResult) {
    return {
      rawMaterials: [],
      totalMiners: 0,
      totalOrbitalCollectors: 0,
    };
  }

  const gameData = useGameDataStore.getState().data;
  if (!gameData) {
    return {
      rawMaterials: [],
      totalMiners: 0,
      totalOrbitalCollectors: 0,
    };
  }

  const baseMiningSpeedPerVein = BASE_MINING_SPEED_PER_VEIN[machineType];
  const rawMaterials: MiningRequirement[] = [];
  let totalMiners = 0;
  let totalOrbitalCollectors = 0;

  // Process each raw material
  calculationResult.rawMaterials.forEach((rate, itemId) => {
    const item = gameData.items.get(itemId);
    if (!item) return;

    // Calculate output per vein
    // Formula: baseMiningSpeedPerVein × miningSpeedBonus × (workSpeedMultiplier / 100)
    let outputPerVeinPerSecond = baseMiningSpeedPerVein * miningSpeedBonus;
    
    // Advanced Mining Machine can have speed multiplier
    const actualWorkSpeed = machineType === 'Advanced Mining Machine' ? workSpeedMultiplier : 100;
    if (machineType === 'Advanced Mining Machine') {
      outputPerVeinPerSecond *= (workSpeedMultiplier / 100);
    }

    // Calculate total veins needed
    const veinsNeeded = Math.ceil(rate / outputPerVeinPerSecond);
    
    // Calculate miners needed (assume ~6 veins per miner on average)
    const averageVeinsPerMiner = 6;
    const minersNeeded = Math.ceil(veinsNeeded / averageVeinsPerMiner);

    // Calculate output per miner (for display)
    const outputPerSecond = outputPerVeinPerSecond * averageVeinsPerMiner;

    // Calculate power multiplier (Advanced Mining Machine only)
    const powerMultiplier = machineType === 'Advanced Mining Machine' 
      ? POWER_MULTIPLIER_BY_SPEED[workSpeedMultiplier] || 1.0
      : 1.0;

    // Calculate orbital collectors for Hydrogen and Deuterium only
    let orbitCollectorsNeeded: number | undefined;
    let orbitalCollectorSpeed: number | undefined;
    
    if (ORBITAL_COLLECTOR_SPEEDS[itemId]) {
      // Orbital collector speed with research bonus
      orbitalCollectorSpeed = ORBITAL_COLLECTOR_SPEEDS[itemId] * miningSpeedBonus;
      orbitCollectorsNeeded = Math.ceil(rate / orbitalCollectorSpeed);
    }

    rawMaterials.push({
      itemId,
      itemName: item.name,
      requiredRate: rate,
      miningSpeedBonus,
      workSpeedMultiplier: actualWorkSpeed,
      powerMultiplier,
      outputPerSecond,
      minersNeeded,
      veinsNeeded,
      orbitCollectorsNeeded,
      orbitalCollectorSpeed,
    });

    totalMiners += minersNeeded;
    if (orbitCollectorsNeeded) {
      totalOrbitalCollectors += orbitCollectorsNeeded;
    }
  });

  // Sort by required rate (descending)
  rawMaterials.sort((a, b) => b.requiredRate - a.requiredRate);

  return {
    rawMaterials,
    totalMiners,
    totalOrbitalCollectors,
  };
}
