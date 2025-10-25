import { describe, it, expect } from 'vitest';
import { calculateMachinePower, calculateSorterPower } from '../power-calculation';
import type { Recipe, Machine, ProliferatorConfig } from '../../../types';
import { PROLIFERATOR_DATA } from '../../../types/settings';

describe('calculateMachinePower', () => {
  const mockMachine: Machine = {
    id: 2302,
    name: 'Arc Smelter',
    Type: 'Smelt',
    assemblerSpeed: 10000,
    workEnergyPerTick: 360000, // 360,000 ticks * 60 / 1000 = 21,600 kW
    idleEnergyPerTick: 18000,
    exchangeEnergyPerTick: 0,
    isPowerConsumer: true,
    isPowerExchanger: false,
    isRaw: false,
  };

  it('should calculate basic machine power consumption', () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: 'production',
    };
    
    // Base power = (360,000 * 60) / 1000 = 21,600 kW per machine
    // For 1 machine = 21,600 kW
    const power = calculateMachinePower(mockMachine, 1, proliferator, { production: 1, speed: 1 });
    
    expect(power).toBe(21600);
  });

  it('should scale power with machine count', () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: 'production',
    };
    
    // For 10 machines = 216,000 kW
    const power = calculateMachinePower(mockMachine, 10, proliferator, { production: 1, speed: 1 });
    
    expect(power).toBe(216000);
  });

  it('should apply power increase for proliferator', () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.mk3,
      mode: 'speed',
    };
    
    // With Mk3, power increase is 150% (1.5)
    // Power = 21,600 * (1 + 1.5) = 21,600 * 2.5 = 54,000 kW
    const power = calculateMachinePower(mockMachine, 1, proliferator, { production: 1, speed: 1 });
    
    expect(power).toBe(54000);
  });

  it('should apply proliferator multiplier to power increase', () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.mk3,
      mode: 'speed',
    };
    
    // Power increase = 1.5 * 2 = 3.0
    // Power = 21,600 * (1 + 3.0) = 21,600 * 4 = 86,400 kW
    const power = calculateMachinePower(mockMachine, 1, proliferator, { production: 2, speed: 2 });
    
    expect(power).toBe(86400);
  });
});

describe('calculateSorterPower', () => {
  it('should calculate sorter power based on input/output types', () => {
    const mockRecipe: Recipe = {
      SID: 1,
      name: 'Test',
      TimeSpend: 60,
      Items: [
        { id: 1, name: 'Iron Ore', count: 1, Type: '0', isRaw: true },
        { id: 2, name: 'Copper Ore', count: 1, Type: '0', isRaw: true },
      ],
      Results: [
        { id: 3, name: 'Iron Ingot', count: 1, Type: '0', isRaw: false },
      ],
      Type: 'Assemble',
      Explicit: false,
      GridIndex: '1101',
      productive: true,
    };
    
    const machineCount = 10;
    const sorterPowerPerUnit = 0.03; // 30W = 0.03kW
    
    // Sorters per machine = 2 inputs + 1 output = 3
    // Total sorters = 3 * 10 = 30
    // Power = 30 * 0.03 = 0.9 kW
    const power = calculateSorterPower(mockRecipe, machineCount, sorterPowerPerUnit);
    
    expect(power).toBeCloseTo(0.9, 5); // Use toBeCloseTo for floating point comparison
  });

  it('should handle recipes with no inputs', () => {
    const mockRecipe: Recipe = {
      SID: 1,
      name: 'Mining',
      TimeSpend: 60,
      Items: [],
      Results: [{ id: 1, name: 'Iron Ore', count: 1, Type: '0', isRaw: true }],
      Type: 'Smelt',
      Explicit: false,
      GridIndex: '1101',
      productive: false,
    };
    
    // Sorters = 0 inputs + 1 output = 1
    const power = calculateSorterPower(mockRecipe, 5, 0.03);
    
    expect(power).toBe(0.15); // 1 * 5 * 0.03
  });
});

