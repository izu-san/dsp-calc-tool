import { describe, it, expect } from 'vitest';
import { calculatePowerConsumption } from '../powerCalculation';
import type { RecipeTreeNode } from '../../types/calculation';
import type { Machine, Recipe } from '../../types/game-data';

// Mock machine data
const mockArcSmelter: Machine = {
  id: 2302,
  name: 'Arc Smelter',
  Type: 'Smelt',
  assemblerSpeed: 10000,
  workEnergyPerTick: 12, // 12 * 60 / 1000 = 0.72 kW
  idleEnergyPerTick: 4,
  exchangeEnergyPerTick: 0,
  isPowerConsumer: true,
  isPowerExchanger: false,
  isRaw: false,
};

const mockAssembler: Machine = {
  id: 2303,
  name: 'Assembling Machine Mk.I',
  Type: 'Assemble',
  assemblerSpeed: 7500,
  workEnergyPerTick: 9, // 9 * 60 / 1000 = 0.54 kW
  idleEnergyPerTick: 3,
  exchangeEnergyPerTick: 0,
  isPowerConsumer: true,
  isPowerExchanger: false,
  isRaw: false,
};

const mockChemicalPlant: Machine = {
  id: 2309,
  name: 'Chemical Plant',
  Type: 'Chemical',
  assemblerSpeed: 10000,
  workEnergyPerTick: 15, // 15 * 60 / 1000 = 0.9 kW
  idleEnergyPerTick: 5,
  exchangeEnergyPerTick: 0,
  isPowerConsumer: true,
  isPowerExchanger: false,
  isRaw: false,
};

const mockZeroPowerMachine: Machine = {
  id: 9999,
  name: 'Zero Power Machine',
  Type: 'Assemble',
  assemblerSpeed: 10000,
  workEnergyPerTick: 0, // 電力消費なし
  idleEnergyPerTick: 0,
  exchangeEnergyPerTick: 0,
  isPowerConsumer: false,
  isPowerExchanger: false,
  isRaw: false,
};

const mockRecipe: Recipe = {
  SID: 1,
  name: 'Test Recipe',
  Type: 'Smelt',
  Explicit: false,
  TimeSpend: 60,
  Items: [{ id: 1001, name: 'Input', count: 1, Type: 'Resource', isRaw: true }],
  Results: [{ id: 1101, name: 'Output', count: 1, Type: 'Material', isRaw: false }],
  GridIndex: '1101',
  productive: false,
};

