import { describe, it, expect, vi } from 'vitest';
import { calculateMiningRequirements, POWER_MULTIPLIER_BY_SPEED } from '../miningCalculation';
import type { CalculationResult } from '../../types/calculation';


// Mock game data
const mockGameData = {
  items: new Map([
    [1001, { id: 1001, name: 'Iron Ore', Type: 'Resource', isRaw: true }],
    [1002, { id: 1002, name: 'Copper Ore', Type: 'Resource', isRaw: true }],
    [1003, { id: 1003, name: 'Stone', Type: 'Resource', isRaw: true }],
    [1000, { id: 1000, name: 'Water', Type: 'Resource', isRaw: true }],
    [1007, { id: 1007, name: 'Crude Oil', Type: 'Resource', isRaw: true }],
    [1116, { id: 1116, name: 'Sulfuric Acid', Type: 'Resource', isRaw: true }],
    [1120, { id: 1120, name: 'Hydrogen', Type: 'Material', isRaw: false }],
    [1121, { id: 1121, name: 'Deuterium', Type: 'Material', isRaw: false }],
  ]),
};

describe('miningCalculation', () => {
  describe('calculateMiningRequirements', () => {
    describe('基本計算', () => {
      it('nullの計算結果を処理する', () => {
        const result = calculateMiningRequirements(null);

        expect(result.rawMaterials).toEqual([]);
        expect(result.totalMiners).toBe(0);
        expect(result.totalOrbitalCollectors).toBe(0);
      });

      it('Mining Machineの基本速度（0.5/s per vein）を計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 30]]), // 30 Iron Ore/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Mining Machine: 0.5/s per vein, 研究ボーナスなし (1.0), 速度設定なし
        const result = calculateMiningRequirements(calcResult, 1.0, 'Mining Machine', 100, mockGameData);

        expect(result.rawMaterials).toHaveLength(1);
        const iron = result.rawMaterials[0];

        // outputPerVein = 0.5 * 1.0 = 0.5/s per vein
        // veinsNeeded = ceil(30 / 0.5) = 60 veins
        // minersNeeded = ceil(60 / 6) = 10 miners
        // outputPerSecond = 0.5 * 6 = 3.0/s per miner
        expect(iron.itemId).toBe(1001);
        expect(iron.requiredRate).toBe(30);
        expect(iron.miningSpeedBonus).toBe(1.0);
        expect(iron.veinsNeeded).toBe(60);
        expect(iron.minersNeeded).toBe(10);
        expect(iron.outputPerSecond).toBe(3.0);
        expect(iron.powerMultiplier).toBe(1.0); // Mining Machineは常に1.0
        expect(iron.machineType).toBe('Mining Machine'); // 機械の種類が正しく設定される
      });

      it('Advanced Mining Machineの基本速度（1.0/s per vein）を計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 60]]), // 60 Iron Ore/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Advanced Mining Machine: 1.0/s per vein, 研究ボーナスなし (1.0), 100% speed
        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 100, mockGameData);

        expect(result.rawMaterials).toHaveLength(1);
        const iron = result.rawMaterials[0];

        // outputPerVein = 1.0 * 1.0 * 1.0 = 1.0/s per vein
        // veinsNeeded = ceil(60 / 1.0) = 60 veins
        // minersNeeded = ceil(60 / 6) = 10 miners
        // outputPerSecond = 1.0 * 6 = 6.0/s per miner
        expect(iron.veinsNeeded).toBe(60);
        expect(iron.minersNeeded).toBe(10);
        expect(iron.outputPerSecond).toBe(6.0);
        expect(iron.powerMultiplier).toBe(1.0); // 100% speed → 1.0x power
        expect(iron.machineType).toBe('Advanced Mining Machine'); // 機械の種類が正しく設定される
      });

      it('複数の原材料を処理する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([
            [1001, 60], // Iron Ore
            [1002, 30], // Copper Ore
            [1003, 15], // Stone
          ]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 100, mockGameData);

        expect(result.rawMaterials).toHaveLength(3);

        // requiredRate でソート（降順）: Iron (60), Copper (30), Stone (15)
        expect(result.rawMaterials[0].itemId).toBe(1001); // Iron: 60/s
        expect(result.rawMaterials[1].itemId).toBe(1002); // Copper: 30/s
        expect(result.rawMaterials[2].itemId).toBe(1003); // Stone: 15/s

        // 総採掘機数
        // Iron: ceil(60 / 6) = 10
        // Copper: ceil(30 / 6) = 5
        // Stone: ceil(15 / 6) = 3
        expect(result.totalMiners).toBe(18);
      });

      it('requiredRateでソートする（降順）', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([
            [1003, 15], // Stone (smallest)
            [1001, 60], // Iron Ore (largest)
            [1002, 30], // Copper Ore (middle)
          ]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 100, mockGameData);

        // 降順ソート: 60, 30, 15
        expect(result.rawMaterials[0].requiredRate).toBe(60);
        expect(result.rawMaterials[1].requiredRate).toBe(30);
        expect(result.rawMaterials[2].requiredRate).toBe(15);
      });
    });

    describe('研究ボーナス', () => {
      it('研究ボーナス+100%（miningSpeedBonus = 2.0）を適用する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 60]]), // 60 Iron Ore/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Advanced Mining Machine, 200% speed (2.0x research bonus)
        const result = calculateMiningRequirements(calcResult, 2.0, 'Advanced Mining Machine', 100, mockGameData);

        const iron = result.rawMaterials[0];

        // outputPerVein = 1.0 * 2.0 * 1.0 = 2.0/s per vein
        // veinsNeeded = ceil(60 / 2.0) = 30 veins
        // minersNeeded = ceil(30 / 6) = 5 miners
        // outputPerSecond = 2.0 * 6 = 12.0/s per miner
        expect(iron.miningSpeedBonus).toBe(2.0);
        expect(iron.veinsNeeded).toBe(30);
        expect(iron.minersNeeded).toBe(5);
        expect(iron.outputPerSecond).toBe(12.0);
      });

      it('研究ボーナス+50%（miningSpeedBonus = 1.5）を適用する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 45]]), // 45 Iron Ore/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        const result = calculateMiningRequirements(calcResult, 1.5, 'Advanced Mining Machine', 100, mockGameData);

        const iron = result.rawMaterials[0];

        // outputPerVein = 1.0 * 1.5 * 1.0 = 1.5/s per vein
        // veinsNeeded = ceil(45 / 1.5) = 30 veins
        // minersNeeded = ceil(30 / 6) = 5 miners
        expect(iron.veinsNeeded).toBe(30);
        expect(iron.minersNeeded).toBe(5);
      });

      it('研究ボーナスがMining Machineにも適用される', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 30]]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        const result = calculateMiningRequirements(calcResult, 2.0, 'Mining Machine', 100, mockGameData);

        const iron = result.rawMaterials[0];

        // outputPerVein = 0.5 * 2.0 = 1.0/s per vein
        // veinsNeeded = ceil(30 / 1.0) = 30 veins
        // minersNeeded = ceil(30 / 6) = 5 miners
        expect(iron.veinsNeeded).toBe(30);
        expect(iron.minersNeeded).toBe(5);
      });
    });

    describe('作業速度乗数', () => {
      it('Advanced Mining Machine 150% speedを計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 90]]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 150, mockGameData);

        const iron = result.rawMaterials[0];

        // outputPerVein = 1.0 * 1.0 * 1.5 = 1.5/s per vein
        // veinsNeeded = ceil(90 / 1.5) = 60 veins
        // minersNeeded = ceil(60 / 6) = 10 miners
        // powerMultiplier = (150/100)^2 = 2.25
        expect(iron.workSpeedMultiplier).toBe(150);
        expect(iron.veinsNeeded).toBe(60);
        expect(iron.minersNeeded).toBe(10);
        expect(iron.powerMultiplier).toBe(2.25);
      });

      it('Advanced Mining Machine 200% speedを計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 120]]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 200, mockGameData);

        const iron = result.rawMaterials[0];

        // outputPerVein = 1.0 * 1.0 * 2.0 = 2.0/s per vein
        // veinsNeeded = ceil(120 / 2.0) = 60 veins
        // powerMultiplier = (200/100)^2 = 4.0
        expect(iron.workSpeedMultiplier).toBe(200);
        expect(iron.veinsNeeded).toBe(60);
        expect(iron.powerMultiplier).toBe(4.0);
      });

      it('Advanced Mining Machine 300% speedを計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 180]]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 300, mockGameData);

        const iron = result.rawMaterials[0];

        // outputPerVein = 1.0 * 1.0 * 3.0 = 3.0/s per vein
        // veinsNeeded = ceil(180 / 3.0) = 60 veins
        // powerMultiplier = (300/100)^2 = 9.0
        expect(iron.workSpeedMultiplier).toBe(300);
        expect(iron.veinsNeeded).toBe(60);
        expect(iron.powerMultiplier).toBe(9.0);
      });
    });

    describe('液体採掘設備', () => {
      it('Water（水）のウォーターポンプを計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1000, 1.0]]), // 1.0 Water/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Water: 50/min = 0.833.../s per pump, 研究ボーナスなし (1.0)
        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 100, mockGameData);

        const water = result.rawMaterials[0];

        // baseSpeedPerSecond = 50/60 = 0.833.../s per pump
        // outputPerSecond = 0.833... * 1.0 = 0.833.../s per pump
        // machinesNeeded = ceil(1.0 / 0.833...) = 2 pumps
        expect(water.itemId).toBe(1000);
        expect(water.machineType).toBe('Water Pump');
        expect(water.outputPerSecond).toBeCloseTo(0.833333, 5);
        expect(water.minersNeeded).toBe(2);
        expect(water.veinsNeeded).toBe(2); // For liquid equipment, machines = "veins"
        expect(water.workSpeedMultiplier).toBe(100); // Fixed speed
        expect(water.powerMultiplier).toBe(1.0); // Fixed power
        expect(water.orbitCollectorsNeeded).toBeUndefined();
      });

      it('Crude Oil（原油）のオイル抽出器を計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1007, 8.0]]), // 8.0 Crude Oil/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Crude Oil: 240/min = 4.0/s per extractor, 研究ボーナスなし (1.0)
        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 100, mockGameData);

        const oil = result.rawMaterials[0];

        // baseSpeedPerSecond = 240/60 = 4.0/s per extractor
        // outputPerSecond = 4.0 * 1.0 = 4.0/s per extractor
        // machinesNeeded = ceil(8.0 / 4.0) = 2 extractors
        expect(oil.itemId).toBe(1007);
        expect(oil.machineType).toBe('Oil Extractor');
        expect(oil.outputPerSecond).toBe(4.0);
        expect(oil.minersNeeded).toBe(2);
        expect(oil.veinsNeeded).toBe(2); // For liquid equipment, machines = "veins"
        expect(oil.workSpeedMultiplier).toBe(100); // Fixed speed
        expect(oil.powerMultiplier).toBe(1.0); // Fixed power
        expect(oil.orbitCollectorsNeeded).toBeUndefined();
      });

      it('Sulfuric Acid（硫酸）のウォーターポンプを計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1116, 2.5]]), // 2.5 Sulfuric Acid/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Sulfuric Acid: 50/min = 0.833.../s per pump, 研究ボーナスなし (1.0)
        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 100, mockGameData);

        const sulfuric = result.rawMaterials[0];

        // baseSpeedPerSecond = 50/60 = 0.833.../s per pump
        // outputPerSecond = 0.833... * 1.0 = 0.833.../s per pump
        // machinesNeeded = ceil(2.5 / 0.833...) = 3 pumps
        expect(sulfuric.itemId).toBe(1116);
        expect(sulfuric.machineType).toBe('Water Pump');
        expect(sulfuric.outputPerSecond).toBeCloseTo(0.833333, 5);
        expect(sulfuric.minersNeeded).toBe(3);
        expect(sulfuric.veinsNeeded).toBe(3); // For liquid equipment, machines = "veins"
        expect(sulfuric.workSpeedMultiplier).toBe(100); // Fixed speed
        expect(sulfuric.powerMultiplier).toBe(1.0); // Fixed power
        expect(sulfuric.orbitCollectorsNeeded).toBeUndefined();
      });

      it('液体採掘設備に研究ボーナスを適用する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1000, 1.67]]), // 1.67 Water/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Water: 50/min = 0.833.../s per pump, 研究ボーナス+100% (2.0)
        const result = calculateMiningRequirements(calcResult, 2.0, 'Advanced Mining Machine', 100, mockGameData);

        const water = result.rawMaterials[0];

        // baseSpeedPerSecond = 50/60 = 0.833.../s per pump
        // outputPerSecond = 0.833... * 2.0 = 1.666.../s per pump
        // machinesNeeded = ceil(1.67 / 1.666...) = 2 pumps
        expect(water.miningSpeedBonus).toBe(2.0);
        expect(water.outputPerSecond).toBeCloseTo(1.666667, 5);
        expect(water.minersNeeded).toBe(2);
        expect(water.machineType).toBe('Water Pump');
      });

      it('液体採掘設備は速度設定の影響を受けない', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1007, 4.0]]), // 4.0 Crude Oil/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Crude Oil: 240/min = 4.0/s per extractor, 速度設定300%でも影響なし
        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 300, mockGameData);

        const oil = result.rawMaterials[0];

        // 速度設定300%でも液体採掘設備は影響を受けない
        expect(oil.outputPerSecond).toBe(4.0); // 4.0/s per extractor (unchanged)
        expect(oil.minersNeeded).toBe(1); // ceil(4.0 / 4.0) = 1
        expect(oil.workSpeedMultiplier).toBe(100); // Always 100% for liquid equipment
        expect(oil.powerMultiplier).toBe(1.0); // Always 1.0x for liquid equipment
        expect(oil.machineType).toBe('Oil Extractor');
      });

      it('液体採掘設備と通常の鉱脈採掘を混在させる', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([
            [1001, 6.0], // Iron Ore (regular mining)
            [1000, 1.0], // Water (liquid mining)
            [1007, 4.0], // Crude Oil (liquid mining)
          ]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 100, mockGameData);

        expect(result.rawMaterials).toHaveLength(3);

        // ソート順: Iron (6.0), Crude Oil (4.0), Water (1.0)
        expect(result.rawMaterials[0].itemId).toBe(1001); // Iron: 6.0/s
        expect(result.rawMaterials[1].itemId).toBe(1007); // Crude Oil: 4.0/s
        expect(result.rawMaterials[2].itemId).toBe(1000); // Water: 1.0/s

        // Iron: ceil(ceil(6.0/1.0) / 6) = ceil(6/6) = 1 miner
        expect(result.rawMaterials[0].minersNeeded).toBe(1);
        expect(result.rawMaterials[0].machineType).toBe('Advanced Mining Machine');

        // Crude Oil: ceil(4.0 / 4.0) = 1 extractor
        expect(result.rawMaterials[1].minersNeeded).toBe(1);
        expect(result.rawMaterials[1].machineType).toBe('Oil Extractor');

        // Water: ceil(1.0 / 0.833...) = 2 pumps
        expect(result.rawMaterials[2].minersNeeded).toBe(2);
        expect(result.rawMaterials[2].machineType).toBe('Water Pump');

        // 総採掘機: 1 + 1 + 2 = 4
        expect(result.totalMiners).toBe(4);
      });
    });

    describe('軌道採掘機', () => {
      it('Hydrogen（水素）の軌道採掘機を計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1120, 8.4]]), // 8.4 Hydrogen/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Hydrogen: 0.84/s per collector, 研究ボーナスなし (1.0)
        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 100, mockGameData);

        const hydrogen = result.rawMaterials[0];

        // orbitalCollectorSpeed = 0.84 * 1.0 = 0.84/s per collector
        // orbitCollectorsNeeded = ceil(8.4 / 0.84) = 10 collectors
        expect(hydrogen.itemId).toBe(1120);
        expect(hydrogen.orbitalCollectorSpeed).toBe(0.84);
        expect(hydrogen.orbitCollectorsNeeded).toBe(10);
        expect(result.totalOrbitalCollectors).toBe(10);
      });

      it('Deuterium（重水素）の軌道採掘機を計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1121, 0.3]]), // 0.3 Deuterium/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Deuterium: 0.03/s per collector, 研究ボーナスなし (1.0)
        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 100, mockGameData);

        const deuterium = result.rawMaterials[0];

        // orbitalCollectorSpeed = 0.03 * 1.0 = 0.03/s per collector
        // orbitCollectorsNeeded = ceil(0.3 / 0.03) = 10 collectors
        expect(deuterium.itemId).toBe(1121);
        expect(deuterium.orbitalCollectorSpeed).toBe(0.03);
        expect(deuterium.orbitCollectorsNeeded).toBe(10);
        expect(result.totalOrbitalCollectors).toBe(10);
      });

      it('研究ボーナスが軌道採掘機の速度に適用される', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1120, 16.8]]), // 16.8 Hydrogen/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Hydrogen: 0.84/s * 2.0 = 1.68/s per collector
        const result = calculateMiningRequirements(calcResult, 2.0, 'Advanced Mining Machine', 100, mockGameData);

        const hydrogen = result.rawMaterials[0];

        // orbitalCollectorSpeed = 0.84 * 2.0 = 1.68/s per collector
        // orbitCollectorsNeeded = ceil(16.8 / 1.68) = 10 collectors
        expect(hydrogen.orbitalCollectorSpeed).toBe(1.68);
        expect(hydrogen.orbitCollectorsNeeded).toBe(10);
      });
    });

    describe('動的電力計算', () => {
      it('任意の速度設定で電力倍率を動的に計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 60]]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // 101% speed (POWER_MULTIPLIER_BY_SPEEDに定義されていない値)
        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 101, mockGameData);

        const iron = result.rawMaterials[0];

        // powerMultiplier = (101/100)^2 = 1.0201
        expect(iron.workSpeedMultiplier).toBe(101);
        expect(iron.powerMultiplier).toBeCloseTo(1.0201, 4);
      });

      it('125% speedで電力倍率を動的に計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 60]]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 125, mockGameData);

        const iron = result.rawMaterials[0];

        // powerMultiplier = (125/100)^2 = 1.5625
        expect(iron.workSpeedMultiplier).toBe(125);
        expect(iron.powerMultiplier).toBe(1.5625);
      });

      it('275% speedで電力倍率を動的に計算する', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 60]]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 275, mockGameData);

        const iron = result.rawMaterials[0];

        // powerMultiplier = (275/100)^2 = 7.5625
        expect(iron.workSpeedMultiplier).toBe(275);
        expect(iron.powerMultiplier).toBe(7.5625);
      });

      it('Mining Machineでは速度に関係なく電力倍率は1.0', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 30]]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // Mining Machineで200% speedを指定しても、実際は100%として扱われる
        const result = calculateMiningRequirements(calcResult, 1.0, 'Mining Machine', 200, mockGameData);

        const iron = result.rawMaterials[0];

        expect(iron.workSpeedMultiplier).toBe(100); // Mining Machineは常に100%
        expect(iron.powerMultiplier).toBe(1.0); // Mining Machineは常に1.0x
        expect(iron.machineType).toBe('Mining Machine');
      });
    });

    describe('統合テスト', () => {
      it('複数の原材料と軌道採掘機を含む複雑なケース', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([
            [1001, 60], // Iron Ore
            [1120, 8.4], // Hydrogen (orbital collector option)
            [1002, 30], // Copper Ore
          ]),
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        const result = calculateMiningRequirements(calcResult, 1.0, 'Advanced Mining Machine', 100, mockGameData);

        expect(result.rawMaterials).toHaveLength(3);

        // ソート順: Iron (60), Copper (30), Hydrogen (8.4)
        expect(result.rawMaterials[0].itemId).toBe(1001);
        expect(result.rawMaterials[1].itemId).toBe(1002);
        expect(result.rawMaterials[2].itemId).toBe(1120);

        // Iron: 10 miners
        expect(result.rawMaterials[0].minersNeeded).toBe(10);

        // Copper: 5 miners
        expect(result.rawMaterials[1].minersNeeded).toBe(5);

        // Hydrogen: 10 orbital collectors (alternative), 2 miners (if using miners)
        expect(result.rawMaterials[2].orbitCollectorsNeeded).toBe(10);
        expect(result.rawMaterials[2].minersNeeded).toBe(2); // ceil(ceil(8.4/1.0) / 6) = ceil(9/6) = 2

        // 総採掘機: 10 + 5 + 2 = 17 (すべての原材料を含む、Hydrogenはminersでも可能)
        expect(result.totalMiners).toBe(17);

        // 総軌道採掘機: 10
        expect(result.totalOrbitalCollectors).toBe(10);
      });

      it('研究ボーナスと速度設定を組み合わせる', () => {
        const calcResult: CalculationResult = {
          rootNode: {} as any,
          rawMaterials: new Map([[1001, 180]]), // 180 Iron Ore/s
          totalMachines: 0,
          totalPower: { machines: 0, sorters: 0, total: 0 },
        };

        // 研究ボーナス+100% (2.0), 速度設定 150%
        const result = calculateMiningRequirements(calcResult, 2.0, 'Advanced Mining Machine', 150, mockGameData);

        const iron = result.rawMaterials[0];

        // outputPerVein = 1.0 * 2.0 * 1.5 = 3.0/s per vein
        // veinsNeeded = ceil(180 / 3.0) = 60 veins
        // minersNeeded = ceil(60 / 6) = 10 miners
        // powerMultiplier = (150/100)^2 = 2.25
        expect(iron.veinsNeeded).toBe(60);
        expect(iron.minersNeeded).toBe(10);
        expect(iron.powerMultiplier).toBe(2.25);
      });
    });
  });

  describe('POWER_MULTIPLIER_BY_SPEED', () => {
    it('速度設定別の電力乗数が正しい', () => {
      // 100% speed → 1.0x power
      expect(POWER_MULTIPLIER_BY_SPEED[100]).toBe(1.0);

      // 150% speed → 2.25x power
      expect(POWER_MULTIPLIER_BY_SPEED[150]).toBe(2.25);

      // 200% speed → 4.0x power
      expect(POWER_MULTIPLIER_BY_SPEED[200]).toBe(4.0);

      // 250% speed → 6.25x power
      expect(POWER_MULTIPLIER_BY_SPEED[250]).toBe(6.25);

      // 300% speed → 9.0x power
      expect(POWER_MULTIPLIER_BY_SPEED[300]).toBe(9.0);
    });
  });
});
