import { describe, it, expect } from 'vitest';
import { calculateItemStatistics, getSortedItems, getRawMaterials, getIntermediateProducts, getFinalProducts } from '../statistics';

describe('statistics edge cases', () => {
  it('handles empty tree gracefully', () => {
    const emptyRoot: any = {
      nodeId: 'root',
      isRawMaterial: false,
      targetOutputRate: 0,
      machineCount: 0,
      power: { total: 0, machines: 0, sorters: 0 },
      conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
      children: [],
    };

    const stats = calculateItemStatistics(emptyRoot);
    expect(stats.totalMachines).toBe(0);
    expect(stats.totalPower).toBe(0);
    expect(stats.items.size).toBe(0);
    expect(getSortedItems(stats)).toEqual([]);
    expect(getRawMaterials(stats)).toEqual([]);
    expect(getIntermediateProducts(stats)).toEqual([]);
    expect(getFinalProducts(stats)).toEqual([]);
  });

  it('treats raw material child as consumption only when no recipe', () => {
    const root: any = {
      nodeId: 'root',
      isRawMaterial: false,
      targetOutputRate: 60,
      machineCount: 1,
      power: { total: 120, machines: 120, sorters: 0 },
      conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
      recipe: {
        SID: 2001,
        Results: [{ id: 1002, count: 1 }],
      },
      inputs: [{ itemId: 1001, itemName: 'Iron Ore', requiredRate: 60 }],
      children: [
        {
          nodeId: 'raw-1001-0',
          isRawMaterial: true,
          itemId: 1001,
          itemName: 'Iron Ore',
          targetOutputRate: 60,
          conveyorBelts: { outputs: 1 },
          children: [],
        },
      ],
    };

    const stats = calculateItemStatistics(root);
    // raw material is registered as consumption only
    const raw = stats.items.get(1001)!;
    expect(raw).toBeTruthy();
    expect(raw.isRawMaterial).toBe(true);
    expect(raw.totalProduction).toBe(0);
    // root.inputs の 60 のみがカウントされる（raw child の 60 は重複カウントしない）
    expect(raw.totalConsumption).toBe(60);
    expect(raw.netProduction).toBe(-60);

    // product item is produced
    const prod = stats.items.get(1002)!;
    expect(prod.totalProduction).toBe(60);
    expect(prod.totalConsumption).toBe(0);

    // group helpers do not crash
    expect(getSortedItems(stats).length).toBe(2);
    expect(getRawMaterials(stats).length).toBe(1);
    expect(getIntermediateProducts(stats).length).toBe(0);
    expect(getFinalProducts(stats).length).toBe(1);
  });

  it('proportional outputs are calculated relative to main output count', () => {
    const root: any = {
      nodeId: 'root',
      isRawMaterial: false,
      targetOutputRate: 60,
      machineCount: 1,
      power: { total: 120, machines: 120, sorters: 0 },
      conveyorBelts: { inputs: 1, outputs: 2, total: 3 },
      recipe: {
        SID: 3001,
        Results: [
          { id: 2000, count: 2 }, // main
          { id: 2001, count: 1 }, // secondary (half of main)
        ],
      },
      inputs: [],
      children: [],
    };

    const stats = calculateItemStatistics(root);
    const main = stats.items.get(2000)!;
    const sub = stats.items.get(2001)!;
    expect(main.totalProduction).toBe(60);
    // proportional: 60 * (1 / 2) = 30
    expect(sub.totalProduction).toBeCloseTo(30, 6);
  });
});