describe('calculatePowerConsumption', () => {
  // 基本機能テスト
  describe('基本機能', () => {
    it('単一機械の電力を計算する（workEnergyPerTick × 60 / 1000 kW）', () => {
      const node: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(node);

      // 1機あたり: 12 * 60 / 1000 = 0.72 kW
      // 10機: 0.72 * 10 = 7.2 kW
      expect(result.total).toBeCloseTo(7.2, 2);
      expect(result.byMachine).toHaveLength(1);
      expect(result.byMachine[0].machineId).toBe(2302);
      expect(result.byMachine[0].machineName).toBe('Arc Smelter');
      expect(result.byMachine[0].machineCount).toBe(10);
      expect(result.byMachine[0].powerPerMachine).toBeCloseTo(0.72, 2);
      expect(result.byMachine[0].totalPower).toBeCloseTo(7.2, 2);
    });

    it('複数機械の電力を集計する', () => {
      const childNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter, // 0.72 kW/機
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler, // 0.54 kW/機
        targetOutputRate: 15,
        machineCount: 8,
        inputs: [],
        children: [childNode],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode);

      // Arc Smelter: 0.72 * 5 = 3.6 kW
      // Assembler: 0.54 * 8 = 4.32 kW
      // Total: 7.92 kW
      expect(result.total).toBeCloseTo(7.92, 2);
      expect(result.byMachine).toHaveLength(2);
    });

    it('電力割合（パーセンテージ）を計算する', () => {
      const child1: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter, // 0.72 kW/機
        targetOutputRate: 30,
        machineCount: 10, // 7.2 kW
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const child2: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockChemicalPlant, // 0.9 kW/機
        targetOutputRate: 20,
        machineCount: 4, // 3.6 kW
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler, // 0.54 kW/機
        targetOutputRate: 15,
        machineCount: 5, // 2.7 kW
        inputs: [],
        children: [child1, child2],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode);

      // Total: 7.2 + 3.6 + 2.7 = 13.5 kW
      expect(result.total).toBeCloseTo(13.5, 2);

      // Arc Smelter: 7.2 / 13.5 = 53.33%
      const arcSmelter = result.byMachine.find(m => m.machineId === 2302);
      expect(arcSmelter?.percentage).toBeCloseTo(53.33, 1);

      // Chemical Plant: 3.6 / 13.5 = 26.67%
      const chemicalPlant = result.byMachine.find(m => m.machineId === 2309);
      expect(chemicalPlant?.percentage).toBeCloseTo(26.67, 1);

      // Assembler: 2.7 / 13.5 = 20%
      const assembler = result.byMachine.find(m => m.machineId === 2303);
      expect(assembler?.percentage).toBeCloseTo(20, 1);
    });

    it('機械タイプ別にグループ化する', () => {
      const child1: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 2,
        isRawMaterial: false,
      };

      const child2: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter, // 同じ機械タイプ
        targetOutputRate: 20,
        machineCount: 3,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 2,
        isRawMaterial: false,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler,
        targetOutputRate: 15,
        machineCount: 4,
        inputs: [],
        children: [child1, child2],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode);

      // Arc Smelterは統合されるべき
      expect(result.byMachine).toHaveLength(2);
      
      const arcSmelter = result.byMachine.find(m => m.machineId === 2302);
      expect(arcSmelter?.machineCount).toBe(8); // 5 + 3
      expect(arcSmelter?.totalPower).toBeCloseTo(5.76, 2); // 0.72 * 8
    });

    it('電力消費量の降順でソートする', () => {
      const child1: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler, // 0.54 * 3 = 1.62 kW
        targetOutputRate: 10,
        machineCount: 3,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const child2: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockChemicalPlant, // 0.9 * 10 = 9.0 kW
        targetOutputRate: 20,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter, // 0.72 * 5 = 3.6 kW
        targetOutputRate: 15,
        machineCount: 5,
        inputs: [],
        children: [child1, child2],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode);

      // 降順: Chemical Plant (9.0) > Arc Smelter (3.6) > Assembler (1.62)
      expect(result.byMachine[0].machineId).toBe(2309); // Chemical Plant
      expect(result.byMachine[1].machineId).toBe(2302); // Arc Smelter
      expect(result.byMachine[2].machineId).toBe(2303); // Assembler
    });
  });

  // エッジケーステスト
  describe('エッジケース', () => {
    it('nullノードの処理（total: 0, byMachine: []）', () => {
      const result = calculatePowerConsumption(null);

      expect(result.total).toBe(0);
      expect(result.byMachine).toEqual([]);
    });

    it('原材料ノード（機械なし）をスキップする', () => {
      const rawMaterialNode: RecipeTreeNode = {
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 30,
        machineCount: 0,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
        depth: 1,
        isRawMaterial: true,
        itemId: 1001,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [rawMaterialNode],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode);

      // 原材料ノードは無視され、Arc Smelterのみ
      expect(result.byMachine).toHaveLength(1);
      expect(result.byMachine[0].machineId).toBe(2302);
    });

    it('workEnergyPerTickが0の機械を処理する', () => {
      const node: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockZeroPowerMachine,
        targetOutputRate: 10,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(node);

      expect(result.total).toBe(0);
      expect(result.byMachine).toHaveLength(1);
      expect(result.byMachine[0].powerPerMachine).toBe(0);
      expect(result.byMachine[0].totalPower).toBe(0);
    });
  });

  // 検証テスト
  describe('検証テスト', () => {
    it('パーセンテージの合計が100%になる', () => {
      const child1: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const child2: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockChemicalPlant,
        targetOutputRate: 20,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler,
        targetOutputRate: 15,
        machineCount: 8,
        inputs: [],
        children: [child1, child2],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode);

      const totalPercentage = result.byMachine.reduce(
        (sum, item) => sum + item.percentage,
        0
      );

      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('深い階層ツリーの処理（再帰的集計）', () => {
      // 5階層のツリー
      const level4: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 5,
        machineCount: 2,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 4,
        isRawMaterial: false,
      };

      const level3: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler,
        targetOutputRate: 5,
        machineCount: 3,
        inputs: [],
        children: [level4],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 3,
        isRawMaterial: false,
      };

      const level2: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockChemicalPlant,
        targetOutputRate: 5,
        machineCount: 4,
        inputs: [],
        children: [level3],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 2,
        isRawMaterial: false,
      };

      const level1: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 5,
        machineCount: 5,
        inputs: [],
        children: [level2],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const rootNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler,
        targetOutputRate: 5,
        machineCount: 6,
        inputs: [],
        children: [level1],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(rootNode);

      // Arc Smelter: 2 + 5 = 7機, 0.72 * 7 = 5.04 kW
      // Assembler: 3 + 6 = 9機, 0.54 * 9 = 4.86 kW
      // Chemical Plant: 4機, 0.9 * 4 = 3.6 kW
      // Total: 13.5 kW
      expect(result.total).toBeCloseTo(13.5, 2);
      expect(result.byMachine).toHaveLength(3);
    });
  });
});
