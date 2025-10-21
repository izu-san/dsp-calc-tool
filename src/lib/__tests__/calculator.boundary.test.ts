import { describe, it, expect } from 'vitest';
import { calculateProductionRate, calculateConveyorBelts, buildRecipeTree } from '../calculator';

describe('calculator boundary cases', () => {
  it('calculateProductionRate handles assemblerSpeed=0 as 100%', () => {
    const recipe: any = { TimeSpend: 60, Results: [{ id: 1, count: 1 }], Items: [], productive: false };
    const machine: any = { assemblerSpeed: 0, workEnergyPerTick: 6000, name: 'Matrix Lab' };
    const proliferator: any = { type: 'none', mode: 'speed', productionBonus: 0, speedBonus: 0, powerIncrease: 0 };
    const pr = calculateProductionRate(recipe, machine, proliferator, { production: 1, speed: 1 });
    // 60 ticks = 1s, speed=100% → 1 item/s
    expect(pr).toBeCloseTo(1, 6);
  });

  it('calculateConveyorBelts returns zero when beltSpeed<=0', () => {
    const belts = calculateConveyorBelts(60, [{ itemId: 1, itemName: 'A', requiredRate: 60 }], 0);
    expect(belts.total).toBe(0);
    expect(belts.saturation).toBe(0);
    expect(belts.bottleneckType).toBeUndefined();
  });

  it('buildRecipeTree throws on exceeding maxDepth', () => {
    const recipe: any = { SID: 1, Type: 'Assemble', TimeSpend: 60, Results: [{ id: 2, count: 1 }], Items: [{ id: 3, name: 'B', count: 1 }], productive: false };
    const gameData: any = {
      machines: new Map([[1, { id: 1, name: 'Assembler', assemblerSpeed: 10000, workEnergyPerTick: 60 }]]),
      allItems: new Map([[3, { id: 3, name: 'B' }]]),
      recipesByItemId: new Map([[3, [{ SID: 1, Type: 'Assemble', TimeSpend: 60, Results: [{ id: 3, count: 1 }], Items: [], productive: false }]]]),
    };
    const settings: any = {
      proliferator: { type: 'none', mode: 'speed', productionBonus: 0, speedBonus: 0, powerIncrease: 0 },
      proliferatorMultiplier: { production: 1, speed: 1 },
      conveyorBelt: { speed: 6, stackCount: 1 },
      sorter: { powerConsumption: 0.1 },
      alternativeRecipes: new Map(),
      machineRank: {},
    };
    const overrides = new Map();
    expect(() => buildRecipeTree(recipe, 1, gameData, settings, overrides, 0, 0, 'r-1')).toThrowError('Maximum recursion depth reached');
  });
});


