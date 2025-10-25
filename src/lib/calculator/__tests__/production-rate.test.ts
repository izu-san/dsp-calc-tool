import { describe, it, expect } from 'vitest';
import { calculateProductionRate } from '../production-rate';
import type { Recipe, Machine, ProliferatorConfig } from '../../../types';
import { PROLIFERATOR_DATA } from '../../../types/settings';

describe('calculateProductionRate', () => {
  const mockRecipe: Recipe = {
    SID: 1,
    name: 'Iron Ingot',
    TimeSpend: 60, // 1 second (60 ticks)
    Results: [{ id: 1001, name: 'Iron Ingot', count: 1, Type: '0', isRaw: false }],
    Items: [{ id: 1101, name: 'Iron Ore', count: 1, Type: '0', isRaw: true }],
    Type: 'Smelt',
    Explicit: false,
    GridIndex: '1101',
    productive: true,
  };

  const mockMachine: Machine = {
    id: 2302,
    name: 'Arc Smelter',
    Type: 'Smelt',
    assemblerSpeed: 10000, // 100% (10000 = 100%)
    workEnergyPerTick: 360000, // 360kW per tick
    idleEnergyPerTick: 18000,
    exchangeEnergyPerTick: 0,
    isPowerConsumer: true,
    isPowerExchanger: false,
    isRaw: false,
  };

  it('should calculate basic production rate without proliferator', () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: 'production',
    };
    
    // Production rate = output / (time / machineSpeed)
    // = 1 / (60 ticks / 60 ticks per second / 100%) = 1 item/s
    const rate = calculateProductionRate(mockRecipe, mockMachine, proliferator, { production: 1, speed: 1 });
    
    expect(rate).toBe(1);
  });

  it('should apply speed bonus correctly in speed mode', () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.mk3,
      mode: 'speed',
    };
    
    // With Mk3 speed mode (100% speed bonus)
    // Time per craft = 1s / 1.0 / (1 + 1.0) = 0.5s
    // Rate = 1 / 0.5s = 2 items/s
    const rate = calculateProductionRate(mockRecipe, mockMachine, proliferator, { production: 1, speed: 1 });
    
    expect(rate).toBe(2);
  });

  it('should apply production bonus correctly in production mode', () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.mk3,
      mode: 'production',
    };
    
    // With Mk3 production mode (25% production bonus)
    // Output per craft = 1 * (1 + 0.25) = 1.25
    // Rate = 1.25 / 1s = 1.25 items/s
    const rate = calculateProductionRate(mockRecipe, mockMachine, proliferator, { production: 1, speed: 1 });
    
    expect(rate).toBe(1.25);
  });

  it('should handle machines with zero assemblerSpeed', () => {
    const labMachine: Machine = {
      ...mockMachine,
      assemblerSpeed: 0, // Matrix Lab has 0
    };
    
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: 'production',
    };
    
    // Should default to 100% speed (1.0x multiplier)
    const rate = calculateProductionRate(mockRecipe, labMachine, proliferator, { production: 1, speed: 1 });
    
    expect(rate).toBe(1);
  });

  it('should handle faster machines correctly', () => {
    const fasterMachine: Machine = {
      ...mockMachine,
      assemblerSpeed: 20000, // 200% speed
    };
    
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: 'production',
    };
    
    // Rate = 1 / (1s / 2.0) = 2 items/s
    const rate = calculateProductionRate(mockRecipe, fasterMachine, proliferator, { production: 1, speed: 1 });
    
    expect(rate).toBe(2);
  });

  it('should apply proliferator multiplier correctly', () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.mk3,
      mode: 'speed',
    };
    
    // Double the speed bonus (2x multiplier)
    // Speed bonus = 1 + (1.0 * 2) = 3.0
    // Time per craft = 1s / 3.0 = 0.333...s
    // Rate = 1 / 0.333... = 3 items/s
    const rate = calculateProductionRate(mockRecipe, mockMachine, proliferator, { production: 1, speed: 2 });
    
    expect(rate).toBe(3);
  });
});

